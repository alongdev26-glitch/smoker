/* Derived stats computed from state.log + state.program. Nothing here is persisted. */
(function (global) {
  const { dateKey, parseDateKey, todayKey, daysBetween, weekdayLabel, NICOTINE_MG, PRICE_PER_CIG } = Store;

  const TRIAL_DAYS = 30;

  function daysSinceStart(state, refDate = new Date()) {
    return daysBetween(parseDateKey(state.program.startDate), refDate);
  }

  function trialDaysLeft(state) {
    return Math.max(0, TRIAL_DAYS - daysSinceStart(state));
  }

  function isLocked(state) {
    return daysSinceStart(state) >= TRIAL_DAYS && !(state.profile && state.profile.premium);
  }

  function totalProgramDays(state) {
    return state.program.durationMonths * 30;
  }

  function dailyLimitForDayIndex(state, dayIdx) {
    const { startCount, endCount } = state.program;
    const total = totalProgramDays(state);
    const clamped = Math.max(0, Math.min(dayIdx, total));
    const val = startCount - (startCount - endCount) * (clamped / total);
    return Math.max(endCount, Math.round(val));
  }

  function currentDailyLimit(state) {
    return dailyLimitForDayIndex(state, daysSinceStart(state));
  }

  function entriesForDayKey(state, key) {
    return state.log.filter(e => dateKey(new Date(e.ts)) === key);
  }

  function countForDayKey(state, key) {
    return entriesForDayKey(state, key).reduce((s, e) => s + e.quantity, 0);
  }

  function todayCount(state) {
    return countForDayKey(state, todayKey());
  }

  function dayStatus(state) {
    // list of {key, dayIdx, actual, limit, success} from program start through today
    const start = parseDateKey(state.program.startDate);
    const today = new Date();
    const span = daysBetween(start, today);
    const out = [];
    for (let i = 0; i <= span; i++) {
      const d = Store.addDays(start, i);
      const key = dateKey(d);
      const actual = countForDayKey(state, key);
      const limit = dailyLimitForDayIndex(state, i);
      out.push({ key, dayIdx: i, actual, limit, success: actual <= limit });
    }
    return out;
  }

  function streaks(state) {
    const days = dayStatus(state);
    let longest = 0, run = 0;
    for (const d of days) {
      if (d.success) { run++; longest = Math.max(longest, run); }
      else run = 0;
    }
    let current = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].success) current++;
      else break;
    }
    return { current, longest };
  }

  function lastCigaretteDate(state) {
    if (!state.log.length) return null;
    return new Date(state.log[state.log.length - 1].ts);
  }

  function msSinceLastCigarette(state) {
    const last = lastCigaretteDate(state);
    const base = last || parseDateKey(state.program.startDate);
    return Date.now() - base.getTime();
  }

  function lastEntryDefaults(state) {
    const last = state.log[state.log.length - 1];
    return {
      type: last ? last.type : Store.CIG_TYPES[0],
      trigger: last ? last.trigger : Store.TRIGGERS[0]
    };
  }

  function nicotineTodayMg(state) {
    return entriesForDayKey(state, todayKey())
      .reduce((s, e) => s + (NICOTINE_MG[e.type] || 1) * e.quantity, 0);
  }

  function nicotineTotalMg(state, sinceDays = null) {
    let entries = state.log;
    if (sinceDays != null) {
      const cutoff = Store.addDays(new Date(), -sinceDays);
      entries = entries.filter(e => new Date(e.ts) >= cutoff);
    }
    return entries.reduce((s, e) => s + (NICOTINE_MG[e.type] || 1) * e.quantity, 0);
  }

  const MINUTES_PER_CIG = 11; // widely cited estimate of life lost per cigarette

  function cigarettesAvoided(state) {
    const baseline = state.program.startCount;
    let total = 0;
    for (const d of dayStatus(state)) total += Math.max(0, baseline - d.actual);
    return total;
  }

  function moneySaved(state) {
    return Math.round(cigarettesAvoided(state) * PRICE_PER_CIG);
  }

  function totalSmoked(state) {
    return state.log.reduce((s, e) => s + e.quantity, 0);
  }

  function moneyWasted(state) {
    return Math.round(totalSmoked(state) * PRICE_PER_CIG);
  }

  function lifeMinutesSaved(state) { return cigarettesAvoided(state) * MINUTES_PER_CIG; }
  function lifeMinutesLost(state) { return totalSmoked(state) * MINUTES_PER_CIG; }

  function successfulDaysCount(state) {
    return dayStatus(state).filter(d => d.success).length;
  }

  // A 30-slot trophy grid for the current program month: one trophy per day
  // if you stayed within your goal that day. Today (and any later slot in the
  // bucket) is 'future' — a day only resolves once it's actually over, same
  // rule the goal-met notification uses.
  function monthlyTrophyGrid(state) {
    const start = parseDateKey(state.program.startDate);
    const dayIdx = Math.max(0, daysSinceStart(state));
    const monthIndex = Math.floor(dayIdx / 30);
    const monthStart = monthIndex * 30;
    const today = todayKey();
    const successByKey = {};
    dayStatus(state).forEach(d => { successByKey[d.key] = d.success; });
    const cells = [];
    for (let i = 0; i < 30; i++) {
      const key = dateKey(Store.addDays(start, monthStart + i));
      const status = key >= today ? 'future' : (successByKey[key] ? 'earned' : 'missed');
      cells.push({ key, status });
    }
    return { monthIndex, cells };
  }

  // Every unbroken run of 7 successful days (anywhere in the history, even if
  // the streak later breaks) earns one permanent blue trophy. Today is excluded
  // — a day only counts once it's actually over, same as the trophy grid above.
  function blueTrophyCount(state) {
    const today = todayKey();
    let run = 0, blues = 0;
    for (const d of dayStatus(state)) {
      if (d.key >= today) break;
      if (d.success) { run++; if (run % 7 === 0) blues++; }
      else run = 0;
    }
    return blues;
  }

  // Amount saved that hasn't been spent on redeemed rewards yet.
  function rewardsBalance(state) {
    const spent = (state.rewards || []).filter(r => r.purchased).reduce((s, r) => s + (r.cost || 0), 0);
    return Math.max(0, moneySaved(state) - spent);
  }

  // Forward-looking savings + life regained, assuming you keep avoiding the full
  // baseline you used to smoke each day.
  function projection(state) {
    const perDayCigs = state.program.startCount;
    const spans = [
      { key: 'week', days: 7 }, { key: 'month', days: 30 }, { key: 'year', days: 365 },
      { key: '5y', days: 365 * 5 }, { key: '10y', days: 365 * 10 }, { key: '20y', days: 365 * 20 }
    ];
    return spans.map(s => ({
      key: s.key,
      money: Math.round(perDayCigs * PRICE_PER_CIG * s.days),
      lifeMin: perDayCigs * MINUTES_PER_CIG * s.days
    }));
  }

  function weeklyTrend(state, n = 7) {
    const days = dayStatus(state).slice(-n);
    return days.map(d => ({
      label: weekdayLabel(parseDateKey(d.key)),
      actual: d.actual,
      planned: d.limit
    }));
  }

  function topTriggers(state, sinceDays = 30, limit = 3) {
    const cutoff = Store.addDays(new Date(), -sinceDays);
    const tally = {};
    for (const e of state.log) {
      if (new Date(e.ts) < cutoff) continue;
      tally[e.trigger] = (tally[e.trigger] || 0) + e.quantity;
    }
    return Object.entries(tally)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, count]) => ({ name, count }));
  }

  function typeBreakdown(state, sinceDays = 30) {
    const cutoff = Store.addDays(new Date(), -sinceDays);
    const tally = {};
    for (const e of state.log) {
      if (new Date(e.ts) < cutoff) continue;
      tally[e.type] = (tally[e.type] || 0) + e.quantity;
    }
    return Object.entries(tally)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }

  function dailySeries(state, days) {
    const status = dayStatus(state).slice(-days);
    return {
      labels: status.map(d => {
        const d2 = parseDateKey(d.key);
        return `${d2.getDate()}/${d2.getMonth() + 1}`;
      }),
      actual: status.map(d => d.actual),
      planned: status.map(d => d.limit)
    };
  }

  function statsForPeriod(state, period) {
    // period: 'day' | 'week' | 'month' | 'year'
    const now = new Date();
    let days;
    if (period === 'day') days = 1;
    else if (period === 'week') days = 7;
    else if (period === 'month') days = 30;
    else days = 365;

    const status = dayStatus(state).slice(-days);
    const counts = status.map(d => d.actual);
    const total = counts.reduce((a, b) => a + b, 0);
    const peak = counts.length ? Math.max(...counts) : 0;
    const avg = counts.length ? +(total / counts.length).toFixed(1) : 0;
    return {
      labels: status.map(d => parseDateKey(d.key)),
      counts,
      total,
      peak,
      avg,
      moneySaved: Math.round(status.reduce((s, d) => s + Math.max(0, state.program.startCount - d.actual), 0) * PRICE_PER_CIG),
      nicotineMg: +status.reduce((s, d) => {
        const entries = entriesForDayKey(state, d.key);
        return s + entries.reduce((s2, e) => s2 + (NICOTINE_MG[e.type] || 1) * e.quantity, 0);
      }, 0).toFixed(1)
    };
  }

  const HEALTH_MILESTONES = [
    { hours: 0.33, stage: 0, key: 'hm_1' },
    { hours: 8, stage: 0, key: 'hm_2' },
    { hours: 12, stage: 0, key: 'hm_3' },
    { hours: 24, stage: 0, key: 'hm_4' },
    { hours: 48, stage: 1, key: 'hm_5' },
    { hours: 72, stage: 1, key: 'hm_6' },
    { hours: 168, stage: 1, key: 'hm_7' },
    { hours: 336, stage: 2, key: 'hm_8' },
    { hours: 720, stage: 2, key: 'hm_9' },
    { hours: 2160, stage: 2, key: 'hm_10' },
    { hours: 4320, stage: 2, key: 'hm_11' },
    { hours: 6552, stage: 3, key: 'hm_12' },
    { hours: 8760, stage: 3, key: 'hm_13' },
    { hours: 17520, stage: 3, key: 'hm_14' },
    { hours: 26280, stage: 3, key: 'hm_15' }
  ];

  const STAGE_DEFS = [
    { key: 'stage_0_24h' },
    { key: 'stage_1_7d' },
    { key: 'stage_1_6m' },
    { key: 'stage_1y' }
  ];

  function healthStatus(state) {
    const hoursElapsed = msSinceLastCigarette(state) / 3600000;
    const items = HEALTH_MILESTONES.map(m => ({ ...m, done: hoursElapsed >= m.hours }));
    const doneCount = items.filter(i => i.done).length;
    let currentStage = 0;
    for (const item of items) if (item.done) currentStage = Math.max(currentStage, item.stage);
    return {
      hoursElapsed,
      items,
      doneCount,
      total: items.length,
      pct: Math.round((doneCount / items.length) * 100),
      currentStage
    };
  }

  function programMilestones(state) {
    const dayIdx = daysSinceStart(state);
    const total = totalProgramDays(state);
    return [
      { key: 'pm_day_one', descKey: 'pm_day_one_desc', done: dayIdx >= 0 },
      { key: 'pm_first_week', descKey: 'pm_first_week_desc', done: dayIdx >= 7 },
      { key: 'pm_30_days', descKey: 'pm_30_days_desc', done: dayIdx >= 30 },
      { key: 'pm_halfway', descKey: 'pm_halfway_desc', descVars: { day: Math.round(total / 2), total }, done: dayIdx >= total / 2 },
      { key: 'pm_complete', descKey: 'pm_complete_desc', done: dayIdx >= total }
    ];
  }

  global.Derive = {
    TRIAL_DAYS, trialDaysLeft, isLocked,
    daysSinceStart, totalProgramDays, dailyLimitForDayIndex, currentDailyLimit,
    todayCount, countForDayKey, entriesForDayKey, dayStatus, streaks,
    lastCigaretteDate, msSinceLastCigarette, lastEntryDefaults, nicotineTodayMg, nicotineTotalMg,
    moneySaved, weeklyTrend, topTriggers, typeBreakdown, dailySeries, statsForPeriod, healthStatus,
    HEALTH_MILESTONES, STAGE_DEFS, programMilestones,
    MINUTES_PER_CIG, cigarettesAvoided, totalSmoked, moneyWasted, lifeMinutesSaved, lifeMinutesLost,
    successfulDaysCount, rewardsBalance, projection, monthlyTrophyGrid, blueTrophyCount
  };
})(window);
