(function (global) {
  const esc = s => Charts.esc(s);

  // Achievement thresholds. cigs = cumulative cigarettes avoided; days = days
  // stayed within the daily goal.
  const TROPHY_CIGS = [20, 100, 1000, 10000];
  const TROPHY_DAYS = [1, 3, 7, 10, 30];

  function defaultRewards() {
    return [
      { id: Store.uid(), name: I18N.t('reward_ex1_name'), cost: 40, purchased: false },
      { id: Store.uid(), name: I18N.t('reward_ex2_name'), cost: 250, purchased: false }
    ];
  }

  function rewardCard(r, balance) {
    const affordable = balance >= r.cost;
    const pct = r.purchased ? 100 : Math.min(100, Math.round((balance / Math.max(1, r.cost)) * 100));
    const status = r.purchased ? I18N.t('rewards_purchased')
      : affordable ? I18N.t('rewards_available')
        : `${pct}%`;
    const fillClass = r.purchased || affordable ? 'green' : '';
    return `
      <div class="reward-card ${r.purchased ? 'reward-card--done' : ''}">
        <div class="reward-top">
          <span class="reward-name">${esc(r.name)}</span>
          <span class="reward-cost">₪${r.cost}</span>
        </div>
        <div class="progress-track"><div class="progress-fill ${fillClass}" style="width:${pct}%"></div></div>
        <div class="reward-bottom">
          <span class="reward-status ${r.purchased ? 'green' : affordable ? 'green' : ''}">${status}</span>
          <div class="reward-actions">
            ${r.purchased ? '' : `<button type="button" class="reward-icon-btn" data-action="edit-reward" data-id="${r.id}" aria-label="Edit">${Icons.svg('pencil', 15)}</button>`}
            <button type="button" class="reward-icon-btn reward-icon-btn--danger" data-action="delete-reward" data-id="${r.id}" aria-label="Delete">${Icons.svg('trash', 15)}</button>
            <button type="button" class="reward-buy" data-action="buy-reward" data-id="${r.id}" ${r.purchased || !affordable ? 'disabled' : ''}>${r.purchased ? '✓' : I18N.t('reward_buy')}</button>
          </div>
        </div>
      </div>`;
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

  function render(state) {
    if (state.rewards == null) { state.rewards = defaultRewards(); Store.save(state); }

    const balance = Derive.rewardsBalance(state);
    const avoided = Math.round(Derive.cigarettesAvoided(state));
    const goodDays = Derive.successfulDaysCount(state);

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
          ${trophyGrid(I18N.t('trophy_cigs_avoided'), TROPHY_CIGS, avoided)}
          ${trophyGrid(I18N.t('trophy_days'), TROPHY_DAYS, goodDays)}
        </div>
      </div>
    `;
  }

  global.Tabs = global.Tabs || {};
  global.Tabs.rewards = { render };
})(window);
