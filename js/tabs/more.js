(function (global) {
  function premiumCardHtml(state) {
    if (state.profile.premium) {
      return `
        <div class="card">
          <div class="card-row" style="justify-content:space-between;">
            <div class="card-row">
              <div class="icon-tile tile-orange">${Icons.svg('star', 22)}</div>
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
            <div class="icon-tile tile-orange">${Icons.svg('star', 22)}</div>
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
            : `<div class="profile-avatar">${Icons.svg('person', 34)}</div>`}
          <button class="profile-edit-btn" data-action="edit-avatar" aria-label="Change profile photo">${Icons.svg('camera', 15)}</button>
        </div>
        <p class="profile-name">${Charts.esc(state.profile.name || 'User')}</p>
        <p class="profile-sub">${I18N.t('more_days_into_plan', { n: Math.max(0, dayIdx) })}</p>
        <button class="pill" data-action="edit-profile" style="margin-top:2px;cursor:pointer;border:none;">${I18N.t('more_edit_personal')}</button>
      </div>

      ${premiumCardHtml(state)}

      <p class="settings-group-label">${I18N.t('more_account_settings')}</p>
      <div class="settings-list">
        <div class="settings-row" data-action="edit-profile">
          <div class="icon-tile tile-blue" style="width:36px;height:36px;">${Icons.svg('person', 18)}</div>
          <div class="settings-row-text">
            <p class="settings-row-title">${I18N.t('more_profile_settings')}</p>
            <p class="settings-row-sub">${I18N.t('more_profile_settings_sub')}</p>
          </div>
          <span class="chevron">›</span>
        </div>
        <div class="settings-row">
          <div class="icon-tile tile-orange" style="width:36px;height:36px;">${Icons.svg('bell', 18)}</div>
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
          <div class="icon-tile tile-violet" style="width:36px;height:36px;">${Icons.svg('palette', 18)}</div>
          <div class="settings-row-text">
            <p class="settings-row-title">${I18N.t('more_appearance')}</p>
            <p class="settings-row-sub">${I18N.t('more_appearance_sub')}</p>
          </div>
          <span class="pill">${themeLabel}</span>
        </div>
        <div class="settings-row" data-action="pick-language">
          <div class="icon-tile tile-green" style="width:36px;height:36px;">${Icons.svg('globe', 18)}</div>
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
          <div class="icon-tile tile-violet" style="width:36px;height:36px;">${Icons.svg('link', 18)}</div>
          <div class="settings-row-text">
            <p class="settings-row-title">${I18N.t('more_share_app')}</p>
            <p class="settings-row-sub">${I18N.t('more_share_app_sub')}</p>
          </div>
          <span class="chevron">›</span>
        </div>
        <div class="settings-row" data-action="export-data">
          <div class="icon-tile tile-green" style="width:36px;height:36px;">${Icons.svg('download', 18)}</div>
          <div class="settings-row-text">
            <p class="settings-row-title">${I18N.t('more_export_data')}</p>
            <p class="settings-row-sub">${I18N.t('more_export_data_sub')}</p>
          </div>
          <span class="chevron">›</span>
        </div>
        <div class="settings-row" data-action="help-center">
          <div class="icon-tile tile-blue" style="width:36px;height:36px;">${Icons.svg('help', 18)}</div>
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
