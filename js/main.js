(function () {
  let state = Store.load();
  let currentTab = 'home';
  let toastTimer = null;

  const FAB_TABS = new Set(['home', 'stats', 'program', 'health']);

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.profile.theme === 'light' ? 'light' : 'dark');
  }

  function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2200);
  }

  function renderHeader() {
    const btn = document.getElementById('avatarBtn');
    btn.innerHTML = state.profile.avatarImage
      ? `<img src="${state.profile.avatarImage}" alt="Profile photo">`
      : `<span id="avatarEmoji">${state.profile.avatarEmoji}</span>`;
  }

  function resizeImageFile(file, maxDim = 320, quality = 0.82) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          let { width, height } = img;
          if (width > height && width > maxDim) { height = Math.round(height * maxDim / width); width = maxDim; }
          else if (height > maxDim) { width = Math.round(width * maxDim / height); height = maxDim; }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function renderTab(tab) {
    const panel = document.getElementById('panel-' + tab);
    if (!panel) return;
    panel.innerHTML = Tabs[tab].render(state);
    if (tab === 'home') Tabs.home.tickCountdown(state);
  }

  function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-panel').forEach(p => { p.hidden = p.dataset.panel !== tab; });
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.tab === tab));
    document.getElementById('fabAdd').hidden = !FAB_TABS.has(tab);
    renderTab(tab);
  }

  function refreshDataDependentUI() {
    // re-render whichever tab is visible so log/program edits show up immediately
    renderTab(currentTab);
  }

  // ---- nav ----
  document.getElementById('bottomNav').addEventListener('click', e => {
    const btn = e.target.closest('.nav-item');
    if (!btn) return;
    switchTab(btn.dataset.tab);
  });

  document.getElementById('avatarBtn').addEventListener('click', () => switchTab('more'));
  document.getElementById('bellBtn').addEventListener('click', () => {
    document.getElementById('bellDot').hidden = true;
    showToast('No new notifications right now');
  });

  // ---- FAB / add-cigarette modal ----
  document.getElementById('fabAdd').addEventListener('click', () => Modal.openAddModal());
  document.getElementById('modalCancel').addEventListener('click', () => Modal.closeAddModal());
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target.id === 'modalOverlay') Modal.closeAddModal();
  });
  document.getElementById('qtyPlus').addEventListener('click', () => {
    const f = document.getElementById('fldQty');
    f.value = Math.max(1, (parseInt(f.value, 10) || 0) + 1);
  });
  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('fldQty').value = btn.dataset.qty;
      document.querySelectorAll('.quick-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
  document.getElementById('addForm').addEventListener('submit', e => {
    e.preventDefault();
    Modal.submitAddForm(state, () => {
      refreshDataDependentUI();
      showToast('Cigarette added to your log');
    });
  });

  // ---- generic sheet overlay ----
  document.getElementById('genericOverlay').addEventListener('click', e => {
    if (e.target.id === 'genericOverlay') Modal.closeGeneric();
  });

  // ---- central action dispatcher ----
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    const action = el.dataset.action;

    switch (action) {
      case 'edit-profile':
        Modal.openGeneric(Modal.editProfileHtml(state));
        break;
      case 'edit-avatar':
        document.getElementById('avatarFileInput').click();
        break;
      case 'save-profile':
        Modal.saveProfileForm(state, () => { renderHeader(); refreshDataDependentUI(); showToast('Profile updated'); });
        break;
      case 'close-generic':
        Modal.closeGeneric();
        break;
      case 'quick-add': {
        const defaults = Derive.lastEntryDefaults(state);
        const type = state.profile.quickAddType || defaults.type;
        state.log.push({ id: Store.uid(), ts: new Date().toISOString(), type, trigger: defaults.trigger, quantity: 1 });
        state.log.sort((a, b) => new Date(a.ts) - new Date(b.ts));
        Store.save(state);
        refreshDataDependentUI();
        showToast('Cigarette added');
        break;
      }
      case 'pick-quick-type':
        Modal.openGeneric(Modal.typePickerHtml(state));
        break;
      case 'select-quick-type':
        state.profile.quickAddType = el.dataset.type;
        Store.save(state);
        Modal.closeGeneric();
        refreshDataDependentUI();
        showToast('Cigarette type updated');
        break;
      case 'quick-remove': {
        const todayK = Store.todayKey();
        for (let i = state.log.length - 1; i >= 0; i--) {
          if (Store.dateKey(new Date(state.log[i].ts)) === todayK) {
            state.log.splice(i, 1);
            Store.save(state);
            refreshDataDependentUI();
            showToast('Last cigarette removed');
            break;
          }
        }
        break;
      }
      case 'toggle-theme':
        state.profile.theme = state.profile.theme === 'light' ? 'dark' : 'light';
        Store.save(state);
        applyTheme();
        refreshDataDependentUI();
        break;
      case 'export-data':
        Modal.exportCsv(state);
        showToast('File downloaded');
        break;
      case 'help-center':
        Modal.openGeneric(Modal.helpCenterHtml());
        break;
      case 'sign-out':
        if (confirm('Reset all app data and start over? This cannot be undone.')) {
          state = Store.reset();
          applyTheme();
          renderHeader();
          switchTab('home');
          showToast('App has been reset');
        }
        break;
      case 'program-restart':
        if (confirm('Restart the plan from today?')) {
          state.program.startDate = Store.todayKey();
          Store.save(state);
          refreshDataDependentUI();
          showToast('Plan restarted');
        }
        break;
      case 'program-week-older':
        Tabs.program.shiftWeek(1);
        refreshDataDependentUI();
        break;
      case 'program-week-newer':
        Tabs.program.shiftWeek(-1);
        refreshDataDependentUI();
        break;
      case 'stats-period':
        Tabs.stats.setPeriod(el.dataset.period);
        refreshDataDependentUI();
        break;
      case 'cloud-signup':
      case 'cloud-signin': {
        const email = document.getElementById('cloudEmail').value.trim();
        const password = document.getElementById('cloudPassword').value;
        const errEl = document.getElementById('cloudAuthError');
        errEl.textContent = '';
        const call = action === 'cloud-signup' ? Auth.signUp(email, password) : Auth.signIn(email, password);
        call.catch(err => { errEl.textContent = Auth.errorMessage(err); });
        break;
      }
      case 'cloud-signout':
        Auth.signOutUser();
        break;
    }
  });

  document.addEventListener('change', e => {
    if (e.target.id === 'notifToggle') {
      state.profile.notificationsEnabled = e.target.checked;
      Store.save(state);
    }
  });

  document.getElementById('avatarFileInput').addEventListener('change', async e => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      state.profile.avatarImage = await resizeImageFile(file);
      Store.save(state);
      renderHeader();
      refreshDataDependentUI();
      showToast('Profile photo updated');
    } catch (err) {
      showToast('Could not load the image');
    }
  });

  // ---- cloud account (no-op if Firebase isn't configured) ----
  Auth.onChange(user => {
    if (user) {
      Auth.pullState().then(cloudState => {
        if (cloudState) {
          state = cloudState;
          Store.save(state);
        }
        applyTheme();
        renderHeader();
        refreshDataDependentUI();
        showToast('Signed in' + (user.email ? ': ' + user.email : ''));
      });
    } else {
      refreshDataDependentUI();
    }
  });

  // ---- init ----
  function enterApp() {
    applyTheme();
    renderHeader();
    switchTab('home');
  }

  if (state.onboarding && state.onboarding.completed) {
    enterApp();
  } else {
    document.getElementById('onboardingOverlay').hidden = false;
    Onboarding.start(state, updatedState => {
      state = updatedState;
      document.getElementById('onboardingOverlay').hidden = true;
      enterApp();
    });
  }

  setInterval(() => {
    if (currentTab === 'home') Tabs.home.tickCountdown(state);
  }, 1000);
})();
