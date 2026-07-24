(function (global) {
  function cloudAccountHtml() {
    if (!global.Auth || !global.Auth.isConfigured) return '';
    const user = global.Auth.currentUser;
    if (user) {
      return `
        <div class="card">
          <div class="card-row" style="justify-content:space-between;">
            <div class="card-row">
              <div class="icon-tile tile-green">☁️</div>
              <div>
                <p class="card-title" style="margin:0;">${I18N.t('more_signed_in')}</p>
                <p class="card-sub">${Charts.esc(user.email || '')}</p>
              </div>
            </div>
            <span class="pill pill-green">${I18N.t('more_synced')}</span>
          </div>
          <button class="btn btn-ghost btn-block" data-action="cloud-signout" style="margin-top:12px;">${I18N.t('more_signout')}</button>
        </div>
      `;
    }
    return `
      <div class="card">
        <p class="card-title" style="margin-bottom:2px;">${I18N.t('more_cloud_account')}</p>
        <p class="card-sub" style="margin-bottom:12px;">${I18N.t('more_cloud_sub')}</p>
        <label class="field-label" for="cloudEmail">${I18N.t('more_email')}</label>
        <input class="field-input" type="email" id="cloudEmail" autocomplete="email">
        <label class="field-label" for="cloudPassword">${I18N.t('more_password')}</label>
        <input class="field-input" type="password" id="cloudPassword" autocomplete="current-password">
        <p class="card-sub" id="cloudAuthError" style="color:var(--accent-red);min-height:16px;margin-top:8px;"></p>
        <div class="sheet-actions" style="margin-top:4px;">
          <button type="button" class="btn btn-ghost" data-action="cloud-signup">${I18N.t('more_signup')}</button>
          <button type="button" class="btn btn-primary" data-action="cloud-signin">${I18N.t('more_signin')}</button>
        </div>
        <p class="card-sub" style="text-align:center;margin:12px 0;">${I18N.t('more_or')}</p>
        <button type="button" class="btn btn-ghost btn-block" data-action="cloud-google">${I18N.t('more_google')}</button>
      </div>
    `;
  }

  function premiumCardHtml(state) {
    if (state.profile.premium) {
      return `
        <div class="card">
          <div class="card-row" style="justify-content:space-between;">
            <div class="card-row">
              <div class="icon-tile tile-orange">⭐</div>
              <p class="card-title" style="margin:0;">${I18N.t('premium_active')}</p>
            </div>
            <button type="button" class="btn btn-ghost" data-action="cancel-premium">${I18N.t('premium_cancel')}</button>
          </div>
        </div>
      `;
    }
    const daysLeft = Derive.trialDaysLeft(state);
    const trialSub = daysLeft > 0 ? I18N.t('premium_trial_left', { n: daysLeft }) : I18N.t('premium_trial_ended');
    return `
      <div class="card">
        <div class="card-row" style="justify-content:space-between;">
          <div class="card-row">
            <div class="icon-tile tile-orange">⭐</div>
            <div>
              <p class="card-title" style="margin:0;">${I18N.t('premium_title')}</p>
              <p class="card-sub">${Charts.esc(trialSub)}</p>
            </div>
          </div>
          <button type="button" class="btn btn-primary" data-action="open-paywall">${I18N.t('premium_cta')}</button>
        </div>
      </div>
    `;
  }

  function render(state) {
    const dayIdx = Derive.daysSinceStart(state);
    const themeLabel = state.profile.theme === 'light' ? I18N.t('more_light') : I18N.t('more_dark');
    const currentLangLabel = (I18N.LANGS.find(l => l.code === (state.profile.language || 'en')) || I18N.LANGS[0]).label;

    return `
      <div class="card profile-card">
        <div class="profile-avatar-wrap">
          ${state.profile.avatarImage
            ? `<img class="profile-avatar-img" src="${state.profile.avatarImage}" alt="Profile photo">`
            : `<div class="profile-avatar">${state.profile.avatarEmoji}</div>`}
          <button class="profile-edit-btn" data-action="edit-avatar" aria-label="Change profile photo">📷</button>
        </div>
        <p class="profile-name">${Charts.esc(state.profile.name || 'User')}</p>
        <p class="profile-sub">${I18N.t('more_days_into_plan', { n: Math.max(0, dayIdx) })}</p>
        <button class="pill" data-action="edit-profile" style="margin-top:2px;cursor:pointer;border:none;">${I18N.t('more_edit_personal')}</button>
      </div>

      ${premiumCardHtml(state)}
      ${cloudAccountHtml()}

      <p class="settings-group-label">${I18N.t('more_account_settings')}</p>
      <div class="settings-list">
        <div class="settings-row" data-action="edit-profile">
          <div class="icon-tile tile-blue" style="width:36px;height:36px;">👤</div>
          <div class="settings-row-text">
            <p class="settings-row-title">${I18N.t('more_profile_settings')}</p>
            <p class="settings-row-sub">${I18N.t('more_profile_settings_sub')}</p>
          </div>
          <span class="chevron">›</span>
        </div>
        <div class="settings-row">
          <div class="icon-tile tile-orange" style="width:36px;height:36px;">🔔</div>
          <div class="settings-row-text">
            <p class="settings-row-title">${I18N.t('more_notifications')}</p>
            <p class="settings-row-sub">${I18N.t('more_notifications_sub')}</p>
          </div>
          <label class="switch">
            <input type="checkbox" id="notifToggle" ${state.profile.notificationsEnabled ? 'checked' : ''}>
            <span class="switch-track"></span>
          </label>
        </div>
        <div class="settings-row" data-action="toggle-theme">
          <div class="icon-tile tile-violet" style="width:36px;height:36px;">🎨</div>
          <div class="settings-row-text">
            <p class="settings-row-title">${I18N.t('more_appearance')}</p>
            <p class="settings-row-sub">${I18N.t('more_appearance_sub')}</p>
          </div>
          <span class="pill">${themeLabel}</span>
        </div>
        <div class="settings-row" data-action="pick-language">
          <div class="icon-tile tile-green" style="width:36px;height:36px;">🌐</div>
          <div class="settings-row-text">
            <p class="settings-row-title">${I18N.t('more_language')}</p>
            <p class="settings-row-sub">${I18N.t('more_language_sub')}</p>
          </div>
          <span class="pill">${Charts.esc(currentLangLabel)}</span>
        </div>
      </div>

      <p class="settings-group-label">${I18N.t('more_info_support')}</p>
      <div class="settings-list">
        <div class="settings-row" data-action="share-app">
          <div class="icon-tile tile-violet" style="width:36px;height:36px;">🔗</div>
          <div class="settings-row-text">
            <p class="settings-row-title">${I18N.t('more_share_app')}</p>
            <p class="settings-row-sub">${I18N.t('more_share_app_sub')}</p>
          </div>
          <span class="chevron">›</span>
        </div>
        <div class="settings-row" data-action="export-data">
          <div class="icon-tile tile-green" style="width:36px;height:36px;">📤</div>
          <div class="settings-row-text">
            <p class="settings-row-title">${I18N.t('more_export_data')}</p>
            <p class="settings-row-sub">${I18N.t('more_export_data_sub')}</p>
          </div>
          <span class="chevron">›</span>
        </div>
        <div class="settings-row" data-action="help-center">
          <div class="icon-tile tile-blue" style="width:36px;height:36px;">❓</div>
          <div class="settings-row-text">
            <p class="settings-row-title">${I18N.t('more_help_center')}</p>
            <p class="settings-row-sub">${I18N.t('more_help_center_sub')}</p>
          </div>
          <span class="chevron">›</span>
        </div>
      </div>

      <button class="btn btn-danger btn-block" data-action="sign-out" style="margin-top:6px;">${I18N.t('more_reset')}</button>
    `;
  }

  function languagePickerHtml(state) {
    const current = state.profile.language || 'en';
    return `
      <h2>${I18N.t('choose_language_title')}</h2>
      ${I18N.LANGS.map(l => `
        <button type="button" class="type-picker-item ${l.code === current ? 'selected' : ''}" data-action="select-language" data-lang="${l.code}">
          <span>${Charts.esc(l.label)}</span>${l.code === current ? '<span>✓</span>' : ''}
        </button>
      `).join('')}
    `;
  }

  global.Tabs = global.Tabs || {};
  global.Tabs.more = { render, languagePickerHtml };
})(window);
