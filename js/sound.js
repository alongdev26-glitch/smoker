/* Small procedural UI sound effects (Web Audio oscillators — no audio files
   to ship or load). Every call is a no-op until the user has interacted with
   the page at least once, same as any autoplay-restricted audio, and all of
   them respect state.profile.soundEffectsEnabled. */
(function (global) {
  let ctx = null;

  function ensureCtx() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, delay, dur, type, peak) {
    const c = ensureCtx();
    if (!c) return;
    const t0 = c.currentTime + (delay || 0);
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(peak || 0.06, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function enabled(state) {
    return !state || !state.profile || state.profile.soundEffectsEnabled !== false;
  }

  // A light tick for frequent, low-weight actions (quick-add, toggles).
  function tap(state) {
    if (!enabled(state)) return;
    tone(640, 0, 0.09, 'sine', 0.05);
  }

  // A short two-note rise for a deliberate save (the full add/edit form).
  function confirm(state) {
    if (!enabled(state)) return;
    tone(520, 0, 0.12, 'sine', 0.06);
    tone(780, 0.05, 0.16, 'sine', 0.05);
  }

  // A fuller three-note chime for celebratory moments (goal met, monthly
  // report, reward redeemed, finishing onboarding).
  function success(state) {
    if (!enabled(state)) return;
    tone(523.25, 0, 0.4, 'sine', 0.07);
    tone(659.25, 0.08, 0.45, 'sine', 0.06);
    tone(783.99, 0.16, 0.55, 'sine', 0.055);
  }

  // A soft descending tone for removing something (undo, delete entry).
  function dismiss(state) {
    if (!enabled(state)) return;
    tone(380, 0, 0.1, 'sine', 0.045);
    tone(260, 0.06, 0.14, 'sine', 0.04);
  }

  global.Sound = { tap, confirm, success, dismiss };
})(window);
