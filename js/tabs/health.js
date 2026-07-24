(function (global) {
  const STAGE_ICONS = ['1', '2', '3', '4'];

  function hourlyComparison(state) {
    const slots = [[6, 9], [9, 12], [12, 15], [15, 18], [18, 21], [21, 24]];
    const labels = slots.map(([a]) => `${String(a).padStart(2, '0')}:00`);
    const todayKey = Store.todayKey();
    const todayCounts = slots.map(([a, b]) =>
      state.log.filter(e => {
        const d = new Date(e.ts);
        return Store.dateKey(d) === todayKey && d.getHours() >= a && d.getHours() < b;
      }).reduce((s, e) => s + e.quantity, 0)
    );
    const last7 = Store.addDays(new Date(), -7);
    const historyDays = new Set(state.log.filter(e => new Date(e.ts) >= last7 && Store.dateKey(new Date(e.ts)) !== todayKey).map(e => Store.dateKey(new Date(e.ts))));
    const denom = Math.max(1, historyDays.size);
    const avgCounts = slots.map(([a, b]) => {
      const total = state.log.filter(e => {
        const d = new Date(e.ts);
        return d >= last7 && Store.dateKey(d) !== todayKey && d.getHours() >= a && d.getHours() < b;
      }).reduce((s, e) => s + e.quantity, 0);
      return +(total / denom).toFixed(1);
    });
    return { labels, todayCounts, avgCounts };
  }

  function render(state) {
    const health = Derive.healthStatus(state);
    const doneItems = health.items.filter(i => i.done);
    const lastDone = doneItems[doneItems.length - 1];
    const nextItem = health.items.find(i => !i.done);

    const stageRow = Derive.STAGE_DEFS.map((s, i) => `
      <div class="stage ${i <= health.currentStage ? 'active' : ''}">
        <div class="stage-circle">${i < health.currentStage ? '✓' : STAGE_ICONS[i]}</div>
        <div class="stage-label">${Charts.esc(I18N.t(s.key))}</div>
      </div>
    `).join('');

    const highlightText = nextItem
      ? I18N.t('health_next_goal', { label: I18N.t(nextItem.key) })
      : lastDone
        ? I18N.t('health_achieved', { label: I18N.t(lastDone.key) })
        : I18N.t('health_recovery_starts');

    const { labels, todayCounts, avgCounts } = hourlyComparison(state);
    const chartSvg = Charts.lineChart({
      series: [
        { label: I18N.t('health_7day_avg'), color: 'var(--text-muted)', data: avgCounts, dashed: true },
        { label: I18N.t('health_today'), color: 'var(--accent-blue)', data: todayCounts }
      ],
      xLabels: labels
    });

    return `
      <div class="card">
        <div class="card-row">
          <div class="icon-tile tile-green">💚</div>
          <div>
            <p class="card-title" style="margin:0;">${I18N.t('health_recovery')}</p>
            <p class="card-sub">${I18N.t('health_recovery_sub')}</p>
          </div>
        </div>
        <div class="highlight-box" style="margin-top:12px;">
          <span>💡</span><span>${highlightText}</span>
        </div>
        <div class="stage-row">${stageRow}</div>
        <div class="progress-track" style="margin-top:14px;"><div class="progress-fill green" style="width:${health.pct}%"></div></div>
        <div class="progress-meta"><span>${I18N.t('health_milestones_reached', { done: health.doneCount, total: health.total })}</span><span>${health.pct}%</span></div>
      </div>

      <div class="card">
        <p class="card-title">${I18N.t('health_daily_comparison')}</p>
        <p class="card-sub" style="margin-bottom:8px;">${I18N.t('health_daily_comparison_sub')}</p>
        ${Charts.legendHtml([
          { label: I18N.t('health_today'), color: 'var(--accent-blue)', shape: 'line' },
          { label: I18N.t('health_7day_avg'), color: 'var(--text-muted)', shape: 'line', dashed: true }
        ])}
        <div class="chart-wrap">${chartSvg}</div>
      </div>

      <div class="card">
        <p class="card-title" style="margin-bottom:10px;">${I18N.t('health_all_milestones')}</p>
        <div class="timeline">
          ${health.items.map(item => `
            <div class="timeline-item ${item.done ? 'done' : ''}">
              <span class="timeline-dot">${item.done ? '✓' : ''}</span>
              <p class="timeline-title">${Charts.esc(I18N.t(item.key))}</p>
              <p class="timeline-desc">${I18N.t('health_smoke_free_suffix', { t: item.hours < 24 ? Math.round(item.hours * 10) / 10 + 'h' : Math.round(item.hours / 24) + 'd' })}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  global.Tabs = global.Tabs || {};
  global.Tabs.health = { render };
})(window);
