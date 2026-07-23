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
                <p class="card-title" style="margin:0;">Signed in</p>
                <p class="card-sub">${Charts.esc(user.email || '')}</p>
              </div>
            </div>
            <span class="pill pill-green">Synced</span>
          </div>
          <button class="btn btn-ghost btn-block" data-action="cloud-signout" style="margin-top:12px;">Sign out</button>
        </div>
      `;
    }
    return `
      <div class="card">
        <p class="card-title" style="margin-bottom:2px;">Cloud account</p>
        <p class="card-sub" style="margin-bottom:12px;">Sign in to sync your data across devices</p>
        <label class="field-label" for="cloudEmail">Email</label>
        <input class="field-input" type="email" id="cloudEmail" autocomplete="email">
        <label class="field-label" for="cloudPassword">Password</label>
        <input class="field-input" type="password" id="cloudPassword" autocomplete="current-password">
        <p class="card-sub" id="cloudAuthError" style="color:var(--accent-red);min-height:16px;margin-top:8px;"></p>
        <div class="sheet-actions" style="margin-top:4px;">
          <button type="button" class="btn btn-ghost" data-action="cloud-signup">Sign up</button>
          <button type="button" class="btn btn-primary" data-action="cloud-signin">Sign in</button>
        </div>
      </div>
    `;
  }

  function render(state) {
    const dayIdx = Derive.daysSinceStart(state);
    const themeLabel = state.profile.theme === 'light' ? 'Light' : 'Dark';

    return `
      <div class="card profile-card">
        <div class="profile-avatar-wrap">
          ${state.profile.avatarImage
            ? `<img class="profile-avatar-img" src="${state.profile.avatarImage}" alt="Profile photo">`
            : `<div class="profile-avatar">${state.profile.avatarEmoji}</div>`}
          <button class="profile-edit-btn" data-action="edit-avatar" aria-label="Change profile photo">📷</button>
        </div>
        <p class="profile-name">${Charts.esc(state.profile.name || 'User')}</p>
        <p class="profile-sub">${Math.max(0, dayIdx)} days into the plan</p>
        <button class="pill" data-action="edit-profile" style="margin-top:2px;cursor:pointer;border:none;">Edit personal details ✎</button>
      </div>

      ${cloudAccountHtml()}

      <p class="settings-group-label">Account settings</p>
      <div class="settings-list">
        <div class="settings-row" data-action="edit-profile">
          <div class="icon-tile tile-blue" style="width:36px;height:36px;">👤</div>
          <div class="settings-row-text">
            <p class="settings-row-title">Profile settings</p>
            <p class="settings-row-sub">Update personal details and goals</p>
          </div>
          <span class="chevron">›</span>
        </div>
        <div class="settings-row">
          <div class="icon-tile tile-orange" style="width:36px;height:36px;">🔔</div>
          <div class="settings-row-text">
            <p class="settings-row-title">Notifications &amp; reminders</p>
            <p class="settings-row-sub">Get daily progress updates</p>
          </div>
          <label class="switch">
            <input type="checkbox" id="notifToggle" ${state.profile.notificationsEnabled ? 'checked' : ''}>
            <span class="switch-track"></span>
          </label>
        </div>
        <div class="settings-row" data-action="toggle-theme">
          <div class="icon-tile tile-violet" style="width:36px;height:36px;">🎨</div>
          <div class="settings-row-text">
            <p class="settings-row-title">App appearance</p>
            <p class="settings-row-sub">Light / dark mode</p>
          </div>
          <span class="pill">${themeLabel}</span>
        </div>
      </div>

      <p class="settings-group-label">Info &amp; support</p>
      <div class="settings-list">
        <div class="settings-row" data-action="export-data">
          <div class="icon-tile tile-green" style="width:36px;height:36px;">📤</div>
          <div class="settings-row-text">
            <p class="settings-row-title">Export data for your doctor</p>
            <p class="settings-row-sub">Download a CSV of your smoking history</p>
          </div>
          <span class="chevron">›</span>
        </div>
        <div class="settings-row" data-action="help-center">
          <div class="icon-tile tile-blue" style="width:36px;height:36px;">❓</div>
          <div class="settings-row-text">
            <p class="settings-row-title">Help &amp; support center</p>
            <p class="settings-row-sub">Tips for coping with cravings</p>
          </div>
          <span class="chevron">›</span>
        </div>
      </div>

      <button class="btn btn-danger btn-block" data-action="sign-out" style="margin-top:6px;">Reset and start over</button>
    `;
  }

  global.Tabs = global.Tabs || {};
  global.Tabs.more = { render };
})(window);
