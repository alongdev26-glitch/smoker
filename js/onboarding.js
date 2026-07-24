/* Pre-app onboarding gate: a short quiz, a loading screen, and the generated
   quit plan. No backend — answers are only ever stored in localStorage via
   Store.save(). Runs once; state.onboarding.completed gates it after that. */
(function (global) {
  const QUIZ_ORDER = ['birthdate', 'gender', 'brand', 'cigsPerDay', 'struggles', 'referral', 'language', 'rating'];

  const LANGUAGE_FLAGS = { en: '🇺🇸', ar: '🇸🇦', es: '🇪🇸', fr: '🇫🇷', ru: '🇷🇺' };

  const GENDERS = ['Male', 'Female'];
  const BRANDS = ['Marlboro', 'Winston', 'Parliament', 'Camel', 'Time', 'Noblesse'];
  const CIGS_PER_DAY = [
    { key: '1-5', label: '1-5 cigarettes', mid: 3 },
    { key: '6-10', label: '6-10 cigarettes', mid: 8 },
    { key: '10-20', label: '10-20 cigarettes', mid: 15 },
    { key: '20+', label: '20+ cigarettes', mid: 25 }
  ];
  const REFERRALS = [
    { key: 'facebook', label: 'Facebook' },
    { key: 'tiktok', label: 'TikTok' },
    { key: 'youtube', label: 'YouTube' },
    { key: 'friends', label: 'Friends or family' },
    { key: 'x', label: 'X (Twitter)' },
    { key: 'instagram', label: 'Instagram' }
  ];
  const STRUGGLES = [
    { key: 'thoughts', label: 'Stop thinking about cigarettes all the time' },
    { key: 'craving', label: 'Fewer daily cravings' },
    { key: 'social', label: 'Go out without the pressure' },
    { key: 'freedom', label: 'Be free from the addiction' },
    { key: 'hiding', label: 'Stop hiding it from people' },
    { key: 'discipline', label: 'Build self-discipline' }
  ];
  const STRUGGLE_TIPS = {
    thoughts: 'Practice 60 seconds of breathing every time a craving thought pops up - it dulls the urge quickly',
    craving: 'Drink a glass of water and let the craving wave pass - it fades significantly after 3-5 minutes',
    social: 'Prepare a short line like "I\'m quitting" in advance so you don\'t give in out of politeness',
    freedom: 'Mark every smoke-free day on a calendar - a visual streak strongly reinforces motivation',
    hiding: 'Sharing the process with one close person lowers stress and boosts commitment',
    discipline: 'Set up a short alternative ritual (stretching, walking) for the moments you\'d normally light up'
  };
  const DEFAULT_TIPS = [
    'Daily tracking in the app is your strongest tool - every log builds awareness',
    'A gradual reduction over 30 days succeeds far more often than quitting cold turkey'
  ];


  function start(state, onComplete) {
    if (!state.onboarding) {
      state.onboarding = {
        completed: false, birthDay: null, birthMonth: null, birthYear: null,
        gender: null, brand: null, cigsPerDay: null, referral: null, struggles: [], language: null, rated: false
      };
    }

    const panel = document.getElementById('onbPanel');
    const overlay = document.getElementById('onboardingOverlay');
    let step = 'birthdate';
    let loadingTimer = null;

    function esc(s) { return global.Charts ? global.Charts.esc(s) : String(s); }

    function quizTopbar(disableBack) {
      const idx = QUIZ_ORDER.indexOf(step);
      const pct = idx >= 0 ? Math.round(((idx + 1) / QUIZ_ORDER.length) * 100) : 0;
      return `
        <div class="quiz-topbar">
          <button type="button" class="quiz-back" data-action="back" ${disableBack ? 'disabled' : ''}>‹</button>
          <div class="quiz-progress-track"><div class="quiz-progress-fill" style="width:${pct}%"></div></div>
        </div>
      `;
    }

    function renderOptionsStep(cfg) {
      overlay.setAttribute('dir', 'ltr');
      const multi = !!cfg.multi;
      const selectedKeys = multi ? cfg.selected : null;
      const selectedKey = multi ? null : cfg.selected;
      const valid = multi ? selectedKeys.length > 0 : !!selectedKey;
      const optsHtml = cfg.options.map(o => {
        const isSel = multi ? selectedKeys.includes(o.key) : selectedKey === o.key;
        const isDisabled = multi && !isSel && selectedKeys.length >= (cfg.max || 1);
        return `
          <button type="button" class="quiz-option ${isSel ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}" data-action="select-option" data-value="${esc(o.key)}" ${isDisabled ? 'disabled' : ''}>
            <span>${o.emoji ? `<span class="quiz-emoji">${o.emoji}</span> ` : ''}${esc(o.label)}</span>
            <span class="quiz-check">✓</span>
          </button>
        `;
      }).join('');
      panel.innerHTML = `
        <div class="quiz-screen">
          ${quizTopbar(false)}
          <div class="quiz-body">
            <h1 class="quiz-title">${esc(cfg.title)}</h1>
            ${cfg.subtitle ? `<p class="quiz-subtitle">${esc(cfg.subtitle)}</p>` : ''}
            <div class="quiz-options">${optsHtml}</div>
          </div>
          <button type="button" class="quiz-cta" data-action="continue" ${valid ? '' : 'disabled'}>Continue</button>
        </div>
      `;
    }

    function renderBirthdate() {
      overlay.setAttribute('dir', 'ltr');
      const o = state.onboarding;
      const valid = o.birthDay >= 1 && o.birthDay <= 31 && o.birthMonth >= 1 && o.birthMonth <= 12 &&
        o.birthYear >= 1930 && o.birthYear <= new Date().getFullYear();
      panel.innerHTML = `
        <div class="quiz-screen">
          ${quizTopbar(true)}
          <div class="quiz-body">
            <h1 class="quiz-title">When were you born?</h1>
            <p class="quiz-subtitle">This helps us tailor your plan to you</p>
            <div class="quiz-dob-row">
              <div class="quiz-dob-field"><label for="dobDay">Day</label><input type="number" min="1" max="31" id="dobDay" value="${o.birthDay || ''}" placeholder="DD"></div>
              <div class="quiz-dob-field"><label for="dobMonth">Month</label><input type="number" min="1" max="12" id="dobMonth" value="${o.birthMonth || ''}" placeholder="MM"></div>
              <div class="quiz-dob-field"><label for="dobYear">Year</label><input type="number" min="1930" max="${new Date().getFullYear()}" id="dobYear" value="${o.birthYear || ''}" placeholder="YYYY"></div>
            </div>
          </div>
          <button type="button" class="quiz-cta" data-action="continue" ${valid ? '' : 'disabled'}>Continue</button>
        </div>
      `;
    }

    function renderRating() {
      overlay.setAttribute('dir', 'ltr');
      panel.innerHTML = `
        <div class="quiz-screen">
          ${quizTopbar(false)}
          <div class="quiz-body">
            <div class="rate-hero">
              <div class="rate-heart">${Icons.svg('heart', 46)}</div>
              <div class="rate-stars">★★★★★</div>
              <p class="rate-text">Thousands of people have already succeeded in cutting down and quitting smoking with our program. Your rating helps more people find us.</p>
            </div>
          </div>
          <button type="button" class="quiz-cta" data-action="rate-continue">Continue</button>
        </div>
      `;
    }

    function showRatingPopup() {
      const scrim = document.createElement('div');
      scrim.className = 'rate-popup-scrim';
      scrim.id = 'ratePopupScrim';
      scrim.innerHTML = `
        <div class="rate-popup">
          <p class="rate-popup-title">Enjoying Stopper?</p>
          <p class="rate-popup-sub">Tap a star to rate it on the App Store</p>
          <div class="rate-popup-stars" data-action="popup-star">★★★★★</div>
          <div class="rate-popup-actions">
            <button type="button" data-action="popup-not-now">Not Now</button>
            <button type="button" data-action="popup-star">Rate</button>
          </div>
        </div>
      `;
      document.body.appendChild(scrim);
    }

    function closeRatingPopup() {
      const scrim = document.getElementById('ratePopupScrim');
      if (scrim) scrim.remove();
    }

    function renderLoading() {
      overlay.setAttribute('dir', 'ltr');
      panel.innerHTML = `
        <div class="loading-screen">
          <div class="loading-percent" id="loadingPercent">0%</div>
          <p class="loading-title">We're preparing everything for you</p>
          <p class="loading-subtitle">Just a moment and your personal plan will be ready</p>
          <div class="loading-checklist">
            <div class="loading-check-row" id="loadingCheck0"><span>Analyzing your answers</span><span class="loading-check-dot">✓</span></div>
            <div class="loading-check-row" id="loadingCheck1"><span>Building your personalized quit plan</span><span class="loading-check-dot">✓</span></div>
            <div class="loading-check-row" id="loadingCheck2"><span>Calculating your timeline</span><span class="loading-check-dot">✓</span></div>
          </div>
        </div>
      `;
      runLoadingAnimation();
    }

    function runLoadingAnimation() {
      let pct = 0;
      const el = document.getElementById('loadingPercent');
      const rows = [document.getElementById('loadingCheck0'), document.getElementById('loadingCheck1'), document.getElementById('loadingCheck2')];
      loadingTimer = setInterval(() => {
        pct = Math.min(100, pct + 3 + Math.random() * 3);
        const shown = Math.floor(pct);
        if (el) el.textContent = shown + '%';
        if (shown >= 35 && rows[0]) rows[0].classList.add('done');
        if (shown >= 70 && rows[1]) rows[1].classList.add('done');
        if (shown >= 100) {
          if (rows[2]) rows[2].classList.add('done');
          clearInterval(loadingTimer);
          setTimeout(() => goToStep('plan'), 450);
        }
      }, 70);
    }

    function computePlan() {
      const o = state.onboarding;
      const bucket = CIGS_PER_DAY.find(c => c.key === o.cigsPerDay) || CIGS_PER_DAY[1];
      const startMid = bucket.mid;
      const endCount = Math.max(1, Math.round(startMid * 0.6));
      const dailyReduction = startMid - endCount;
      const savings = Math.round(dailyReduction * Store.PRICE_PER_CIG * 30);
      const hours = Math.round((dailyReduction * 5 * 30) / 60);
      const tipKeys = (o.struggles || []).slice(0, 2);
      const tips = tipKeys.map(k => STRUGGLE_TIPS[k]).filter(Boolean);
      return { startMid, endCount, savings, hours, tips: tips.length ? tips : DEFAULT_TIPS };
    }

    function renderPlan() {
      overlay.setAttribute('dir', 'ltr');
      const p = computePlan();
      panel._computedPlan = p;
      panel.innerHTML = `
        <div class="plan-screen">
          <h1 class="plan-title">Congrats! Your exclusive plan is ready</h1>
          <div class="plan-days"><div class="plan-days-num">30</div><div class="plan-days-label">days</div></div>
          <div class="plan-stat-grid">
            <div class="plan-stat-tile"><p class="plan-stat-label">Plan duration</p><div class="plan-stat-value">30 days</div></div>
            <div class="plan-stat-tile"><p class="plan-stat-label">Daily amount</p><div class="plan-stat-value">${p.startMid} → ${p.endCount} cigarettes</div></div>
            <div class="plan-stat-tile"><p class="plan-stat-label">Estimated savings</p><div class="plan-stat-value">$${p.savings}</div></div>
            <div class="plan-stat-tile"><p class="plan-stat-label">Time you'll get back</p><div class="plan-stat-value">${p.hours} hours</div></div>
          </div>
          <p class="plan-tips-title">How you'll get there:</p>
          <div class="plan-tips">${p.tips.map(t => `<div class="plan-tip"><span class="plan-tip-dot">✓</span><span>${esc(t)}</span></div>`).join('')}</div>
          <button type="button" class="plan-cta" data-action="plan-start">Let's start</button>
        </div>
      `;
    }

    function render() {
      switch (step) {
        case 'birthdate': renderBirthdate(); break;
        case 'gender': renderOptionsStep({ title: 'Select your gender', options: GENDERS.map(g => ({ key: g, label: g })), selected: state.onboarding.gender }); break;
        case 'brand': renderOptionsStep({ title: 'Which cigarette brand do you smoke?', options: BRANDS.map(b => ({ key: b, label: b })), selected: state.onboarding.brand }); break;
        case 'cigsPerDay': renderOptionsStep({ title: 'How many cigarettes do you smoke per day?', subtitle: 'Choose the range closest to your daily habit', options: CIGS_PER_DAY, selected: state.onboarding.cigsPerDay }); break;
        case 'referral': renderOptionsStep({ title: 'Where did you hear about us?', options: REFERRALS, selected: state.onboarding.referral }); break;
        case 'language': renderOptionsStep({
          title: 'Which language would you like to use in the app?',
          subtitle: 'You can change this later in settings',
          options: I18N.LANGS.map(l => ({ key: l.code, label: l.label, emoji: LANGUAGE_FLAGS[l.code] || '' })),
          selected: state.onboarding.language
        }); break;
        case 'struggles': renderOptionsStep({ title: "What's bothering you most about this?", subtitle: 'Choose up to 2 options', options: STRUGGLES, multi: true, max: 2, selected: state.onboarding.struggles }); break;
        case 'rating': renderRating(); break;
        case 'loading': renderLoading(); break;
        case 'plan': renderPlan(); break;
      }
    }

    function goToStep(name) { step = name; render(); }

    function goBack() {
      const idx = QUIZ_ORDER.indexOf(step);
      if (idx > 0) goToStep(QUIZ_ORDER[idx - 1]);
    }

    function goNextFromQuiz() {
      const idx = QUIZ_ORDER.indexOf(step);
      if (idx < QUIZ_ORDER.length - 1) goToStep(QUIZ_ORDER[idx + 1]);
      else goToStep('loading');
    }

    function handleSelectOption(currentStep, value) {
      const o = state.onboarding;
      switch (currentStep) {
        case 'gender': o.gender = value; break;
        case 'brand': o.brand = value; break;
        case 'cigsPerDay': o.cigsPerDay = value; break;
        case 'referral': o.referral = value; break;
        case 'language': o.language = value; break;
        case 'struggles': {
          const i = o.struggles.indexOf(value);
          if (i >= 0) o.struggles.splice(i, 1);
          else if (o.struggles.length < 2) o.struggles.push(value);
          break;
        }
      }
      render();
    }

    panel.addEventListener('input', e => {
      if (step === 'birthdate' && ['dobDay', 'dobMonth', 'dobYear'].includes(e.target.id)) {
        const o = state.onboarding;
        o.birthDay = parseInt(document.getElementById('dobDay').value, 10) || null;
        o.birthMonth = parseInt(document.getElementById('dobMonth').value, 10) || null;
        o.birthYear = parseInt(document.getElementById('dobYear').value, 10) || null;
        const valid = o.birthDay >= 1 && o.birthDay <= 31 && o.birthMonth >= 1 && o.birthMonth <= 12 &&
          o.birthYear >= 1930 && o.birthYear <= new Date().getFullYear();
        const cta = panel.querySelector('.quiz-cta');
        if (cta) cta.disabled = !valid;
      }
    });

    function onGlobalClick(e) {
      const el = e.target.closest('[data-action]');
      if (!el || el.disabled) return;
      const action = el.dataset.action;

      if (action === 'popup-star' || action === 'popup-not-now') {
        closeRatingPopup();
        goToStep('loading');
        return;
      }
      if (!panel.contains(e.target)) return;

      switch (action) {
        case 'back':
          goBack();
          break;
        case 'continue':
          goNextFromQuiz();
          break;
        case 'select-option':
          handleSelectOption(step, el.dataset.value);
          break;
        case 'rate-continue':
          showRatingPopup();
          break;
        case 'plan-start': {
          const p = panel._computedPlan || computePlan();
          state.onboarding.completed = true;
          state.onboarding.rated = true;
          state.profile.language = state.onboarding.language || 'en';
          state.program.startDate = Store.todayKey();
          state.program.durationMonths = 1;
          state.program.startCount = p.startMid;
          state.program.endCount = p.endCount;
          state.program.method = 'gradual';
          Store.save(state);
          document.removeEventListener('click', onGlobalClick);
          if (loadingTimer) clearInterval(loadingTimer);
          onComplete(state);
          break;
        }
      }
    }

    document.addEventListener('click', onGlobalClick);
    render();
  }

  global.Onboarding = { start };
})(window);
