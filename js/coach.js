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
      handleError(err);
    } finally {
      setTyping(false);
      sending = false;
    }
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
