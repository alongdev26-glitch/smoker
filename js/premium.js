(function (global) {
  // Base app features both paid tiers include, plus the premium-only extras.
  // Premium+ shows all 4 extras; regular Premium shows a shorter list so the
  // two tiers read as clearly different.
  const BASE_FEATS = ['feat_tracking', 'feat_stats', 'feat_health'];
  const PREMIUM_FEATS = [
    'premium_feature_export_title',
    'premium_feature_ads_title',
    'premium_feature_support_title',
    'premium_feature_early_title'
  ];
  const PREMIUM_FEATS_BASIC = ['premium_feature_export_title', 'premium_feature_ads_title'];

  function feat(key, on) {
    const mark = on ? '✓' : '✕';
    return `<div class="plan-feat ${on ? '' : 'plan-feat--off'}"><span class="plan-feat-mark">${mark}</span><span>${I18N.t(key)}</span></div>`;
  }

  /* Shared plan chooser. opts:
     - premiumAction / premiumPlusAction: data-action for each button
     - showClose: render the ✕ (hidden in onboarding and when locked) */
  function plansHtml(opts) {
    const o = opts || {};
    const baseFeats = BASE_FEATS.map(k => feat(k, true)).join('');
    const premiumBasicFeats = baseFeats + PREMIUM_FEATS_BASIC.map(k => feat(k, true)).join('');
    const premiumPlusFeats = baseFeats + PREMIUM_FEATS.map(k => feat(k, true)).join('');
    return `
      ${o.showClose ? '<button type="button" class="premium-close" data-action="close-premium" aria-label="Close">✕</button>' : ''}
      <div class="plans-scroll">
        <h1 class="plans-headline">${I18N.t('plans_headline')}</h1>
        <p class="plans-sub">${I18N.t('plans_sub')}</p>

        <div class="plan-card plan-card--premium">
          <div class="plan-card-head">
            <p class="plan-tier plan-tier--accent">${I18N.t('plan_premium_tier')}</p>
            <span class="plan-badge">${Icons.svg('star', 12)} PRO</span>
          </div>
          <p class="plan-name">${I18N.t('plan_premium_name')}</p>
          <p class="plan-price">${I18N.t('premium_price')}<span class="plan-period">${I18N.t('premium_price_period')}</span></p>
          <span class="plan-discount-badge">${I18N.t('premium_trial_badge')}</span>
          <div class="plan-feats">${premiumBasicFeats}</div>
          <button type="button" class="plan-select-btn plan-select-btn--primary" data-action="${o.premiumAction}">${I18N.t('premium_free_month_cta')} ${Icons.svg('arrow-right', 16)}</button>
        </div>

        <div class="plan-card plan-card--premium-plus">
          <div class="plan-card-head">
            <p class="plan-tier plan-tier--accent">${I18N.t('plan_premium_plus_tier')}</p>
            <span class="plan-badge plan-badge--plus">${Icons.svg('star', 12)} PRO+</span>
          </div>
          <p class="plan-name">${I18N.t('plan_premium_plus_name')}</p>
          <p class="plan-price">
            <span class="plan-price-original">${I18N.t('premium_plus_price_original')}</span>
            ${I18N.t('premium_plus_price')}<span class="plan-period">${I18N.t('premium_plus_price_period')}</span>
          </p>
          <span class="plan-discount-badge">${I18N.t('premium_plus_discount_badge')}</span>
          <div class="plan-feats">${premiumPlusFeats}</div>
          <button type="button" class="plan-select-btn plan-select-btn--primary" data-action="${o.premiumPlusAction}">${I18N.t('premium_upgrade_now')} ${Icons.svg('arrow-right', 16)}</button>
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

  function loadingHtml() {
    return `
      <div class="loading-screen loading-screen--standalone">
        <div class="loading-percent" id="premiumLoadingPercent">0%</div>
        <p class="loading-title">${I18N.t('premium_calc_title')}</p>
        <p class="loading-subtitle">${I18N.t('premium_calc_sub')}</p>
        <div class="loading-checklist">
          <div class="loading-check-row" id="premiumLoadingCheck0"><span>${I18N.t('premium_calc_1')}</span><span class="loading-check-dot">✓</span></div>
          <div class="loading-check-row" id="premiumLoadingCheck1"><span>${I18N.t('premium_calc_2')}</span><span class="loading-check-dot">✓</span></div>
          <div class="loading-check-row" id="premiumLoadingCheck2"><span>${I18N.t('premium_calc_3')}</span><span class="loading-check-dot">✓</span></div>
        </div>
      </div>
    `;
  }

  // Runs the same percent + checklist animation as onboarding's loading step, then calls onDone.
  function runLoadingAnimation(onDone) {
    let pct = 0;
    const el = document.getElementById('premiumLoadingPercent');
    const rows = [document.getElementById('premiumLoadingCheck0'), document.getElementById('premiumLoadingCheck1'), document.getElementById('premiumLoadingCheck2')];
    const timer = setInterval(() => {
      pct = Math.min(100, pct + 3 + Math.random() * 3);
      const shown = Math.floor(pct);
      if (el) el.textContent = shown + '%';
      if (shown >= 35 && rows[0]) rows[0].classList.add('done');
      if (shown >= 70 && rows[1]) rows[1].classList.add('done');
      if (shown >= 100) {
        if (rows[2]) rows[2].classList.add('done');
        clearInterval(timer);
        setTimeout(onDone, 450);
      }
    }, 70);
  }

  function open(locked) {
    document.getElementById('premiumPanel').innerHTML = plansHtml({
      showClose: !locked,
      premiumAction: 'upgrade-premium',
      premiumPlusAction: 'upgrade-premium-plus'
    });
    document.getElementById('premiumOverlay').hidden = false;
  }

  function close() {
    document.getElementById('premiumOverlay').hidden = true;
  }

  global.Premium = { open, close, plansHtml, loadingHtml, runLoadingAnimation };
})(window);
