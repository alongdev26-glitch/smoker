/* Cloud Function backing the in-app "Coach" craving-support chat.
   Holds the Anthropic API key server-side (via a Functions secret) so it never
   ships to the browser, and enforces a server-side daily message cap per user
   so the key can't be drained by abuse even though the app has no visible
   sign-up flow (every guest gets a silent anonymous Firebase Auth user). */
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const Anthropic = require('@anthropic-ai/sdk');

admin.initializeApp();
const db = admin.firestore();

const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');

const DAILY_MESSAGE_LIMIT = 30;
const RATE_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_HISTORY_TURNS = 10;
const MAX_MESSAGE_CHARS = 2000;

const SYSTEM_PROMPT = `You are "Coach", a supportive in-app companion inside a quit-smoking app. Your only job is to help the user get through nicotine cravings and stay motivated to quit.

Rules you must always follow:
- You are NOT a doctor, nurse, or medical professional, and must never present yourself as one.
- Never diagnose conditions, never recommend or discuss specific medication or dosages, and never claim to replace medical advice. If the user describes a medical symptom (chest pain, breathing trouble, or anything health-related beyond craving/mood support), tell them clearly and briefly to contact a real doctor or local emergency services, and keep the rest of your reply short and non-clinical.
- If the user expresses intent to harm themselves or others, or expresses hopelessness that sounds like a crisis, do not try to counsel them yourself. Respond with warmth and brevity, and direct them to real crisis resources (in Israel: ER"N, call 1201; elsewhere: encourage contacting local emergency services or a local crisis line). Keep this response short and sincere, not clinical.
- Keep replies short (2-5 sentences), warm, and practical: breathing techniques, urge surfing, distraction, reminding them of their "why", celebrating streaks and small wins.
- Never mention Anthropic, Claude, or any specific AI company or model — you are simply "Coach", part of this app.
- Use the user's stats naturally when relevant, but don't recite them like a report.`;

function buildContextLine(context) {
  if (!context || typeof context !== 'object') return '';
  const parts = [];
  if (typeof context.daysSmokeFree === 'number') parts.push(`${context.daysSmokeFree} days since program start`);
  if (typeof context.currentStreak === 'number') parts.push(`${context.currentStreak}-day streak within goal`);
  if (typeof context.todayCount === 'number' && typeof context.dailyLimit === 'number') {
    parts.push(`${context.todayCount}/${context.dailyLimit} cigarettes today`);
  }
  return parts.join(', ');
}

async function enforceRateLimit(uid) {
  const ref = db.collection('rateLimits').doc(uid);
  const now = Date.now();

  await db.runTransaction(async tx => {
    const doc = await tx.get(ref);
    const data = doc.exists ? doc.data() : null;

    if (!data || now - data.windowStart > RATE_WINDOW_MS) {
      tx.set(ref, { windowStart: now, count: 1 });
      return;
    }
    if (data.count >= DAILY_MESSAGE_LIMIT) {
      const resetAt = data.windowStart + RATE_WINDOW_MS;
      throw new HttpsError('resource-exhausted', 'Daily message limit reached', { resetAt });
    }
    tx.update(ref, { count: admin.firestore.FieldValue.increment(1) });
  });
}

exports.cravingCoachChat = onCall(
  { secrets: [ANTHROPIC_API_KEY], region: 'us-central1', cors: true },
  async request => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Sign-in required.');
    }
    const uid = request.auth.uid;

    const { messages, context } = request.data || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new HttpsError('invalid-argument', 'messages[] is required.');
    }

    const trimmed = messages.slice(-MAX_HISTORY_TURNS).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '').slice(0, MAX_MESSAGE_CHARS)
    }));

    await enforceRateLimit(uid);

    const contextLine = buildContextLine(context);
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() });

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: SYSTEM_PROMPT + (contextLine ? `\n\nUser's current stats: ${contextLine}` : ''),
      messages: trimmed
    });

    const textBlock = response.content.find(b => b.type === 'text');
    const reply = textBlock ? textBlock.text : "Sorry, I couldn't come up with a reply just now.";

    return { reply };
  }
);
