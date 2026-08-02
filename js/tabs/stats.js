(function (global) {
  let period = 'week'; // 'day' | 'week' | 'month' | 'year'
  const PERIODS = ['day', 'week', 'month', 'year'];

  // Carousel state: survives full re-renders (same idea as `period` above),
  // since main.js replaces #panel-stats' innerHTML on almost any state change.
  let currentPage = 0;
  const PAGE_COUNT = 9;
  const PERIOD_PAGES = new Set([0, 1, 2, 3]); // summary, chart, triggers, breakdown
  let carouselObserver = null;

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
    const monthShort = I18N.t('months_short').split(',');
    return { kind: 'bar', categories: months.map(m => monthShort[m.getMonth()]), data, range: String(today.getFullYear()) };
  }

  function formatToday(d) {
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }

  // Human-readable duration from minutes (m → h → d → y).
  function fmtDuration(min) {
    min = Math.round(min);
    if (min < 60) return min + 'm';
    const h = Math.floor(min / 60);
    if (h < 24) return h + 'h';
    const d = Math.floor(h / 24);
    if (d < 365) return d + 'd';
    const y = Math.floor(d / 365);
    const rd = d % 365;
    return y + 'y' + (rd ? ' ' + rd + 'd' : '');
  }

  const TYPE_COLORS = ['var(--accent-blue)', 'var(--accent-green)', 'var(--accent-orange)', 'var(--accent-violet)', 'var(--accent-yellow)'];

  function renderFilterRow() {
    return `
      <div class="filter-row" id="statsFilterRow" ${PERIOD_PAGES.has(currentPage) ? '' : 'hidden'}>
        ${PERIODS.map(p => `<button class="filter-btn ${p === period ? 'active' : ''}" data-action="stats-period" data-period="${p}">${I18N.t('stats_period_' + p)}</button>`).join('')}
      </div>
    `;
  }

  function renderSummaryPage(state, substance, stats, units) {
    return `
      <div class="card">
        <div class="card-row" style="justify-content:space-between;">
          <div class="icon-tile tile-orange">${Icons.svg('chart', 22)}</div>
          <div style="text-align:left;">
            <p class="card-sub" style="margin:0;">${I18N.t('stats_total_cigarettes', { units })}</p>
            <p style="font-size:22px;font-weight:800;margin:2px 0 0;">${stats.total}</p>
          </div>
        </div>
        <div class="stat-grid-2" style="margin-top:12px;">
          <div class="stat-tile">
            <p class="stat-tile-label">${Icons.svg('wallet', 15)} ${I18N.t('stats_est_savings')}</p>
            <p class="stat-tile-value green">₪${stats.moneySaved}</p>
          </div>
          ${substance.nicotineApplies ? `
          <div class="stat-tile">
            <p class="stat-tile-label">${Icons.svg('smoke', 15)} ${I18N.t('stats_total_nicotine')}</p>
            <p class="stat-tile-value orange">${stats.nicotineMg} mg</p>
          </div>
          ` : `
          <div class="stat-tile">
            <p class="stat-tile-label">${Icons.svg('smoke', 15)} ${I18N.t('stats_total_doses')}</p>
            <p class="stat-tile-value orange">${stats.total}</p>
          </div>
          `}
        </div>
      </div>
    `;
  }

  function renderChartPage(agg, stats, chart, hasData) {
    return `
      <div class="card">
        <div class="card-row" style="justify-content:space-between;">
          <p class="card-title" style="margin:0;">${I18N.t('stats_consumption')}</p>
          <span class="card-sub">${agg.range}</span>
        </div>
        ${agg.kind === 'line' ? Charts.legendHtml([
          { label: I18N.t('stats_legend_actual'), color: 'var(--accent-blue)', shape: 'line' },
          { label: I18N.t('stats_legend_plan'), color: 'var(--text-muted)', shape: 'line', dashed: true }
        ]) : ''}
        <div class="chart-wrap" style="margin-top:8px;">${chart}</div>
        ${hasData ? '' : `<p class="empty-state" style="padding:6px 0 0;">${I18N.t('stats_no_data')}</p>`}
        <div class="stat-grid-3" style="margin-top:10px;">
          <div class="stat-tile"><p class="stat-tile-label">${I18N.t('stats_peak')}</p><p class="stat-tile-value">${stats.peak}</p></div>
          <div class="stat-tile"><p class="stat-tile-label">${I18N.t('stats_average')}</p><p class="stat-tile-value">${stats.avg}</p></div>
          <div class="stat-tile"><p class="stat-tile-label">${I18N.t('stats_total')}</p><p class="stat-tile-value">${stats.total}</p></div>
        </div>
      </div>
    `;
  }

  function renderTriggersPage(triggers, maxTrig, trigColors) {
    return `
      <div class="card">
        <div class="card-row" style="justify-content:space-between;margin-bottom:12px;">
          <p class="card-title" style="margin:0;">${triggers.length ? I18N.t('stats_top_triggers_n', { n: triggers.length }) : I18N.t('stats_top_triggers')}</p>
          ${triggers.length ? '' : `<span style="color:var(--accent-orange);">${Icons.svg('alert', 18)}</span>`}
        </div>
        ${triggers.length ? triggers.map((t, i) => `
          <div class="trigger-item">
            <div class="trigger-top"><span class="trigger-name">${Charts.esc(Store.triggerLabel(t.name))}</span><span class="trigger-count">${I18N.t('stats_times', { n: t.count })}</span></div>
            <div class="trigger-track"><div class="trigger-fill" style="width:${Math.round((t.count / maxTrig) * 100)}%;background:${trigColors[i]}"></div></div>
          </div>
        `).join('') : `<div class="empty-state">${I18N.t('stats_not_enough_triggers')}</div>`}
      </div>
    `;
  }

  function renderBreakdownPage(state, types, maxType, unit) {
    return `
      <div class="card">
        <p class="card-title" style="margin-bottom:12px;">${I18N.t('stats_breakdown_type', { unit })}</p>
        ${types.length ? types.map((t, i) => `
          <div class="trigger-item">
            <div class="trigger-top"><span class="trigger-name">${Charts.esc(Substances.typeLabel(state.profile.substance, t.name))}</span><span class="trigger-count">${t.count}</span></div>
            <div class="trigger-track"><div class="trigger-fill" style="width:${Math.round((t.count / maxType) * 100)}%;background:${TYPE_COLORS[i % TYPE_COLORS.length]}"></div></div>
          </div>
        `).join('') : `<div class="empty-state">${I18N.t('stats_no_consumption')}</div>`}
      </div>
    `;
  }

  function renderGainedPage(substance, avoided, lifeSaved, units) {
    return `
      <div class="card">
        <p class="card-title" style="margin-bottom:12px;">${I18N.t('stats_gained_title')}</p>
        <div class="${lifeSaved != null ? 'stat-grid-2' : ''}">
          <div class="stat-tile">
            <p class="stat-tile-label">${Icons.svg(substance.icon, 15)} ${I18N.t('stats_cigs_avoided', { units })}</p>
            <p class="stat-tile-value green">${avoided}</p>
          </div>
          ${lifeSaved != null ? `
          <div class="stat-tile">
            <p class="stat-tile-label">${Icons.svg('heart', 15)} ${I18N.t('stats_life_saved')}</p>
            <p class="stat-tile-value green">${fmtDuration(lifeSaved)}</p>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  function renderUsagePage(smoked, wasted, lifeLost, units) {
    return `
      <div class="card">
        <p class="card-title" style="margin-bottom:12px;">${I18N.t('stats_while_smoked_title')}</p>
        <div class="${lifeLost != null ? 'stat-grid-3' : 'stat-grid-2'}">
          <div class="stat-tile"><p class="stat-tile-label">${I18N.t('stats_cigs_smoked', { units })}</p><p class="stat-tile-value">${smoked}</p></div>
          <div class="stat-tile"><p class="stat-tile-label">${I18N.t('stats_money_wasted')}</p><p class="stat-tile-value orange">₪${wasted}</p></div>
          ${lifeLost != null ? `<div class="stat-tile"><p class="stat-tile-label">${I18N.t('stats_time_lost')}</p><p class="stat-tile-value orange">${fmtDuration(lifeLost)}</p></div>` : ''}
        </div>
      </div>
    `;
  }

  function renderProjectionPage(proj) {
    return `
      <div class="card">
        <p class="card-title" style="margin-bottom:4px;">${I18N.t('projection_title')}</p>
        <p class="card-sub" style="margin-bottom:10px;">${I18N.t('projection_sub')}</p>
        <table class="projection-table">
          <thead><tr><th></th><th>${I18N.t('projection_money')}</th>${proj[0].lifeMin != null ? `<th>${I18N.t('projection_life')}</th>` : ''}</tr></thead>
          <tbody>
            ${proj.map(p => `<tr><td>${I18N.t('proj_' + p.key)}</td><td class="proj-money">₪${p.money.toLocaleString()}</td>${p.lifeMin != null ? `<td class="proj-life">${fmtDuration(p.lifeMin)}</td>` : ''}</tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderWeekComparePage(cmp) {
    const trendIcon = cmp.delta < 0 ? 'trend-down' : cmp.delta > 0 ? 'trend-up' : null;
    const trendClass = cmp.delta < 0 ? 'green' : cmp.delta > 0 ? 'orange' : '';
    const trendText = cmp.delta < 0 ? I18N.t('stats_week_down', { pct: cmp.pct })
      : cmp.delta > 0 ? I18N.t('stats_week_up', { pct: cmp.pct })
      : I18N.t('stats_week_same');
    return `
      <div class="card">
        <p class="card-title" style="margin-bottom:12px;">${I18N.t('stats_week_compare_title')}</p>
        <div class="stat-grid-2">
          <div class="stat-tile">
            <p class="stat-tile-label">${I18N.t('stats_this_week')}</p>
            <p class="stat-tile-value">${cmp.thisWeek}</p>
          </div>
          <div class="stat-tile">
            <p class="stat-tile-label">${I18N.t('stats_last_week')}</p>
            <p class="stat-tile-value">${cmp.lastWeek}</p>
          </div>
        </div>
        <div class="card-row" style="justify-content:center;gap:6px;margin-top:16px;">
          ${trendIcon ? `<span class="${trendClass}">${Icons.svg(trendIcon, 18)}</span>` : ''}
          <span class="stat-tile-value ${trendClass}" style="font-size:14px;">${Charts.esc(trendText)}</span>
        </div>
      </div>
    `;
  }

  function renderSharePage(avoided, money, streak) {
    return `
      <div class="card" style="text-align:center;">
        <div class="icon-tile tile-blue" style="margin:0 auto 12px;">${Icons.svg('star', 22)}</div>
        <p class="card-title" style="margin-bottom:4px;">${I18N.t('stats_share_title')}</p>
        <p class="card-sub" style="margin-bottom:16px;">${I18N.t('stats_share_sub')}</p>
        <div class="stat-grid-2" style="margin-bottom:16px;">
          <div class="stat-tile">
            <p class="stat-tile-label">${Icons.svg('wallet', 15)} ${I18N.t('stats_est_savings')}</p>
            <p class="stat-tile-value green">₪${money}</p>
          </div>
          <div class="stat-tile">
            <p class="stat-tile-label">${Icons.svg('flame', 15)} ${I18N.t('home_current_streak')}</p>
            <p class="stat-tile-value green">${streak}d</p>
          </div>
        </div>
        <button type="button" class="btn btn-primary btn-block" data-action="share-progress">${I18N.t('stats_share_button')}</button>
      </div>
    `;
  }

  // Jumps to the persisted page instantly (no animation) after a re-render,
  // and keeps `currentPage`/the filter row's visibility in sync with real swipes.
  function setupCarousel() {
    const track = document.getElementById('statsCarousel');
    if (!track) return; // tab switched away before this timer fired

    if (carouselObserver) { carouselObserver.disconnect(); carouselObserver = null; }
    currentPage = Math.min(Math.max(currentPage, 0), PAGE_COUNT - 1);

    const target = track.children[currentPage];
    if (target) target.scrollIntoView({ inline: 'start', block: 'nearest', behavior: 'instant' });

    carouselObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          const idx = Number(entry.target.dataset.pageIndex);
          if (!Number.isNaN(idx) && idx !== currentPage) {
            currentPage = idx;
            const filterRow = document.getElementById('statsFilterRow');
            if (filterRow) filterRow.hidden = !PERIOD_PAGES.has(currentPage);
          }
        }
      });
    }, { root: track, threshold: [0.6] });

    Array.from(track.children).forEach(page => carouselObserver.observe(page));
  }

  function render(state) {
    const substance = Substances.get(state.profile.substance);
    const lang = I18N.getLang();
    const unit = Substances.unit(state.profile.substance, lang, 1);
    const units = Substances.unit(state.profile.substance, lang, 2);
    const stats = Derive.statsForPeriod(state, period);
    const agg = aggregate(state);
    const sinceDays = period === 'day' ? 1 : period === 'week' ? 7 : period === 'month' ? 30 : 365;

    const hasData = agg.data.some(v => v > 0);
    let chart;
    if (agg.kind === 'line') {
      chart = Charts.lineChart({
        series: [
          { label: I18N.t('stats_legend_plan'), color: 'var(--text-muted)', data: agg.planned, dashed: true },
          { label: I18N.t('stats_legend_actual'), color: 'var(--accent-blue)', data: agg.data }
        ],
        xLabels: agg.categories
      });
    } else {
      chart = Charts.groupedBarChart({
        categories: agg.categories,
        series: [{ label: I18N.t('stats_series_cigarettes', { units }), color: 'var(--accent-blue)', data: agg.data }]
      });
    }

    const triggers = Derive.topTriggers(state, sinceDays);
    const maxTrig = Math.max(1, ...triggers.map(t => t.count));
    const trigColors = ['var(--accent-orange)', 'var(--accent-green)', 'var(--accent-blue)'];

    const types = Derive.typeBreakdown(state, sinceDays);
    const maxType = Math.max(1, ...types.map(t => t.count));

    // Motivation figures (all-time, independent of the selected period).
    const avoided = Math.round(Derive.cigarettesAvoided(state));
    const lifeSaved = Derive.lifeMinutesSaved(state);
    const smoked = Derive.totalSmoked(state);
    const wasted = Derive.moneyWasted(state);
    const lifeLost = Derive.lifeMinutesLost(state);
    const proj = Derive.projection(state);
    const weekCmp = Derive.weekComparison(state);
    const { current: streak } = Derive.streaks(state);
    const moneyAllTime = Derive.moneySaved(state);

    const pages = [
      renderSummaryPage(state, substance, stats, units),
      renderChartPage(agg, stats, chart, hasData),
      renderTriggersPage(triggers, maxTrig, trigColors),
      renderBreakdownPage(state, types, maxType, unit),
      renderGainedPage(substance, avoided, lifeSaved, units),
      renderUsagePage(smoked, wasted, lifeLost, units),
      renderProjectionPage(proj),
      renderWeekComparePage(weekCmp),
      renderSharePage(avoided, moneyAllTime, streak)
    ];

    setTimeout(setupCarousel, 0);

    return `
      <div>
        <p class="section-title" style="margin:0;">${I18N.t('stats_title')}</p>
        <p class="section-sub">${I18N.t('stats_subtitle')}</p>
      </div>

      ${renderFilterRow()}

      <div class="stats-carousel" id="statsCarousel">
        ${pages.map((html, i) => `<div class="stats-page" data-page-index="${i}">${html}</div>`).join('')}
      </div>
    `;
  }

  function setPeriod(p) { period = p; }

  global.Tabs = global.Tabs || {};
  global.Tabs.stats = { render, setPeriod };
})(window);
