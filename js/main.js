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
      typeSel.innerHTML = Substances.types(state.profile.substance).map(t => `<option value="${t.key}">${Charts.esc(Substances.typeLabel(state.profile.substance, t.key))}</option>`).join('');
      if (cur) typeSel.value = cur;
    }
    if (trigSel) {
      const cur = trigSel.value;
      trigSel.innerHTML = Store.TRIGGERS.map(t => `<option value="${t}">${Charts.esc(Store.triggerLabel(t))}</option>`).join('');
      if (cur) trigSel.value = cur;
    }
  }

  function unitVars() {
    const lang = I18N.getLang();
    return { unit: Substances.unit(state.profile.substance, lang, 1), units: Substances.unit(state.profile.substance, lang, 2) };
  }

  // Live "this entry will cost about $X" line in the manual add/edit log form —
  // pricePerUnit is per substance, not per type, so only quantity affects it.
  function updateCostEstimate() {
    const el = document.getElementById('fldCostEstimate');
    if (!el) return;
    const qty = Math.max(1, parseInt(document.getElementById('fldQty').value, 10) || 1);
    const pricePerUnit = Substances.get(state.profile.substance).pricePerUnit;
    el.textContent = I18N.t('add_cost_estimate', { amount: '$' + (pricePerUnit * qty).toFixed(2) });
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
    panel.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = I18N.t(el.dataset.i18n); });
    if (tab === 'home') Tabs.home.tickCountdown(state);
  }

  function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-panel').forEach(p => { p.hidden = p.dataset.panel !== tab; });
    document.querySelectorAll('.icon-nav-item').forEach(n => n.classList.toggle('active', n.dataset.tab === tab));
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

  // ---- icon carousel navigation (swipeable strip, 3 items visible) ----
  const track = document.getElementById('iconTrack');
  const viewport = document.querySelector('.icon-nav-viewport');
  const navItems = document.querySelectorAll('.icon-nav-item');
  const itemCount = navItems.length;
  const ITEM_W = 90;
  const GAP = 16;
  const SLOT = ITEM_W + GAP;
  const maxPos = itemCount - 1;
  let currentPos = 0; // continuous index; 0 = first item centered

  function applyTrackTransform() {
    const baseOffset = viewport.clientWidth / 2 - ITEM_W / 2;
    const idealOffset = baseOffset - currentPos * SLOT;
    const trackWidth = itemCount * ITEM_W + (itemCount - 1) * GAP;
    const minOffset = Math.min(0, viewport.clientWidth - trackWidth);
    const offset = Math.max(minOffset, Math.min(0, idealOffset));
    track.style.transform = `translateX(${offset}px)`;
  }

  // Items near the centered slot are bigger/brighter; ones drifting toward
  // the edge shrink and fade, giving the strip depth as it's dragged.
  function updateItemVisuals() {
    navItems.forEach((item, i) => {
      const dist = Math.abs(i - currentPos);
      const scale = Math.min(1.15, Math.max(0.75, 1.15 - dist * 0.32));
      const opacity = Math.min(1, Math.max(0.35, 1 - dist * 0.45));
      item.style.setProperty('--item-scale', scale.toFixed(3));
      item.style.setProperty('--item-opacity', opacity.toFixed(3));
    });
  }

  function setActiveIndex(idx) {
    const clamped = Math.max(0, Math.min(maxPos, idx));
    const selected = navItems[clamped];
    if (selected) {
      navItems.forEach(item => item.classList.remove('active'));
      selected.classList.add('active');
      switchTab(selected.dataset.tab);
    }
  }

  function updateActiveFromPos() {
    setActiveIndex(Math.round(currentPos));
  }

  function setPos(newPos) {
    currentPos = Math.max(0, Math.min(maxPos, newPos));
    applyTrackTransform();
    updateItemVisuals();
    updateActiveFromPos();
  }

  // Purely cosmetic slide — the active tab is switched instantly by the
  // caller, this just eases the strip into its resting position.
  function animateTo(targetPos, duration = 500) {
    const start = currentPos;
    const diff = targetPos - start;
    const startTime = Date.now();
    function step() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      currentPos = start + diff * ease;
      applyTrackTransform();
      updateItemVisuals();
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        currentPos = targetPos;
        applyTrackTransform();
        updateItemVisuals();
      }
    }
    step();
  }

  let isDragging = false;
  let lastX = 0;

  viewport.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastX = e.clientX;
    track.style.transition = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - lastX;
    setPos(currentPos - deltaX / SLOT);
    lastX = e.clientX;
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    const target = Math.round(currentPos);
    setActiveIndex(target);
    track.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    animateTo(target, 500);
  });

  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
    track.style.transition = isDragging ? 'none' : 'transform 0.3s ease-out';
    setPos(currentPos + delta * 0.008);
  }, { passive: false });

  viewport.addEventListener('touchstart', (e) => {
    isDragging = true;
    lastX = e.touches[0].clientX;
    track.style.transition = 'none';
  });

  document.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const deltaX = e.touches[0].clientX - lastX;
    setPos(currentPos - deltaX / SLOT);
    lastX = e.touches[0].clientX;
  }, { passive: true });

  document.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;
    const target = Math.round(currentPos);
    setActiveIndex(target);
    track.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    animateTo(target, 500);
  });

  navItems.forEach((item, i) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      setActiveIndex(i);
      track.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      animateTo(i, 500);
    });
  });

  applyTrackTransform();
  updateItemVisuals();
  updateActiveFromPos();

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
  document.getElementById('fabAdd').addEventListener('click', () => { Modal.openAddModal(state); updateCostEstimate(); });
  document.getElementById('modalCancel').addEventListener('click', () => Modal.closeAddModal());
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target.id === 'modalOverlay') Modal.closeAddModal();
  });
  document.getElementById('fldQty').addEventListener('input', updateCostEstimate);
  document.getElementById('qtyPlus').addEventListener('click', () => {
    const f = document.getElementById('fldQty');
    f.value = Math.max(1, (parseInt(f.value, 10) || 0) + 1);
    updateCostEstimate();
  });
  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('fldQty').value = btn.dataset.qty;
      document.querySelectorAll('.quick-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      updateCostEstimate();
    });
  });
  document.getElementById('addForm').addEventListener('submit', e => {
    e.preventDefault();
    Modal.submitAddForm(state, wasEdit => {
      updateBellDot();
      refreshDataDependentUI();
      showToast(I18N.t(wasEdit ? 'toast_log_updated' : 'toast_cig_added_log', unitVars()));
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

  // ---- Escape closes the topmost open overlay (never the locked paywall) ----
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!document.getElementById('celebrateOverlay').hidden) { Notify.close(); updateBellDot(); }
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
        showToast(I18N.t('toast_cig_added', unitVars()));
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
        showToast(I18N.t('toast_cig_type_updated', unitVars()));
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
            showToast(I18N.t('toast_last_cig_removed', unitVars()));
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
      case 'share-progress': {
        const avoided = Math.round(Derive.cigarettesAvoided(state));
        const money = Derive.moneySaved(state);
        const { current } = Derive.streaks(state);
        const text = I18N.t('share_progress_text', { money, n: avoided, units: unitVars().units, streak: current });
        const shareData = { title: 'Quitly', text, url: location.href };
        if (navigator.share) {
          navigator.share(shareData).catch(() => {});
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(text).then(() => showToast(I18N.t('toast_link_copied')));
        } else {
          showToast(text);
        }
        break;
      }
      case 'export-data':
        Modal.exportCsv(state);
        showToast(I18N.t('toast_file_downloaded'));
        break;
      case 'start-exercise': {
        const exercises = Tabs.wellness.getExercises();
        const ex = exercises.find(e => e.id === el.dataset.id);
        if (ex) Modal.openGeneric(Tabs.wellness.exerciseDetailHtml(ex));
        break;
      }
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
        Modal.openGeneric(Modal.rewardFormHtml(state, null));
        break;
      case 'open-reward-detail': {
        const r = (state.rewards || []).find(x => x.id === el.dataset.id);
        if (r) Modal.openGeneric(Tabs.rewards.rewardDetailHtml(r, Derive.rewardsBalance(state)));
        break;
      }
      case 'edit-reward': {
        const r = (state.rewards || []).find(x => x.id === el.dataset.id);
        if (r) Modal.openGeneric(Modal.rewardFormHtml(state, r));
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
        if (entry) { Modal.closeGeneric(); Modal.openAddModal(state, entry); updateCostEstimate(); }
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
      case 'close-premium':
        Premium.close();
        break;
      case 'premium-coupon':
        showToast(I18N.t('toast_coupon_soon'));
        break;
      case 'upgrade-premium':
      case 'upgrade-premium-plus': {
        // Continue from today's actual daily limit rather than resetting —
        // logged history, streaks, and rewards are untouched. The plan just
        // extends into the new program length, tapering from here down to zero.
        const durationMonths = action === 'upgrade-premium-plus' ? 12 : 6;
        document.getElementById('premiumPanel').innerHTML = Premium.loadingHtml();
        Premium.runLoadingAnimation(() => {
          const continuingLimit = Derive.currentDailyLimit(state);
          state.profile.premium = true;
          state.program.startDate = Store.todayKey();
          state.program.durationMonths = durationMonths;
          state.program.startCount = continuingLimit;
          state.program.endCount = 0;
          state.program.method = 'gradual';
          Store.save(state);
          Premium.close();
          renderHeader();
          refreshDataDependentUI();
          Modal.openGeneric(Modal.premiumThanksHtml());
        });
        break;
      }
      case 'cancel-premium':
        state.profile.premium = false;
        Store.save(state);
        renderHeader();
        refreshDataDependentUI();
        showToast(I18N.t('toast_premium_cancelled'));
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
