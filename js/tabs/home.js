(function (global) {
  function fmtHoursAgo(ms) {
    if (ms == null) return '—';
    const h = ms / 3600000;
    if (h < 1) return `${Math.max(1, Math.round(ms / 60000))} min`;
    if (h < 48) return `${Math.round(h)}h`;
    return `${Math.round(h / 24)}d`;
  }

  function render(state) {
    const limit = Derive.currentDailyLimit(state);
    const todayCount = Derive.todayCount(state);
    const remaining = Math.max(0, limit - todayCount);
    const usedPct = limit > 0 ? Math.min(100, Math.round((todayCount / limit) * 100)) : 100;
    const reducedPct = Math.max(0, Math.min(100, Math.round((1 - limit / state.program.startCount) * 100)));
    const nicotine = Derive.nicotineTodayMg(state).toFixed(1);
    const nicotineOk = Derive.nicotineTodayMg(state) <= limit * 1.1;
    const lastDate = Derive.lastCigaretteDate(state);
    const msSince = Derive.msSinceLastCigarette(state);
    const { current, longest } = Derive.streaks(state);

    const nextMilestone = Derive.HEALTH_MILESTONES.find(m => m.hours > msSince / 3600000);
    const goalPct = nextMilestone ? Math.min(100, Math.round((msSince / 3600000 / nextMilestone.hours) * 100)) : 100;
    const goalLabel = nextMilestone
      ? `Next goal in ${nextMilestone.hours < 1 ? Math.round(nextMilestone.hours * 60) + ' min' : nextMilestone.hours < 24 ? Math.round(nextMilestone.hours) + 'h' : Math.round(nextMilestone.hours / 24) + 'd'}`
      : 'All recovery goals reached';

    const overLimit = todayCount > limit;
    const quickType = state.profile.quickAddType || Derive.lastEntryDefaults(state).type;
    const gaugeColor = overLimit ? 'var(--accent-red)' : (usedPct >= 85 ? 'var(--accent-orange)' : 'var(--accent-green)');
    const cigWord = n => n === 1 ? '1 cigarette' : `${n} cigarettes`;
    const over = todayCount - limit;
    const gaugeCaption = overLimit
      ? `You went over by ${cigWord(over)}`
      : `${cigWord(remaining)} left today`;

    return `
      <div class="card">
        <div class="card-row" style="justify-content:space-between;margin-bottom:4px;">
          <div class="card-row">
            <div class="icon-tile ${overLimit ? 'tile-red' : 'tile-orange'}">🚬</div>
            <div>
              <p class="card-title" style="margin:0;">Daily limit</p>
              <p class="card-sub">Your target for today, based on your plan</p>
            </div>
          </div>
          <span class="pill ${overLimit ? '' : 'pill-green'}" title="How much your daily limit has dropped since you started the program">Plan progress ${reducedPct}%</span>
        </div>

        <div class="gauge-wrap">
          ${Charts.gaugeChart({ pct: usedPct, color: gaugeColor })}
          <div class="gauge-center">
            <div class="gauge-value">${todayCount}<span class="gauge-max">/${limit}</span></div>
            <div class="gauge-label">cigarettes today</div>
          </div>
        </div>
        <p class="gauge-caption">${Charts.esc(gaugeCaption)}</p>

        <div class="gauge-controls">
          <button class="gauge-btn plus" data-action="quick-add" aria-label="Quick-log a cigarette">+</button>
          <button class="gauge-type-chip" data-action="pick-quick-type" aria-label="Choose cigarette type">
            <span>${Charts.esc(quickType)}</span><span class="gauge-type-caret">▾</span>
          </button>
          <button class="gauge-btn minus" data-action="quick-remove" ${todayCount === 0 ? 'disabled' : ''} aria-label="Remove the last cigarette">−</button>
        </div>
      </div>

      <div class="stat-grid-2">
        <div class="stat-tile">
          <p class="stat-tile-label">💨 Nicotine today</p>
          <p class="stat-tile-value ${nicotineOk ? 'green' : 'orange'}">${nicotine} mg</p>
          <p class="card-sub">${nicotineOk ? 'Within target' : 'Above daily target'}</p>
        </div>
        <div class="stat-tile">
          <p class="stat-tile-label">🕐 Last cigarette</p>
          <p class="stat-tile-value">${lastDate ? fmtHoursAgo(msSince) : '—'}</p>
          <p class="card-sub">${lastDate ? 'a little while ago' : "You haven't smoked yet"}</p>
        </div>
      </div>

      <div class="card">
        <p class="card-title">Smoke-free time</p>
        <p class="card-sub">Keep it up — you're doing great</p>
        <div class="countdown-row" id="homeCountdown">
          <div class="countdown-cell"><div class="countdown-num" id="cdHours">00</div><div class="countdown-label">hours</div></div>
          <div class="countdown-cell"><div class="countdown-num" id="cdMinutes">00</div><div class="countdown-label">min</div></div>
          <div class="countdown-cell"><div class="countdown-num" id="cdSeconds">00</div><div class="countdown-label">sec</div></div>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${goalPct}%"></div></div>
        <div class="progress-meta"><span>${goalPct}%</span><span>${goalLabel}</span></div>
      </div>

      <div class="stat-grid-2">
        <div class="stat-tile">
          <p class="stat-tile-label">🏆 Best streak</p>
          <p class="stat-tile-value">${longest}d</p>
        </div>
        <div class="stat-tile">
          <p class="stat-tile-label">🔥 Current streak</p>
          <p class="stat-tile-value green">${current}d</p>
        </div>
      </div>
    `;
  }

  function tickCountdown(state) {
    const ms = Derive.msSinceLastCigarette(state);
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const hEl = document.getElementById('cdHours');
    const mEl = document.getElementById('cdMinutes');
    const sEl = document.getElementById('cdSeconds');
    if (hEl) hEl.textContent = String(h).padStart(2, '0');
    if (mEl) mEl.textContent = String(m).padStart(2, '0');
    if (sEl) sEl.textContent = String(s).padStart(2, '0');
  }

  global.Tabs = global.Tabs || {};
  global.Tabs.home = { render, tickCountdown };
})(window);
