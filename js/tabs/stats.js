(function (global) {
  let period = 'week'; // 'day' | 'week' | 'month' | 'year'
  const PERIODS = [
    { key: 'day', label: 'Day' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'year', label: 'Year' }
  ];
  const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function aggregate(state) {
    const today = new Date();
    if (period === 'day') {
      const slots = [[6, 9], [9, 12], [12, 15], [15, 18], [18, 21], [21, 24]];
      const key = Store.todayKey();
      const data = slots.map(([a, b]) => state.log.filter(e => {
        const d = new Date(e.ts);
        return Store.dateKey(d) === key && d.getHours() >= a && d.getHours() < b;
      }).reduce((s, e) => s + e.quantity, 0));
      return {
        kind: 'bar',
        categories: slots.map(([a]) => `${String(a).padStart(2, '0')}:00`),
        data,
        range: formatToday(today)
      };
    }
    if (period === 'week' || period === 'month') {
      const n = period === 'week' ? 7 : 30;
      const series = Derive.dailySeries(state, n);
      return {
        kind: 'line',
        categories: series.labels,
        data: series.actual,
        planned: series.planned,
        range: series.labels.length ? `${series.labels[0]} - ${series.labels[series.labels.length - 1]}` : ''
      };
    }
    // year
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push(d);
    }
    const data = months.map(m => {
      return state.log.filter(e => {
        const d = new Date(e.ts);
        return d.getFullYear() === m.getFullYear() && d.getMonth() === m.getMonth();
      }).reduce((s, e) => s + e.quantity, 0);
    });
    return { kind: 'bar', categories: months.map(m => MONTH_SHORT[m.getMonth()]), data, range: String(today.getFullYear()) };
  }

  function formatToday(d) {
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }

  const TYPE_COLORS = ['var(--accent-blue)', 'var(--accent-green)', 'var(--accent-orange)', 'var(--accent-violet)', 'var(--accent-yellow)'];

  function render(state) {
    const stats = Derive.statsForPeriod(state, period);
    const agg = aggregate(state);
    const sinceDays = period === 'day' ? 1 : period === 'week' ? 7 : period === 'month' ? 30 : 365;

    const hasData = agg.data.some(v => v > 0);
    let chart;
    if (agg.kind === 'line') {
      chart = Charts.lineChart({
        series: [
          { label: 'Plan', color: 'var(--text-muted)', data: agg.planned, dashed: true },
          { label: 'Actual', color: 'var(--accent-blue)', data: agg.data }
        ],
        xLabels: agg.categories
      });
    } else {
      chart = Charts.groupedBarChart({
        categories: agg.categories,
        series: [{ label: 'Cigarettes', color: 'var(--accent-blue)', data: agg.data }]
      });
    }

    const triggers = Derive.topTriggers(state, sinceDays);
    const maxTrig = Math.max(1, ...triggers.map(t => t.count));
    const trigColors = ['var(--accent-orange)', 'var(--accent-green)', 'var(--accent-blue)'];

    const types = Derive.typeBreakdown(state, sinceDays);
    const maxType = Math.max(1, ...types.map(t => t.count));

    return `
      <div>
        <p class="section-title" style="margin:0;">Detailed Statistics</p>
        <p class="section-sub">Track your progress and spot patterns</p>
      </div>

      <div class="card">
        <div class="card-row" style="justify-content:space-between;">
          <div class="icon-tile tile-orange">📊</div>
          <div style="text-align:left;">
            <p class="card-sub" style="margin:0;">Total cigarettes</p>
            <p style="font-size:22px;font-weight:800;margin:2px 0 0;">${stats.total}</p>
          </div>
        </div>
        <div class="stat-grid-2" style="margin-top:12px;">
          <div class="stat-tile">
            <p class="stat-tile-label">💰 Est. savings</p>
            <p class="stat-tile-value green">₪${stats.moneySaved}</p>
          </div>
          <div class="stat-tile">
            <p class="stat-tile-label">💨 Total nicotine</p>
            <p class="stat-tile-value orange">${stats.nicotineMg} mg</p>
          </div>
        </div>
      </div>

      <div class="filter-row">
        ${PERIODS.map(p => `<button class="filter-btn ${p.key === period ? 'active' : ''}" data-action="stats-period" data-period="${p.key}">${p.label}</button>`).join('')}
      </div>

      <div class="card">
        <div class="card-row" style="justify-content:space-between;">
          <p class="card-title" style="margin:0;">Cigarette consumption</p>
          <span class="card-sub">${agg.range}</span>
        </div>
        ${agg.kind === 'line' ? Charts.legendHtml([
          { label: 'Actual', color: 'var(--accent-blue)', shape: 'line' },
          { label: 'Plan', color: 'var(--text-muted)', shape: 'line', dashed: true }
        ]) : ''}
        <div class="chart-wrap" style="margin-top:8px;">${chart}</div>
        ${hasData ? '' : '<p class="empty-state" style="padding:6px 0 0;">No smoking data yet in this range — well done!</p>'}
        <div class="stat-grid-3" style="margin-top:10px;">
          <div class="stat-tile"><p class="stat-tile-label">Peak</p><p class="stat-tile-value">${stats.peak}</p></div>
          <div class="stat-tile"><p class="stat-tile-label">Average</p><p class="stat-tile-value">${stats.avg}</p></div>
          <div class="stat-tile"><p class="stat-tile-label">Total</p><p class="stat-tile-value">${stats.total}</p></div>
        </div>
      </div>

      <div class="card">
        <div class="card-row" style="justify-content:space-between;margin-bottom:12px;">
          <p class="card-title" style="margin:0;">${triggers.length ? 'Top ' + triggers.length + ' triggers' : 'Top triggers'}</p>
          ${triggers.length ? '' : '<span>⚠️</span>'}
        </div>
        ${triggers.length ? triggers.map((t, i) => `
          <div class="trigger-item">
            <div class="trigger-top"><span class="trigger-name">${Charts.esc(t.name)}</span><span class="trigger-count">${t.count} times</span></div>
            <div class="trigger-track"><div class="trigger-fill" style="width:${Math.round((t.count / maxTrig) * 100)}%;background:${trigColors[i]}"></div></div>
          </div>
        `).join('') : '<div class="empty-state">Not enough trigger data yet</div>'}
      </div>

      <div class="card">
        <p class="card-title" style="margin-bottom:12px;">Breakdown by cigarette type</p>
        ${types.length ? types.map((t, i) => `
          <div class="trigger-item">
            <div class="trigger-top"><span class="trigger-name">${Charts.esc(t.name)}</span><span class="trigger-count">${t.count}</span></div>
            <div class="trigger-track"><div class="trigger-fill" style="width:${Math.round((t.count / maxType) * 100)}%;background:${TYPE_COLORS[i % TYPE_COLORS.length]}"></div></div>
          </div>
        `).join('') : '<div class="empty-state">No consumption data yet in this range</div>'}
      </div>
    `;
  }

  function setPeriod(p) { period = p; }

  global.Tabs = global.Tabs || {};
  global.Tabs.stats = { render, setPeriod };
})(window);
