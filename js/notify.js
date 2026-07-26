/* Goal-met celebration notifications.

   The app is client-only, so "at the end of the day" is evaluated the next time
   the app is open after a day has completed: sync() scans every finished day and,
   for each one where the user stayed within their daily limit, records a
   celebration notification. The bell surfaces them and the celebrate overlay
   shows a confetti "well done" card. */
(function (global) {
  const CONFETTI_COLORS = ['--accent-blue', '--accent-green', '--accent-yellow', '--accent-violet', '--accent-red'];

  function ensure(state) {
    if (!Array.isArray(state.notifications)) state.notifications = [];
    if (state.notifyBaseline == null) state.notifyBaseline = Store.todayKey();
  }

  function dayNumbers(state, dayKey) {
    const start = Store.parseDateKey(state.program.startDate);
    const dayIdx = Store.daysBetween(start, Store.parseDateKey(dayKey));
    const limit = Derive.dailyLimitForDayIndex(state, dayIdx);
    const actual = Derive.countForDayKey(state, dayKey);
    return { limit, actual, under: Math.max(0, limit - actual) };
  }

  /* Record a goal notification for every completed successful day that doesn't
     have one yet. Returns the list of newly created notifications. */
  function sync(state) {
    ensure(state);
    if (!(state.profile && state.profile.notificationsEnabled)) return [];

    const today = Store.todayKey();
    const seen = new Set(state.notifications.filter(n => n.type === 'goal').map(n => n.dayKey));
    const created = [];

    for (const d of Derive.dayStatus(state)) {
      if (d.key >= today) continue;              // only completed (past) days
      if (d.key < state.notifyBaseline) continue; // don't backfill before we started
      if (!d.success) continue;                  // stayed within the daily limit?
      if (seen.has(d.key)) continue;
      const notif = { id: Store.uid(), type: 'goal', dayKey: d.key, createdAt: new Date().toISOString(), read: false };
      state.notifications.push(notif);
      created.push(notif);
    }
    if (created.length) Store.save(state);
    return created;
  }

  function unreadCount(state) {
    ensure(state);
    return state.notifications.filter(n => !n.read).length;
  }

  function latest(state) {
    ensure(state);
    if (!state.notifications.length) return null;
    return state.notifications[state.notifications.length - 1];
  }

  function markAllRead(state) {
    ensure(state);
    let changed = false;
    state.notifications.forEach(n => { if (!n.read) { n.read = true; changed = true; } });
    if (changed) Store.save(state);
  }

  function dayLabel(dayKey) {
    const yesterday = Store.dateKey(Store.addDays(new Date(), -1));
    if (dayKey === yesterday) return I18N.t('notif_yesterday');
    if (dayKey === Store.todayKey()) return I18N.t('notif_today');
    const lang = I18N.getLang();
    try {
      return Store.parseDateKey(dayKey).toLocaleDateString(lang, { day: 'numeric', month: 'short' });
    } catch (e) {
      return dayKey;
    }
  }

  function cardHtml(notif, state) {
    const { current } = Derive.streaks(state);
    const nums = dayNumbers(state, notif.dayKey);
    return `
      <button type="button" class="premium-close celebrate-close" data-action="celebrate-close" aria-label="Close">✕</button>
      <div class="celebrate-icon">${Icons.svg('trophy', 34)}</div>
      <p class="celebrate-day">${Charts.esc(dayLabel(notif.dayKey))}</p>
      <h1 class="celebrate-title">${I18N.t('notif_goal_title')}</h1>
      <p class="celebrate-sub">${I18N.t('notif_goal_sub')}</p>
      <div class="celebrate-stats">
        <div class="celebrate-stat">
          <div class="celebrate-stat-value">${nums.actual}<span class="celebrate-stat-max">/${nums.limit}</span></div>
          <div class="celebrate-stat-label">${I18N.t('notif_stat_count')}</div>
        </div>
        <div class="celebrate-stat">
          <div class="celebrate-stat-value green">${current}</div>
          <div class="celebrate-stat-label">${I18N.t('notif_stat_streak')}</div>
        </div>
      </div>
      <button type="button" class="celebrate-cta" data-action="celebrate-close">${I18N.t('notif_cta')}</button>
    `;
  }

  function fireConfetti() {
    const box = document.getElementById('celebrateConfetti');
    if (!box) return;
    let html = '';
    for (let i = 0; i < 60; i++) {
      const left = Math.random() * 100;
      const delay = Math.random() * 0.5;
      const dur = 1.7 + Math.random() * 1.4;
      const size = 6 + Math.random() * 7;
      const rot = Math.floor(Math.random() * 360);
      const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      const radius = i % 3 === 0 ? '50%' : '1px';
      html += `<span class="confetti-piece" style="left:${left}%;width:${size}px;height:${(size * 0.55).toFixed(1)}px;`
        + `border-radius:${radius};background:var(${color});--r:${rot}deg;`
        + `animation-delay:${delay.toFixed(2)}s;animation-duration:${dur.toFixed(2)}s"></span>`;
    }
    box.innerHTML = html;
    // Clear pieces once the longest animation is done so they don't linger.
    clearTimeout(fireConfetti._t);
    fireConfetti._t = setTimeout(() => { if (box) box.innerHTML = ''; }, 3600);
  }

  function open(notif, state) {
    if (!notif) return;
    document.getElementById('celebrateCard').innerHTML = cardHtml(notif, state);
    document.getElementById('celebrateOverlay').hidden = false;
    fireConfetti();
    markAllRead(state);
  }

  function close() {
    const overlay = document.getElementById('celebrateOverlay');
    overlay.hidden = true;
    document.getElementById('celebrateConfetti').innerHTML = '';
  }

  global.Notify = { sync, unreadCount, latest, markAllRead, open, close };
})(window);
