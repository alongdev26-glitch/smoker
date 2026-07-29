/* In-app AI craving-support chat ("Coach"). Calls the cravingCoachChat Cloud
   Function (js/../functions/index.js) so the Anthropic API key never reaches
   the browser. Falls back to a friendly error if Firebase isn't configured or
   the call fails — the rest of the app works fine either way. */
(function (global) {
  let functions = null;
  if (global.Auth && global.Auth.isConfigured) {
    functions = firebase.app().functions('us-central1');
    if (location.hostname === 'localhost') {
      // Local dev only: point at the Firebase emulator suite, never at prod.
      functions.useEmulator('localhost', 5001);
    }
  }

  let history = [];
  let sending = false;

  function bubbleHtml(msg) {
    const cls = msg.role === 'user' ? 'coach-bubble coach-bubble--user' : 'coach-bubble coach-bubble--coach';
    return `<div class="${cls}">${Charts.esc(msg.content)}</div>`;
  }

  function render() {
    return `
      <div class="coach-header">
        <h2>${I18N.t('coach_title')}</h2>
        <button type="button" class="coach-close" data-action="coach-close" aria-label="Close">✕</button>
      </div>
      <p class="coach-disclaimer">${I18N.t('coach_disclaimer')}</p>
      <p class="coach-crisis-note">${I18N.t('coach_crisis_note')}</p>
      <div class="coach-messages" id="coachMessages">
        ${history.length ? history.map(bubbleHtml).join('') : `<p class="coach-empty">${I18N.t('coach_intro')}</p>`}
      </div>
      <p class="coach-typing" id="coachTyping" hidden>${I18N.t('coach_typing')}</p>
      <form class="coach-input-row" id="coachForm">
        <input class="coach-input" id="coachInputField" type="text" autocomplete="off"
               placeholder="${I18N.t('coach_placeholder')}">
        <button type="submit" class="coach-send">${I18N.t('coach_send')}</button>
      </form>
    `;
  }

  function open(state) {
    history = (state.coach && state.coach.messages) || [];
    document.getElementById('coachPanel').innerHTML = render();
    document.getElementById('coachOverlay').hidden = false;
    document.getElementById('coachForm').addEventListener('submit', e => {
      e.preventDefault();
      if (sending) return;
      const input = document.getElementById('coachInputField');
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      sendMessage(state, text);
    });
    scrollToBottom();
  }

  function close() {
    document.getElementById('coachOverlay').hidden = true;
  }

  async function sendMessage(state, text) {
    sending = true;
    history.push({ role: 'user', content: text });
    persist(state);
    rerenderMessages();
    setTyping(true);

    try {
      if (!functions) throw { code: 'not-configured' };
      const context = {
        daysSmokeFree: Derive.daysSinceStart(state),
        currentStreak: Derive.streaks(state).current,
        todayCount: Derive.todayCount(state),
        dailyLimit: Derive.currentDailyLimit(state)
      };
      const call = functions.httpsCallable('cravingCoachChat');
      const result = await call({ messages: history, context });
      history.push({ role: 'assistant', content: result.data.reply });
      persist(state);
      rerenderMessages();
    } catch (err) {
      // The AI backend isn't reachable — never dead-end the chat. Give a helpful
      // local coping reply, and only surface a toast for genuine failures
      // (rate limit / dropped connection), not for "not configured yet".
      history.push({ role: 'assistant', content: localReply(text) });
      persist(state);
      rerenderMessages();
      // We already gave a helpful reply; only add a toast when retrying the real
      // AI would actually help (rate limit) or the device is plainly offline.
      const code = err && err.code;
      if (code === 'functions/resource-exhausted' || code === 'resource-exhausted' || !navigator.onLine) handleError(err);
    } finally {
      setTyping(false);
      sending = false;
    }
  }

  // Offline coping reply routed by intent. Recognises both English and Hebrew
  // keywords so the reply changes with the kind of message; anything unmatched
  // gets a solid general response. (Real free-form AI needs the Cloud Function.)
  function localReply(text) {
    const t = (text || '').toLowerCase();
    const has = (...ws) => ws.some(w => t.includes(w));
    if (has('thank', 'thx', 'תודה', 'شكرا', 'gracias', 'merci', 'спасибо')) return I18N.t('coach_fb_thanks');
    if (has('hi', 'hello', 'hey', 'שלום', 'היי', 'היי', 'مرحبا', 'hola', 'salut', 'привет')) return I18N.t('coach_fb_greeting');
    if (has('did it', 'resisted', 'proud', 'stayed', 'managed', 'הצלחתי', 'גאה', 'עמדתי', 'lo logré', 'fier', 'горжусь', 'смог')) return I18N.t('coach_fb_proud');
    if (has('fail', 'gave up', 'relapse', 'can\'t', 'cant', 'hard', 'depress', 'sad', 'hopeless', 'נכשל', 'קשה', 'רע לי', 'עצוב', 'לא מצליח', 'התמוטט', 'يائس', 'صعب', 'difícil', 'triste', 'сложно', 'тяжело')) return I18N.t('coach_fb_down');
    if (has('crav', 'smoke', 'cigarette', 'urge', 'want a', 'need a', 'חשק', 'לעשן', 'סיגריה', 'מתחשק', 'دخان', 'سيجارة', 'رغبة', 'fumar', 'ganas', 'envie', 'fumer', 'курить', 'сигарет')) return I18N.t('coach_fb_craving');
    if (has('stress', 'anx', 'nervous', 'overwhelm', 'panic', 'לחץ', 'חרד', 'מתח', 'עצבנ', 'توتر', 'قلق', 'estrés', 'ansios', 'stress', 'anxi', 'стресс', 'тревог')) return I18N.t('coach_fb_stress');
    if (has('bored', 'boring', 'nothing to do', 'שעמום', 'משועמם', 'ملل', 'aburr', 'ennui', 'скук')) return I18N.t('coach_fb_bored');
    if (has('meal', 'eat', 'food', 'coffee', 'lunch', 'dinner', 'ארוחה', 'אוכל', 'קפה', 'وجبة', 'قهوة', 'comer', 'comida', 'café', 'repas', 'еда', 'кофе')) return I18N.t('coach_fb_meal');
    return I18N.t('coach_fb_default');
  }

  function handleError(err) {
    const toast = global.AppToast || (() => {});
    if (err && (err.code === 'functions/resource-exhausted' || err.code === 'resource-exhausted')) {
      toast(I18N.t('coach_rate_limited'));
    } else if (!navigator.onLine) {
      toast(I18N.t('coach_offline'));
    } else {
      toast(I18N.t('coach_error'));
    }
  }

  function persist(state) {
    state.coach = state.coach || { messages: [] };
    state.coach.messages = history.slice(-40);
    Store.save(state);
  }

  function rerenderMessages() {
    const el = document.getElementById('coachMessages');
    if (el) el.innerHTML = history.map(bubbleHtml).join('');
    scrollToBottom();
  }

  function setTyping(on) {
    const el = document.getElementById('coachTyping');
    if (el) el.hidden = !on;
  }

  function scrollToBottom() {
    const el = document.getElementById('coachMessages');
    if (el) el.scrollTop = el.scrollHeight;
  }

  global.Coach = { open, close };
})(window);
