(function () {
  let state = Store.load();
  let currentTab = 'home';
  let toastTimer = null;

  const FAB_TABS = new Set(['home', 'stats', 'program', 'health']);

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.profile.theme === 'light' ? 'light' : 'dark');
  }

  function applyLanguage() {
    let lang = state.profile.language || 'en';
    if (!I18N.LANGS.some(l => l.code === lang)) { lang = 'en'; state.profile.language = 'en'; }
    I18N.setLang(lang);
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', I18N.dirFor(lang));
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = I18N.t(el.dataset.i18n); });
    populateModalSelects();
  }

  function populateModalSelects() {
    const typeSel = document.getElementById('fldType');
    const trigSel = document.getElementById('fldTrigger');
    if (typeSel) {
      const cur = typeSel.value;
      typeSel.innerHTML = Store.CIG_TYPES.map(t => `<option value="${t}">${Charts.esc(Store.cigTypeLabel(t))}</option>`).join('');
      if (cur) typeSel.value = cur;
    }
    if (trigSel) {
      const cur = trigSel.value;
      trigSel.innerHTML = Store.TRIGGERS.map(t => `<option value="${t}">${Charts.esc(Store.triggerLabel(t))}</option>`).join('');
      if (cur) trigSel.value = cur;
    }
  }

  function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2200);
  }
  window.AppToast = showToast; // exposed so coach.js can surface its own errors

  function updateBellDot() {
    document.getElementById('bellDot').hidden = Notify.unreadCount(state) === 0;
  }

  // Evaluate finished days for goal-met celebrations. Auto-pops the newest one
  // (unless the paywall is taking over) and refreshes the bell indicator.
  function syncNotifications(autoOpen) {
    const created = Notify.sync(state);
    updateBellDot();
    if (autoOpen && created.length && !Derive.isLocked(state)) {
      Notify.open(created[created.length - 1], state);
      updateBellDot();
    }
  }

  function renderHeader() {
    const btn = document.getElementById('avatarBtn');
    btn.innerHTML = state.profile.avatarImage
      ? `<img src="${state.profile.avatarImage}" alt="Profile photo">`
      : Icons.svg('person', 20);
    // The upgrade pill is the premium offer every non-premium user sees up front.
    document.getElementById('upgradePill').hidden = !!state.profile.premium;
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

  // ---- trial hard-paywall: once the free trial is over and the user hasn't
  // upgraded, any interaction outside the premium screen routes to it. ----
  document.addEventListener('click', e => {
    if (!Derive.isLocked(state)) return;
    if (e.target.closest('#premiumOverlay')) return; // let the paywall's own buttons work
    e.stopPropagation();
    e.preventDefault();
    Premium.open(true);
  }, true);

  // ---- nav ----
  document.getElementById('bottomNav').addEventListener('click', e => {
    const btn = e.target.closest('.nav-item');
    if (!btn) return;
    switchTab(btn.dataset.tab);
  });

  document.getElementById('avatarBtn').addEventListener('click', () => switchTab('more'));
  document.getElementById('bellBtn').addEventListener('click', () => {
    const notif = Notify.latest(state);
    if (notif) {
      Notify.open(notif, state);   // reopen the most recent celebration
    } else {
      showToast(I18N.t('toast_no_notifications'));
    }
    updateBellDot();
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
    Modal.submitAddForm(state, wasEdit => {
      updateBellDot();
      refreshDataDependentUI();
      showToast(I18N.t(wasEdit ? 'toast_log_updated' : 'toast_cig_added_log'));
    });
  });

  // ---- generic sheet overlay ----
  document.getElementById('genericOverlay').addEventListener('click', e => {
    if (e.target.id === 'genericOverlay') Modal.closeGeneric();
  });

  // ---- goal-met celebration ----
  document.getElementById('celebrateOverlay').addEventListener('click', e => {
    if (e.target.id === 'celebrateOverlay' || e.target.id === 'celebrateConfetti') {
      Notify.close();
      updateBellDot();
    }
  });

  // ---- coach chat ----
  document.getElementById('coachOverlay').addEventListener('click', e => {
    if (e.target.id === 'coachOverlay') Coach.close();
  });

  // ---- Escape closes the topmost open overlay (never the locked paywall) ----
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!document.getElementById('celebrateOverlay').hidden) { Notify.close(); updateBellDot(); }
    else if (!document.getElementById('coachOverlay').hidden) { Coach.close(); }
    else if (!document.getElementById('modalOverlay').hidden) { Modal.closeAddModal(); }
    else if (!document.getElementById('genericOverlay').hidden) { Modal.closeGeneric(); }
    else if (!document.getElementById('premiumOverlay').hidden && !Derive.isLocked(state)) { Premium.close(); }
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
        Modal.saveProfileForm(state, () => { renderHeader(); refreshDataDependentUI(); showToast(I18N.t('toast_profile_updated')); });
        break;
      case 'close-generic':
        Modal.closeGeneric();
        break;
      case 'celebrate-close':
        Notify.close();
        updateBellDot();
        break;
      case 'quick-add': {
        const defaults = Derive.lastEntryDefaults(state);
        const type = state.profile.quickAddType || defaults.type;
        const trigger = state.profile.quickAddTrigger || defaults.trigger;
        state.log.push({ id: Store.uid(), ts: new Date().toISOString(), type, trigger, quantity: 1 });
        state.log.sort((a, b) => new Date(a.ts) - new Date(b.ts));
        Store.save(state);
        refreshDataDependentUI();
        showToast(I18N.t('toast_cig_added'));
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
        showToast(I18N.t('toast_cig_type_updated'));
        break;
      case 'pick-quick-trigger':
        Modal.openGeneric(Modal.triggerPickerHtml(state));
        break;
      case 'select-quick-trigger':
        state.profile.quickAddTrigger = el.dataset.trigger;
        Store.save(state);
        Modal.closeGeneric();
        refreshDataDependentUI();
        showToast(I18N.t('toast_trigger_updated'));
        break;
      case 'quick-remove': {
        const todayK = Store.todayKey();
        for (let i = state.log.length - 1; i >= 0; i--) {
          if (Store.dateKey(new Date(state.log[i].ts)) === todayK) {
            state.log.splice(i, 1);
            Store.save(state);
            refreshDataDependentUI();
            showToast(I18N.t('toast_last_cig_removed'));
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
      case 'pick-language':
        Modal.openGeneric(Tabs.more.languagePickerHtml(state));
        break;
      case 'select-language':
        state.profile.language = el.dataset.lang;
        Store.save(state);
        Modal.closeGeneric();
        applyLanguage();
        refreshDataDependentUI();
        showToast(I18N.t('toast_language_updated'));
        break;
      case 'share-app': {
        const shareData = { title: 'Quitly', text: 'I\'m using this app to quit smoking — check it out', url: location.href };
        if (navigator.share) {
          navigator.share(shareData).catch(() => {});
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(shareData.url).then(() => showToast(I18N.t('toast_link_copied')));
        } else {
          showToast(shareData.url);
        }
        break;
      }
      case 'export-data':
        Modal.exportCsv(state);
        showToast(I18N.t('toast_file_downloaded'));
        break;
      case 'help-center':
        Modal.openGeneric(Modal.helpCenterHtml());
        break;
      case 'tip-spin':
        Tips.spin();
        break;
      case 'open-history':
        Modal.openGeneric(Modal.historyHtml(state));
        break;
      case 'add-reward':
        Modal.openGeneric(Modal.rewardFormHtml(null));
        break;
      case 'open-reward-detail': {
        const r = (state.rewards || []).find(x => x.id === el.dataset.id);
        if (r) Modal.openGeneric(Tabs.rewards.rewardDetailHtml(r, Derive.rewardsBalance(state)));
        break;
      }
      case 'edit-reward': {
        const r = (state.rewards || []).find(x => x.id === el.dataset.id);
        if (r) Modal.openGeneric(Modal.rewardFormHtml(r));
        break;
      }
      case 'save-reward':
        Modal.saveRewardForm(state, el.dataset.id, () => { refreshDataDependentUI(); showToast(I18N.t('toast_reward_saved')); });
        break;
      case 'delete-reward': {
        const i = (state.rewards || []).findIndex(x => x.id === el.dataset.id);
        if (i !== -1 && confirm(I18N.t('confirm_delete_reward'))) {
          state.rewards.splice(i, 1);
          Store.save(state);
          Modal.closeGeneric();
          refreshDataDependentUI();
          showToast(I18N.t('toast_reward_deleted'));
        }
        break;
      }
      case 'buy-reward': {
        const r = (state.rewards || []).find(x => x.id === el.dataset.id);
        if (r && !r.purchased && Derive.rewardsBalance(state) >= r.cost) {
          r.purchased = true;
          Store.save(state);
          Modal.closeGeneric();
          refreshDataDependentUI();
          showToast(I18N.t('toast_reward_bought'));
        }
        break;
      }
      case 'edit-log': {
        const entry = state.log.find(x => x.id === el.dataset.id);
        if (entry) { Modal.closeGeneric(); Modal.openAddModal(entry); }
        break;
      }
      case 'delete-log': {
        const i = state.log.findIndex(x => x.id === el.dataset.id);
        if (i !== -1 && confirm(I18N.t('confirm_delete_log'))) {
          state.log.splice(i, 1);
          Store.save(state);
          updateBellDot();
          refreshDataDependentUI();
          Modal.openGeneric(Modal.historyHtml(state)); // re-render the list in place
          showToast(I18N.t('toast_log_deleted'));
        }
        break;
      }
      case 'open-paywall':
        Premium.open(Derive.isLocked(state));
        break;
      case 'open-coach':
        Coach.open(state);
        break;
      case 'coach-close':
        Coach.close();
        break;
      case 'close-premium':
        Premium.close();
        break;
      case 'premium-coupon':
        showToast(I18N.t('toast_coupon_soon'));
        break;
      case 'upgrade-premium':
        state.profile.premium = true; // unlocks continued access; plan length is unchanged
        Store.save(state);
        Premium.close();
        renderHeader();
        refreshDataDependentUI();
        showToast(I18N.t('toast_premium_unlocked'));
        break;
      case 'cancel-premium':
        state.profile.premium = false;
        Store.save(state);
        renderHeader();
        refreshDataDependentUI();
        showToast(I18N.t('toast_premium_cancelled'));
        break;
      case 'sign-out':
        if (confirm(I18N.t('confirm_reset'))) {
          state = Store.reset();
          applyLanguage();
          applyTheme();
          renderHeader();
          switchTab('home');
          showToast(I18N.t('toast_app_reset'));
        }
        break;
      case 'program-restart':
        if (confirm(I18N.t('confirm_restart_plan'))) {
          state.program.startDate = Store.todayKey();
          Store.save(state);
          refreshDataDependentUI();
          showToast(I18N.t('toast_plan_restarted'));
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
    }
  });

  document.addEventListener('change', e => {
    if (e.target.id === 'notifToggle') {
      state.profile.notificationsEnabled = e.target.checked;
      Store.save(state);
      if (state.profile.notificationsEnabled) syncNotifications(false);
      else updateBellDot();
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
      showToast(I18N.t('toast_photo_updated'));
    } catch (err) {
      showToast(I18N.t('toast_image_error'));
    }
  });

  // ---- cloud account (no-op if Firebase isn't configured) ----
  Auth.onChange(user => {
    if (user && !user.isAnonymous) {
      Auth.pullState().then(cloudState => {
        if (cloudState) {
          state = cloudState;
          Store.save(state);
        }
      }).catch(err => console.error('Cloud sync failed', err))
        .then(() => {
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
    applyLanguage();
    applyTheme();
    renderHeader();
    switchTab('home');
    if (Derive.isLocked(state)) Premium.open(true);
    syncNotifications(true);
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

  let lastSeenDayKey = Store.todayKey();
  setInterval(() => {
    if (currentTab === 'home') Tabs.home.tickCountdown(state);
    // Day rolled over while the app stayed open — yesterday is now a finished
    // day, so re-evaluate it for a goal-met celebration.
    const nowKey = Store.todayKey();
    if (nowKey !== lastSeenDayKey) {
      lastSeenDayKey = nowKey;
      syncNotifications(true);
    }
  }, 1000);
})();
