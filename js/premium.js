(function (global) {
  const FEATURES = [
    { titleKey: 'premium_feature_export_title', subKey: 'premium_feature_export_sub' },
    { titleKey: 'premium_feature_ads_title', subKey: 'premium_feature_ads_sub' },
    { titleKey: 'premium_feature_support_title', subKey: 'premium_feature_support_sub' },
    { titleKey: 'premium_feature_early_title', subKey: 'premium_feature_early_sub' }
  ];

  function render(locked) {
    return `
      ${locked ? '' : '<button type="button" class="premium-close" data-action="close-premium" aria-label="Close">✕</button>'}
      <div class="premium-scroll">
        <p class="premium-logo">Stopper</p>
        <p class="premium-label">${I18N.t('premium_plan_label')}</p>
        <p class="premium-price">${I18N.t('premium_price')}</p>
        <p class="premium-price-period">${I18N.t('premium_price_period')}</p>

        <div class="premium-features">
          ${FEATURES.map(f => `
            <div class="premium-feature">
              <span class="premium-check">✓</span>
              <div>
                <p class="premium-feature-title">${I18N.t(f.titleKey)}</p>
                <p class="premium-feature-sub">${I18N.t(f.subKey)}</p>
              </div>
            </div>
          `).join('')}
        </div>

        <button type="button" class="premium-cta" data-action="upgrade-premium">${I18N.t('premium_upgrade_now')}</button>
        <p class="premium-renewal-note">${I18N.t('premium_renewal_note')}</p>

        <button type="button" class="premium-coupon" data-action="premium-coupon">🎟️ ${I18N.t('premium_coupon')}</button>
        <p class="premium-safe">${I18N.t('premium_safe_checkout')}</p>

        <p class="premium-demo-notice">${I18N.t('premium_demo_notice')}</p>
        <p class="premium-footer-copy">Stopper Engineering. All rights reserved 2024 ©</p>
      </div>
    `;
  }

  function open(locked) {
    document.getElementById('premiumPanel').innerHTML = render(!!locked);
    document.getElementById('premiumOverlay').hidden = false;
  }

  function close() {
    document.getElementById('premiumOverlay').hidden = true;
  }

  global.Premium = { open, close };
})(window);
