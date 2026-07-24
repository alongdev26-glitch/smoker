(function (global) {
  let weekOffset = 0; // 0 = most recent 7 days, 1 = the 7 before that, etc.

  function formatDate(d) {
    const months = I18N.t('months_long').split(',');
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  function trendForOffset(state, offset) {
    const days = Derive.dayStatus(state);
    const end = days.length - offset * 7;
    const slice = days.slice(Math.max(0, end - 7), Math.max(0, end));
    return slice.map(d => ({ label: Store.weekdayLabel(Store.parseDateKey(d.key)), actual: d.actual, planned: d.limit }));
  }

  function render(state) {
    const dayIdx = Derive.daysSinceStart(state);
    const total = Derive.totalProgramDays(state);
    const remaining = Math.max(0, total - dayIdx);
    const pct = Math.min(100, Math.round((dayIdx / total) * 100));

    const trend = trendForOffset(state, weekOffset);
    const canGoNewer = weekOffset > 0;
    const canGoOlder = (Derive.dayStatus(state).length - (weekOffset + 1) * 7) > 0;

    const barChart = trend.length ? Charts.groupedBarChart({
      categories: trend.map(t => t.label),
      series: [
        { label: I18N.t('stats_legend_actual'), color: 'var(--accent-orange)', data: trend.map(t => t.actual) },
        { label: I18N.t('stats_legend_plan'), color: 'var(--accent-blue)', data: trend.map(t => t.planned) }
      ]
    }) : `<div class="empty-state">${I18N.t('program_no_week_data')}</div>`;

    const milestones = Derive.programMilestones(state);

    return `
      <div class="card-row" style="justify-content:space-between;">
        <div>
          <p class="section-title" style="margin:0;">${I18N.t('program_title')}</p>
          <p class="section-sub">${I18N.t('program_subtitle')}</p>
        </div>
        <button class="icon-btn" data-action="program-restart" aria-label="Restart plan">${Icons.svg('trash', 18)}</button>
      </div>

      <div class="card">
        <div class="card-row" style="justify-content:space-between;">
          <p class="card-title" style="margin:0;">${I18N.t('program_journey')}</p>
          <span class="pill pill-blue">${I18N.t('program_gradual')}</span>
        </div>
        <p class="card-sub" style="margin:8px 0 10px;">${I18N.t('program_started_on', { date: formatDate(Store.parseDateKey(state.program.startDate)) })}</p>
        <div class="card-row" style="align-items:baseline;gap:6px;">
          <span style="font-size:26px;font-weight:800;">${Math.min(dayIdx, total)}</span>
          <span style="color:var(--text-muted);">${I18N.t('program_slash_days', { total })}</span>
        </div>
        <div class="progress-track" style="margin-top:8px;"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div class="progress-meta"><span>${I18N.t('program_days_left', { n: remaining })}</span><span>${pct}%</span></div>
      </div>

      <div class="card">
        <div class="card-row" style="justify-content:space-between;">
          <p class="card-title" style="margin:0;">${I18N.t('program_consumption_trend')}</p>
          <div class="card-row" style="gap:4px;">
            <button class="icon-btn" style="width:30px;height:30px;" data-action="program-week-older" ${canGoOlder ? '' : 'disabled'}>‹</button>
            <button class="icon-btn" style="width:30px;height:30px;" data-action="program-week-newer" ${canGoNewer ? '' : 'disabled'}>›</button>
          </div>
        </div>
        ${Charts.legendHtml([
          { label: I18N.t('stats_legend_actual'), color: 'var(--accent-orange)' },
          { label: I18N.t('stats_legend_plan'), color: 'var(--accent-blue)' }
        ])}
        <div class="chart-wrap">${barChart}</div>
      </div>

      <div class="card">
        <p class="card-title" style="margin-bottom:10px;">${I18N.t('program_details')}</p>
        <div class="settings-row" style="background:transparent;padding:8px 0;">
          <div class="settings-row-text"><p class="settings-row-title">${I18N.t('program_start_date')}</p></div>
          <b>${formatDate(Store.parseDateKey(state.program.startDate))}</b>
        </div>
        <div class="settings-row" style="background:transparent;padding:8px 0;">
          <div class="settings-row-text"><p class="settings-row-title">${I18N.t('program_duration')}</p></div>
          <b>${I18N.t('program_months', { n: state.program.durationMonths })}</b>
        </div>
        <div class="settings-row" style="background:transparent;padding:8px 0;border-bottom:none;">
          <div class="settings-row-text"><p class="settings-row-title">${I18N.t('program_method')}</p></div>
          <b>${I18N.t('program_method_gradual')}</b>
        </div>
      </div>

      <div class="card">
        <p class="card-title" style="margin-bottom:6px;">${I18N.t('program_milestones')}</p>
        <div class="timeline">
          ${milestones.map(m => `
            <div class="timeline-item ${m.done ? 'done' : ''}">
              <span class="timeline-dot">${m.done ? '✓' : ''}</span>
              <p class="timeline-title">${Charts.esc(I18N.t(m.key))}</p>
              <p class="timeline-desc">${Charts.esc(I18N.t(m.descKey, m.descVars))}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function shiftWeek(dir) {
    weekOffset = Math.max(0, weekOffset + dir);
  }

  global.Tabs = global.Tabs || {};
  global.Tabs.program = { render, shiftWeek };
})(window);
