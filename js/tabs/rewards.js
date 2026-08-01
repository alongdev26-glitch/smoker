(function (global) {
  const esc = s => Charts.esc(s);

  // Achievement thresholds for cumulative cigarettes avoided.
  const TROPHY_CIGS = [1, 10, 100, 1000, 10000];
  const BLUE_TROPHY_DISPLAY_CAP = 14; // show at most this many blue icons, then "+N"

  function defaultRewards() {
    const specs = [
      ['reward_ex1_name', 40], ['reward_ex2_name', 250], ['reward_ex3_name', 60],
      ['reward_ex4_name', 45], ['reward_ex5_name', 180], ['reward_ex6_name', 220],
      ['reward_ex7_name', 900]
    ];
    return specs.map(([key, cost]) => ({ id: Store.uid(), name: I18N.t(key), cost, purchased: false }));
  }

  // Read-only summary card; all actions (buy / edit / delete) live in the
  // detail sheet opened via the single chevron button.
  function rewardCard(r, balance) {
    const affordable = balance >= r.cost;
    const pct = r.purchased ? 100 : Math.min(100, Math.round((balance / Math.max(1, r.cost)) * 100));
    const status = r.purchased ? I18N.t('rewards_purchased')
      : affordable ? I18N.t('rewards_available')
        : `${pct}%`;
    const fillClass = r.purchased || affordable ? 'green' : '';
    return `
      <button type="button" class="reward-card ${r.purchased ? 'reward-card--done' : ''}" data-action="open-reward-detail" data-id="${r.id}">
        <div class="reward-top">
          <span class="reward-name">${esc(r.name)}</span>
          <span class="reward-cost">₪${r.cost}</span>
        </div>
        <div class="progress-track"><div class="progress-fill ${fillClass}" style="width:${pct}%"></div></div>
        <div class="reward-bottom">
          <span class="reward-status ${r.purchased ? 'green' : affordable ? 'green' : ''}">${status}</span>
          <span class="chevron">›</span>
        </div>
      </button>`;
  }

  // Detail sheet for a single reward: full status + buy / edit / delete.
  function rewardDetailHtml(r, balance) {
    const affordable = balance >= r.cost;
    const pct = r.purchased ? 100 : Math.min(100, Math.round((balance / Math.max(1, r.cost)) * 100));
    const status = r.purchased ? I18N.t('rewards_purchased') : affordable ? I18N.t('rewards_available') : `${pct}%`;
    return `
      <h2>${esc(r.name)}</h2>
      <p class="sheet-sub">₪${r.cost}</p>
      <div class="progress-track"><div class="progress-fill ${r.purchased || affordable ? 'green' : ''}" style="width:${pct}%"></div></div>
      <p class="reward-detail-status ${r.purchased || affordable ? 'green' : ''}">${status}</p>
      <button type="button" class="btn btn-primary btn-block" data-action="buy-reward" data-id="${r.id}" ${r.purchased || !affordable ? 'disabled' : ''}>${r.purchased ? '✓ ' + I18N.t('rewards_purchased') : I18N.t('reward_buy')}</button>
      <div class="sheet-actions">
        ${r.purchased ? '' : `<button type="button" class="btn btn-ghost" data-action="edit-reward" data-id="${r.id}">${Icons.svg('pencil', 15)} ${I18N.t('reward_edit')}</button>`}
        <button type="button" class="btn btn-danger" data-action="delete-reward" data-id="${r.id}">${Icons.svg('trash', 15)} ${I18N.t('reward_delete')}</button>
      </div>
    `;
  }

  function trophyGrid(label, thresholds, value) {
    const badges = thresholds.map(th => {
      const unlocked = value >= th;
      return `
        <div class="trophy-badge ${unlocked ? '' : 'trophy-badge--locked'}">
          <span class="trophy-icon">${Icons.svg('trophy', 24)}</span>
          <span class="trophy-num">${th >= 1000 ? (th / 1000) + 'k' : th}</span>
        </div>`;
    }).join('');
    return `
      <p class="trophy-group-label">${esc(label)}</p>
      <div class="trophy-grid">${badges}</div>`;
  }

  // One trophy slot per day of the current 30-day program month.
  function dailyTrophyGrid(grid) {
    const cells = grid.cells.map(c => `
      <div class="trophy-badge trophy-badge--small ${c.status === 'earned' ? '' : c.status === 'future' ? 'trophy-badge--future' : 'trophy-badge--locked'}">
        <span class="trophy-icon">${Icons.svg('trophy', 16)}</span>
      </div>`).join('');
    return `
      <p class="trophy-group-label">${esc(I18N.t('trophies_daily_title'))}</p>
      <p class="trophy-group-sub">${esc(I18N.t('trophies_daily_sub'))}</p>
      <div class="trophy-grid trophy-grid--daily">${cells}</div>`;
  }

  // Permanent blue trophies earned from unbroken 7-day streaks.
  function blueTrophySection(count) {
    const shown = Math.min(count, BLUE_TROPHY_DISPLAY_CAP);
    const icons = Array.from({ length: shown }, () => `
      <div class="trophy-badge trophy-badge--blue trophy-badge--small">
        <span class="trophy-icon">${Icons.svg('trophy', 16)}</span>
      </div>`).join('');
    const extra = count > BLUE_TROPHY_DISPLAY_CAP ? `<span class="trophy-extra">+${count - BLUE_TROPHY_DISPLAY_CAP}</span>` : '';
    return `
      <p class="trophy-group-label">${esc(I18N.t('trophies_blue_title'))}</p>
      <p class="trophy-group-sub">${esc(I18N.t('trophies_blue_sub'))}</p>
      ${count ? `<div class="trophy-grid trophy-grid--daily">${icons}${extra}</div>` : `<div class="empty-state">${I18N.t('trophies_blue_empty')}</div>`}`;
  }

  function render(state) {
    if (state.rewards == null) { state.rewards = defaultRewards(); Store.save(state); }

    const balance = Derive.rewardsBalance(state);
    const avoided = Math.round(Derive.cigarettesAvoided(state));
    const monthGrid = Derive.monthlyTrophyGrid(state);
    const blueCount = Derive.blueTrophyCount(state);

    const rewardsList = state.rewards.length
      ? state.rewards.map(r => rewardCard(r, balance)).join('')
      : `<div class="empty-state">${I18N.t('rewards_empty')}</div>`;

    return `
      <div>
        <p class="section-title" style="margin:0;">${I18N.t('nav_rewards')}</p>
        <p class="section-sub">${I18N.t('rewards_subtitle')}</p>
      </div>

      <div class="reward-balance-card">
        <p class="reward-balance-label">${I18N.t('rewards_balance')}</p>
        <p class="reward-balance-value">₪${balance}</p>
      </div>

      <div class="card-row" style="justify-content:space-between;align-items:center;">
        <p class="card-title" style="margin:0;">${I18N.t('rewards_your_rewards')}</p>
        <button type="button" class="btn btn-primary" data-action="add-reward" style="padding:8px 14px;">+ ${I18N.t('reward_add')}</button>
      </div>
      ${rewardsList}

      <div style="margin-top:8px;">
        <p class="card-title">${Icons.svg('trophy', 18)} ${I18N.t('trophies_title')}</p>
        <div class="card">
          ${trophyGrid(I18N.t('trophy_cigs_avoided', { units: Substances.unit(state.profile.substance, I18N.getLang(), 2) }), TROPHY_CIGS, avoided)}
          ${dailyTrophyGrid(monthGrid)}
          ${blueTrophySection(blueCount)}
        </div>
      </div>
    `;
  }

  global.Tabs = global.Tabs || {};
  global.Tabs.rewards = { render, rewardDetailHtml };
})(window);
