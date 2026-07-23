/* Pre-app onboarding gate: local-only sign-in/sign-up screen (Stopper-style)
   followed by a short quiz, a fake loading screen, and a generated quit plan.
   No backend — credentials and answers are only ever stored in localStorage
   via Store.save(). Runs once; state.onboarding.completed gates it after that. */
(function (global) {
  const QUIZ_ORDER = ['birthdate', 'gender', 'brand', 'cigsPerDay', 'struggles', 'referral', 'rating'];

  const GENDERS = ['זכר', 'נקבה'];
  const BRANDS = ['מלבורו', 'וינסטון', 'פרלמנט', 'קמל', 'טיים', 'נובלס'];
  const CIGS_PER_DAY = [
    { key: '1-5', label: '1-5 סיגריות', mid: 3 },
    { key: '6-10', label: '6-10 סיגריות', mid: 8 },
    { key: '10-20', label: '10-20 סיגריות', mid: 15 },
    { key: '20+', label: '20+ סיגריות', mid: 25 }
  ];
  const REFERRALS = [
    { key: 'facebook', label: 'פייסבוק', emoji: '📘' },
    { key: 'tiktok', label: 'טיקטוק', emoji: '🎵' },
    { key: 'youtube', label: 'יוטיוב', emoji: '▶️' },
    { key: 'friends', label: 'חברים או משפחה', emoji: '👥' },
    { key: 'x', label: 'X (טוויטר)', emoji: '🐦' },
    { key: 'instagram', label: 'אינסטגרם', emoji: '📷' }
  ];
  const STRUGGLES = [
    { key: 'thoughts', label: 'להפסיק לחשוב על סיגריה כל הזמן' },
    { key: 'craving', label: 'פחות התקפי קריאייבינג יומיים' },
    { key: 'social', label: 'לצאת בלי לחץ' },
    { key: 'freedom', label: 'להיות חופשי/ה מהתמכרות' },
    { key: 'hiding', label: 'להפסיק להסתיר מאנשים' },
    { key: 'discipline', label: 'לבנות משמעת עצמית' }
  ];
  const STRUGGLE_TIPS = {
    thoughts: 'תרגלו נשימה של 60 שניות בכל פעם שעולה מחשבה על סיגריה - זה מקהה את הדחף במהירות',
    craving: 'שתו כוס מים ותנו לגל הקריאייבינג לעבור - הוא נחלש משמעותית אחרי 3-5 דקות',
    social: 'הכינו מראש משפט קצר כמו "אני בתהליך גמילה" כדי לא להתפתות מנימוס',
    freedom: 'סמנו כל יום ללא סיגריה בלוח - רצף ויזואלי מחזק מאוד את המוטיבציה',
    hiding: 'שיתוף עם אדם קרוב אחד על התהליך מוריד לחץ ומגביר מחויבות',
    discipline: 'קבעו טקס חלופי קצר (מתיחה, הליכה) לרגעים שבהם הייתם מדליקים סיגריה'
  };
  const DEFAULT_TIPS = [
    'המעקב היומי באפליקציה הוא הכלי הכי חזק שלכם - כל תיעוד בונה מודעות',
    'ירידה הדרגתית לאורך 30 יום מצליחה הרבה יותר מהפסקה חדה ומיידית'
  ];

  const PERSON_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" stroke-width="2"/></svg>';
  const LOCK_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" stroke-width="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4" stroke="currentColor" stroke-width="2"/></svg>';
  const EYE_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/></svg>';
  const EYE_OFF_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 3l18 18" stroke="currentColor" stroke-width="2"/><path d="M10.6 5.1A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a15.5 15.5 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7c1.4 0 2.7-.3 3.8-.8" stroke="currentColor" stroke-width="2"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" stroke="currentColor" stroke-width="2"/></svg>';
  const LOGO_ICON = '<svg width="44" height="44" viewBox="0 0 24 24" fill="none"><path d="M3 21l6-6M14 3l7 7M9 9l6 6M3 3l18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  function start(state, onComplete) {
    if (!state.auth) state.auth = { username: null, password: null };
    if (!state.onboarding) {
      state.onboarding = {
        completed: false, birthDay: null, birthMonth: null, birthYear: null,
        gender: null, brand: null, cigsPerDay: null, referral: null, struggles: [], rated: false
      };
    }

    const panel = document.getElementById('onbPanel');
    const overlay = document.getElementById('onboardingOverlay');
    let authMode = 'signin';
    let showPassword = false;
    let step = 'auth';
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

    function renderAuth() {
      overlay.setAttribute('dir', 'ltr');
      const isSignup = authMode === 'signup';
      panel.innerHTML = `
        <div class="auth-screen">
          <div class="auth-logo-wrap"><div class="auth-logo">${LOGO_ICON}</div></div>
          <h1 class="auth-title">Welcome to<br>Stopper</h1>
          <p class="auth-subtitle">${isSignup ? 'Create an account to get started' : 'Sign in to your channel'}</p>
          <form id="authForm">
            <div class="auth-field-label"><span>Username</span></div>
            <div class="auth-input-wrap">
              <span class="auth-icon">${PERSON_ICON}</span>
              <input class="auth-input" id="authUsername" type="text" placeholder="Enter your username" autocomplete="username" required>
            </div>
            <div class="auth-field-label">
              <span>Password</span>
              <button type="button" class="auth-forgot" data-action="forgot-password">Forgot password?</button>
            </div>
            <div class="auth-input-wrap">
              <span class="auth-icon">${LOCK_ICON}</span>
              <input class="auth-input" id="authPassword" type="${showPassword ? 'text' : 'password'}" placeholder="Enter your password" autocomplete="current-password" required>
              <button type="button" class="auth-eye" data-action="toggle-eye">${showPassword ? EYE_OFF_ICON : EYE_ICON}</button>
            </div>
            <p class="auth-error" id="authError"></p>
            <button type="submit" class="auth-submit-btn">${isSignup ? 'Sign Up' : 'Sign In'} <span>→</span></button>
          </form>
          <div class="auth-divider">or</div>
          <p class="auth-switch">${isSignup ? 'Already have an account? ' : "Don't have an account yet? "}<button type="button" data-action="toggle-auth-mode">${isSignup ? 'Sign in' : 'Sign up'}</button></p>
          <p class="auth-footer">Terms · Support · Stopper © 2024</p>
        </div>
      `;
    }

    function renderOptionsStep(cfg) {
      overlay.setAttribute('dir', 'rtl');
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
          <button type="button" class="quiz-cta" data-action="continue" ${valid ? '' : 'disabled'}>המשך</button>
        </div>
      `;
    }

    function renderBirthdate() {
      overlay.setAttribute('dir', 'rtl');
      const o = state.onboarding;
      const valid = o.birthDay >= 1 && o.birthDay <= 31 && o.birthMonth >= 1 && o.birthMonth <= 12 &&
        o.birthYear >= 1930 && o.birthYear <= new Date().getFullYear();
      panel.innerHTML = `
        <div class="quiz-screen">
          ${quizTopbar(true)}
          <div class="quiz-body">
            <h1 class="quiz-title">מתי נולדת?</h1>
            <p class="quiz-subtitle">התאריך עוזר לנו להתאים לך את התוכנית שלך</p>
            <div class="quiz-dob-row">
              <div class="quiz-dob-field"><label for="dobDay">יום</label><input type="number" min="1" max="31" id="dobDay" value="${o.birthDay || ''}" placeholder="DD"></div>
              <div class="quiz-dob-field"><label for="dobMonth">חודש</label><input type="number" min="1" max="12" id="dobMonth" value="${o.birthMonth || ''}" placeholder="MM"></div>
              <div class="quiz-dob-field"><label for="dobYear">שנה</label><input type="number" min="1930" max="${new Date().getFullYear()}" id="dobYear" value="${o.birthYear || ''}" placeholder="YYYY"></div>
            </div>
          </div>
          <button type="button" class="quiz-cta" data-action="continue" ${valid ? '' : 'disabled'}>המשך</button>
        </div>
      `;
    }

    function renderRating() {
      overlay.setAttribute('dir', 'rtl');
      panel.innerHTML = `
        <div class="quiz-screen">
          ${quizTopbar(false)}
          <div class="quiz-body">
            <div class="rate-hero">
              <div class="rate-heart">❤️</div>
              <div class="rate-stars">★★★★★</div>
              <p class="rate-text">אלפי אנשים כבר הצליחו להפחית ולהפסיק לעשן בעזרת התוכנית שלנו. הדירוג שלכם עוזר לעוד אנשים למצוא אותנו.</p>
            </div>
          </div>
          <button type="button" class="quiz-cta" data-action="rate-continue">המשך</button>
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
      overlay.setAttribute('dir', 'rtl');
      panel.innerHTML = `
        <div class="loading-screen">
          <div class="loading-percent" id="loadingPercent">0%</div>
          <p class="loading-title">אנחנו מכינים הכל בשבילך</p>
          <p class="loading-subtitle">רק עוד רגע והתוכנית האישית שלך תהיה מוכנה</p>
          <div class="loading-checklist">
            <div class="loading-check-row" id="loadingCheck0"><span>מנתחים את התשובות שלך</span><span class="loading-check-dot">✓</span></div>
            <div class="loading-check-row" id="loadingCheck1"><span>בונים תוכנית גמילה מותאמת אישית</span><span class="loading-check-dot">✓</span></div>
            <div class="loading-check-row" id="loadingCheck2"><span>מחשבים את לוח הזמנים שלך</span><span class="loading-check-dot">✓</span></div>
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
      overlay.setAttribute('dir', 'rtl');
      const p = computePlan();
      panel._computedPlan = p;
      panel.innerHTML = `
        <div class="plan-screen">
          <h1 class="plan-title">🎉 ברכות! התוכנית הבלעדית שלך מוכנה</h1>
          <div class="plan-days"><div class="plan-days-num">30</div><div class="plan-days-label">ימים</div></div>
          <div class="plan-stat-grid">
            <div class="plan-stat-tile"><p class="plan-stat-label">משך התוכנית</p><div class="plan-stat-value">30 ימים</div></div>
            <div class="plan-stat-tile"><p class="plan-stat-label">כמות יומית</p><div class="plan-stat-value">${p.startMid} ← ${p.endCount} סיגריות</div></div>
            <div class="plan-stat-tile"><p class="plan-stat-label">חיסכון משוער</p><div class="plan-stat-value">$${p.savings}</div></div>
            <div class="plan-stat-tile"><p class="plan-stat-label">זמן שתחזירו לעצמכם</p><div class="plan-stat-value">${p.hours} שעות</div></div>
          </div>
          <p class="plan-tips-title">איך להגיע לזה שלך:</p>
          <div class="plan-tips">${p.tips.map(t => `<div class="plan-tip"><span class="plan-tip-dot">✓</span><span>${esc(t)}</span></div>`).join('')}</div>
          <button type="button" class="plan-cta" data-action="plan-start">בואו נתחיל</button>
        </div>
      `;
    }

    function render() {
      switch (step) {
        case 'auth': renderAuth(); break;
        case 'birthdate': renderBirthdate(); break;
        case 'gender': renderOptionsStep({ title: 'בחר את המין שלך', options: GENDERS.map(g => ({ key: g, label: g })), selected: state.onboarding.gender }); break;
        case 'brand': renderOptionsStep({ title: 'איזה מותג סיגריות אתה מעשן?', options: BRANDS.map(b => ({ key: b, label: b })), selected: state.onboarding.brand }); break;
        case 'cigsPerDay': renderOptionsStep({ title: 'כמה סיגריות אתה מעשן ביום?', subtitle: 'בחר את הטווח הכי קרוב לצריכה היומית שלך', options: CIGS_PER_DAY, selected: state.onboarding.cigsPerDay }); break;
        case 'referral': renderOptionsStep({ title: 'מאיפה שמעת עלינו?', options: REFERRALS, selected: state.onboarding.referral }); break;
        case 'struggles': renderOptionsStep({ title: 'מה הכי מפריע לך בזה?', subtitle: 'בחר עד 2 אפשרויות', options: STRUGGLES, multi: true, max: 2, selected: state.onboarding.struggles }); break;
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

    function setError(msg) {
      const el = document.getElementById('authError');
      if (el) el.textContent = msg;
    }

    function handleAuthSubmit() {
      const username = document.getElementById('authUsername').value.trim();
      const password = document.getElementById('authPassword').value;
      if (!username || !password) { setError('Please fill in both fields'); return; }
      const hasAccount = !!(state.auth && state.auth.username);
      if (hasAccount && authMode === 'signin') {
        if (state.auth.username !== username || state.auth.password !== password) {
          setError('Wrong username or password');
          return;
        }
      } else {
        state.auth = { username, password };
      }
      Store.save(state);
      goToStep('birthdate');
    }

    function handleSelectOption(currentStep, value) {
      const o = state.onboarding;
      switch (currentStep) {
        case 'gender': o.gender = value; break;
        case 'brand': o.brand = value; break;
        case 'cigsPerDay': o.cigsPerDay = value; break;
        case 'referral': o.referral = value; break;
        case 'struggles': {
          const i = o.struggles.indexOf(value);
          if (i >= 0) o.struggles.splice(i, 1);
          else if (o.struggles.length < 2) o.struggles.push(value);
          break;
        }
      }
      render();
    }

    panel.addEventListener('submit', e => {
      if (e.target.id === 'authForm') {
        e.preventDefault();
        handleAuthSubmit();
      }
    });

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
        case 'toggle-eye':
          showPassword = !showPassword;
          renderAuth();
          break;
        case 'toggle-auth-mode':
          authMode = authMode === 'signup' ? 'signin' : 'signup';
          renderAuth();
          break;
        case 'forgot-password':
          setError('No account recovery in offline mode — just sign up again with a new password.');
          break;
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
