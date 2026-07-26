(function (global) {
  // Premium feature list (short labels), reused on the premium card.
  const PREMIUM_FEATS = [
    'premium_feature_export_title',
    'premium_feature_ads_title',
    'premium_feature_support_title',
    'premium_feature_early_title'
  ];
  // Free tier: what you get, plus the two things kept behind premium (shown dimmed).
  const FREE_FEATS = ['feat_tracking', 'feat_stats', 'feat_health'];
  const FREE_LOCKED = ['premium_feature_export_title', 'premium_feature_support_title'];

  function feat(key, on) {
    const mark = on ? '✓' : '✕';
    return `<div class="plan-feat ${on ? '' : 'plan-feat--off'}"><span class="plan-feat-mark">${mark}</span><span>${I18N.t(key)}</span></div>`;
  }

  /* Shared two-plan chooser. opts:
     - freeAction / premiumAction: data-action for each button
     - showClose: render the ✕ (hidden in onboarding and when locked) */
  function plansHtml(opts) {
    const o = opts || {};
    const freeFeats = FREE_FEATS.map(k => feat(k, true)).join('') + FREE_LOCKED.map(k => feat(k, false)).join('');
    const premiumFeats = `<div class="plan-feat"><span class="plan-feat-mark">✓</span><span>${I18N.t('plan_everything_free')}</span></div>`
      + PREMIUM_FEATS.map(k => feat(k, true)).join('');
    return `
      ${o.showClose ? '<button type="button" class="premium-close" data-action="close-premium" aria-label="Close">✕</button>' : ''}
      <div class="plans-scroll">
        <h1 class="plans-headline">${I18N.t('plans_headline')}</h1>
        <p class="plans-sub">${I18N.t('plans_sub')}</p>

        <div class="plan-card">
          <p class="plan-tier">${I18N.t('plan_free_tier')}</p>
          <p class="plan-name">${I18N.t('plan_free_name')}</p>
          <p class="plan-price">${I18N.t('plan_free_price')}<span class="plan-period">${I18N.t('plan_free_period')}</span></p>
          <div class="plan-feats">${freeFeats}</div>
          ${o.freeAction ? `<button type="button" class="plan-select-btn plan-select-btn--ghost" data-action="${o.freeAction}">${I18N.t('plan_continue_free')}</button>` : ''}
        </div>

        <div class="plan-card plan-card--premium">
          <div class="plan-card-head">
            <p class="plan-tier plan-tier--accent">${I18N.t('plan_premium_tier')}</p>
            <span class="plan-badge">${Icons.svg('star', 12)} PRO</span>
          </div>
          <p class="plan-name">${I18N.t('plan_premium_name')}</p>
          <p class="plan-price">${I18N.t('premium_price')}<span class="plan-period">${I18N.t('premium_price_period')}</span></p>
          <div class="plan-feats">${premiumFeats}</div>
          <button type="button" class="plan-select-btn plan-select-btn--primary" data-action="${o.premiumAction}">${I18N.t('premium_upgrade_now')} ${Icons.svg('arrow-right', 16)}</button>
        </div>

        <div class="plans-trust">
          <span>${Icons.svg('shield', 14)} ${I18N.t('plans_secure')}</span>
          <span>${Icons.svg('refresh', 14)} ${I18N.t('plans_cancel')}</span>
          <span>${Icons.svg('lock', 14)} ${I18N.t('plans_encrypted')}</span>
        </div>
        <p class="premium-demo-notice">${I18N.t('premium_demo_notice')}</p>
      </div>
    `;
  }

  function open(locked) {
    document.getElementById('premiumPanel').innerHTML = plansHtml({
      showClose: !locked,
      freeAction: locked ? null : 'close-premium',
      premiumAction: 'upgrade-premium'
    });
    document.getElementById('premiumOverlay').hidden = false;
  }

  function close() {
    document.getElementById('premiumOverlay').hidden = true;
  }

  global.Premium = { open, close, plansHtml };
})(window);
