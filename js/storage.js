/* Storage layer: localStorage-backed app state. Starts empty — the user's own
   entries build up the history from day one. */
(function (global) {
  const STORAGE_KEY = 'quit-smoking.state.v1';

  const CIG_TYPES = ['Regular cigarettes', 'Light cigarettes', 'Roll-your-own', 'Cigar', 'Other'];
  const TRIGGERS = ['Nicotine craving', 'After waking up', 'Stress', 'Anxiety', 'Morning coffee', 'After a meal', 'Work break', 'While driving', 'Social gathering', 'Boredom', 'Watching TV', 'Alcohol', 'Other'];

  // Canonical English values stay in storage/CSV; only the display label is localized.
  const CIG_TYPE_KEYS = {
    'Regular cigarettes': 'cig_regular', 'Light cigarettes': 'cig_light',
    'Roll-your-own': 'cig_roll', 'Cigar': 'cig_cigar', 'Other': 'cig_other'
  };
  const TRIGGER_KEYS = {
    'Nicotine craving': 'trig_craving', 'After waking up': 'trig_waking', 'Stress': 'trig_stress',
    'Anxiety': 'trig_anxiety', 'Morning coffee': 'trig_coffee', 'After a meal': 'trig_meal',
    'Work break': 'trig_break', 'While driving': 'trig_driving', 'Social gathering': 'trig_social',
    'Boredom': 'trig_boredom', 'Watching TV': 'trig_tv', 'Alcohol': 'trig_alcohol', 'Other': 'trig_other'
  };
  function cigTypeLabel(v) { return (global.I18N && CIG_TYPE_KEYS[v]) ? global.I18N.t(CIG_TYPE_KEYS[v]) : v; }
  function triggerLabel(v) { return (global.I18N && TRIGGER_KEYS[v]) ? global.I18N.t(TRIGGER_KEYS[v]) : v; }
  const NICOTINE_MG = {
    'Regular cigarettes': 1.1,
    'Light cigarettes': 0.6,
    'Roll-your-own': 0.8,
    'Cigar': 3.0,
    'Other': 1.0
  };
  const PRICE_PER_CIG = 1.9; // adjust to your local currency/price per cigarette

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function pad2(n) { return String(n).padStart(2, '0'); }

  function dateKey(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }

  function parseDateKey(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function todayKey() { return dateKey(new Date()); }

  function toDatetimeLocalValue(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }

  function addDays(d, n) {
    const copy = new Date(d);
    copy.setDate(copy.getDate() + n);
    return copy;
  }

  function daysBetween(a, b) {
    const ms = new Date(dateKey(b)) - new Date(dateKey(a));
    return Math.round(ms / 86400000);
  }

  function weekdayLabel(d) {
    const fallback = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (global.I18N) return global.I18N.t('weekdays_short').split(',')[d.getDay()] || fallback[d.getDay()];
    return fallback[d.getDay()];
  }

  function freshState() {
    return {
      onboarding: {
        completed: false,
        birthDay: null,
        birthMonth: null,
        birthYear: null,
        gender: null,
        brand: null,
        cigsPerDay: null,
        yearsSmoking: null,
        referral: null,
        struggles: [],
        language: null,
        rated: false
      },
      profile: {
        name: '',
        title: '',
        avatarImage: null,
        quickAddType: null,
        quickAddTrigger: null,
        notificationsEnabled: true,
        theme: 'dark',
        language: 'en',
        premium: false
      },
      program: {
        startDate: todayKey(),
        durationMonths: 3,
        startCount: 20,
        endCount: 0,
        method: 'gradual'
      },
      log: [],
      // Goal-met celebration notifications. notifyBaseline is the first day we
      // start evaluating, so upgrading users don't get a backlog of old days.
      notifications: [],
      notifyBaseline: null,
      // Savings-goal rewards. null = never initialized (seed examples on first view).
      rewards: null
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* corrupt storage, fall through to a fresh state */ }
    const fresh = freshState();
    save(fresh);
    return fresh;
  }

  function save(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (global.Auth && global.Auth.isConfigured && global.Auth.currentUser) global.Auth.pushState(state);
  }

  function reset() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(freshState()));
    return load();
  }

  global.Store = {
    CIG_TYPES, TRIGGERS, NICOTINE_MG, PRICE_PER_CIG, cigTypeLabel, triggerLabel,
    uid, dateKey, parseDateKey, todayKey, toDatetimeLocalValue, addDays, daysBetween, weekdayLabel,
    load, save, reset
  };
})(window);
