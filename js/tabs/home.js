(function (global) {
  function fmtHoursAgo(ms) {
    if (ms == null) return '—';
    const h = ms / 3600000;
    if (h < 1) return `${Math.max(1, Math.round(ms / 60000))} ${I18N.t('home_min')}`;
    if (h < 48) return `${Math.round(h)}h`;
    return `${Math.round(h / 24)}d`;
  }

  function render(state) {
    const substance = Substances.get(state.profile.substance);
    const lang = I18N.getLang();
    const unit = Substances.unit(state.profile.substance, lang, 1);
    const units = Substances.unit(state.profile.substance, lang, 2);
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

    const nextMilestone = Substances.healthMilestones(state.profile.substance).find(m => m.hours > msSince / 3600000);
    const goalPct = nextMilestone ? Math.min(100, Math.round((msSince / 3600000 / nextMilestone.hours) * 100)) : 100;
    const goalLabel = nextMilestone
      ? I18N.t('home_next_goal_in', { time: nextMilestone.hours < 1 ? Math.round(nextMilestone.hours * 60) + ' ' + I18N.t('home_min') : nextMilestone.hours < 24 ? Math.round(nextMilestone.hours) + 'h' : Math.round(nextMilestone.hours / 24) + 'd' })
      : I18N.t('home_all_goals_reached');

    const overLimit = todayCount > limit;
    const quickType = state.profile.quickAddType || Derive.lastEntryDefaults(state).type;
    const quickTrigger = state.profile.quickAddTrigger || Derive.lastEntryDefaults(state).trigger;
    const gaugeColor = overLimit ? 'var(--accent-red)' : (usedPct >= 85 ? 'var(--accent-orange)' : 'var(--accent-green)');
    const cigWord = n => n === 1 ? I18N.t('home_unit_one', { unit }) : I18N.t('home_unit_many', { n, units });
    const over = todayCount - limit;
    const gaugeCaption = overLimit
      ? I18N.t('home_over_by', { n: cigWord(over) })
      : I18N.t('home_left_today', { n: cigWord(remaining) });

    return `
      <div class="card">
        <div class="card-row" style="justify-content:space-between;margin-bottom:4px;">
          <div class="card-row">
            <div class="icon-tile ${overLimit ? 'tile-red' : 'tile-orange'}">${Icons.svg(substance.icon, 22)}</div>
            <div>
              <p class="card-title" style="margin:0;">${I18N.t('home_daily_limit')}</p>
              <p class="card-sub">${I18N.t('home_daily_limit_sub')}</p>
            </div>
          </div>
          <span class="pill ${overLimit ? '' : 'pill-green'}" title="${I18N.t('home_progress_tooltip')}">${I18N.t('home_plan_progress', { pct: reducedPct })}</span>
        </div>

        <div class="gauge-wrap">
          ${Charts.gaugeChart({ pct: usedPct, color: gaugeColor })}
          <div class="gauge-center">
            <div class="gauge-value">${todayCount}<span class="gauge-max">/${limit}</span></div>
            <div class="gauge-label">${I18N.t('home_cigarettes_today', { units })}</div>
          </div>
        </div>
        <p class="gauge-caption">${Charts.esc(gaugeCaption)}</p>

        <div class="gauge-controls">
          <button class="gauge-btn plus" data-action="quick-add" aria-label="Quick-log">+</button>
          <button class="gauge-type-chip" data-action="pick-quick-type" aria-label="Choose type">
            <span>${Charts.esc(Substances.typeLabel(state.profile.substance, quickType))}</span><span class="gauge-type-caret">▾</span>
          </button>
          <button class="gauge-btn minus" data-action="quick-remove" ${todayCount === 0 ? 'disabled' : ''} aria-label="Remove the last entry">−</button>
        </div>
        <button class="gauge-trigger-chip" data-action="pick-quick-trigger" aria-label="Choose reason">
          ${Icons.svg('bulb', 14)}<span>${Charts.esc(Store.triggerLabel(quickTrigger))}</span><span class="gauge-type-caret">▾</span>
        </button>
      </div>

      <div class="stat-grid-2">
        ${substance.nicotineApplies ? `
        <div class="stat-tile">
          <p class="stat-tile-label">${Icons.svg('smoke', 15)} ${I18N.t('home_nicotine_today')}</p>
          <p class="stat-tile-value ${nicotineOk ? 'green' : 'orange'}">${nicotine} mg</p>
          <p class="card-sub">${nicotineOk ? I18N.t('home_within_target') : I18N.t('home_above_target')}</p>
        </div>
        ` : `
        <div class="stat-tile">
          <p class="stat-tile-label">${Icons.svg('smoke', 15)} ${I18N.t('home_doses_today')}</p>
          <p class="stat-tile-value">${todayCount}</p>
        </div>
        `}
        <div class="stat-tile">
          <p class="stat-tile-label">${Icons.svg('clock', 15)} ${I18N.t('home_last_unit', { unit })}</p>
          <p class="stat-tile-value">${lastDate ? fmtHoursAgo(msSince) : '—'}</p>
          <p class="card-sub">${lastDate ? I18N.t('home_a_little_while_ago') : I18N.t('home_not_smoked_yet')}</p>
        </div>
      </div>

      <div class="card">
        <p class="card-title">${I18N.t('home_smoke_free_time')}</p>
        <p class="card-sub">${I18N.t('home_keep_it_up')}</p>
        <div class="countdown-row" id="homeCountdown">
          <div class="countdown-cell"><div class="countdown-num" id="cdHours">00</div><div class="countdown-label">${I18N.t('home_hours')}</div></div>
          <div class="countdown-cell"><div class="countdown-num" id="cdMinutes">00</div><div class="countdown-label">${I18N.t('home_min')}</div></div>
          <div class="countdown-cell"><div class="countdown-num" id="cdSeconds">00</div><div class="countdown-label">${I18N.t('home_sec')}</div></div>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${goalPct}%"></div></div>
        <div class="progress-meta"><span>${goalPct}%</span><span>${goalLabel}</span></div>
      </div>

      ${Tips.wheelHtml()}

      <div class="stat-grid-2">
        <div class="stat-tile">
          <p class="stat-tile-label">${Icons.svg('trophy', 15)} ${I18N.t('home_best_streak')}</p>
          <p class="stat-tile-value">${longest}d</p>
        </div>
        <div class="stat-tile">
          <p class="stat-tile-label">${Icons.svg('flame', 15)} ${I18N.t('home_current_streak')}</p>
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
