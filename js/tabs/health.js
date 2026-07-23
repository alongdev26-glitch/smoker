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
        <div class="stage-label">${Charts.esc(s.key)}</div>
      </div>
    `).join('');

    const highlightText = nextItem
      ? `Next goal: ${Charts.esc(nextItem.label)}`
      : lastDone
        ? `Achieved: ${Charts.esc(lastDone.label)}`
        : 'Recovery starts the moment you quit';

    const { labels, todayCounts, avgCounts } = hourlyComparison(state);
    const chartSvg = Charts.lineChart({
      series: [
        { label: '7-day average', color: 'var(--text-muted)', data: avgCounts, dashed: true },
        { label: 'Today', color: 'var(--accent-blue)', data: todayCounts }
      ],
      xLabels: labels
    });

    return `
      <div class="card">
        <div class="card-row">
          <div class="icon-tile tile-green">💚</div>
          <div>
            <p class="card-title" style="margin:0;">Health recovery</p>
            <p class="card-sub">See how your body is healing</p>
          </div>
        </div>
        <div class="highlight-box" style="margin-top:12px;">
          <span>💡</span><span>${highlightText}</span>
        </div>
        <div class="stage-row">${stageRow}</div>
        <div class="progress-track" style="margin-top:14px;"><div class="progress-fill green" style="width:${health.pct}%"></div></div>
        <div class="progress-meta"><span>${health.doneCount}/${health.total} milestones reached</span><span>${health.pct}%</span></div>
      </div>

      <div class="card">
        <p class="card-title">Daily comparison</p>
        <p class="card-sub" style="margin-bottom:8px;">Today's consumption vs. your 7-day average</p>
        ${Charts.legendHtml([
          { label: 'Today', color: 'var(--accent-blue)', shape: 'line' },
          { label: '7-day average', color: 'var(--text-muted)', shape: 'line', dashed: true }
        ])}
        <div class="chart-wrap">${chartSvg}</div>
      </div>

      <div class="card">
        <p class="card-title" style="margin-bottom:10px;">All milestones</p>
        <div class="timeline">
          ${health.items.map(item => `
            <div class="timeline-item ${item.done ? 'done' : ''}">
              <span class="timeline-dot">${item.done ? '✓' : ''}</span>
              <p class="timeline-title">${Charts.esc(item.label)}</p>
              <p class="timeline-desc">${item.hours < 24 ? Math.round(item.hours * 10) / 10 + 'h' : Math.round(item.hours / 24) + 'd'} smoke-free</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  global.Tabs = global.Tabs || {};
  global.Tabs.health = { render };
})(window);
