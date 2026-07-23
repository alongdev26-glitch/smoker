/* Derived stats computed from state.log + state.program. Nothing here is persisted. */
(function (global) {
  const { dateKey, parseDateKey, todayKey, daysBetween, weekdayLabel, NICOTINE_MG, PRICE_PER_CIG } = Store;

  function daysSinceStart(state, refDate = new Date()) {
    return daysBetween(parseDateKey(state.program.startDate), refDate);
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

  function moneySaved(state) {
    const days = dayStatus(state);
    const baseline = state.program.startCount;
    let total = 0;
    for (const d of days) total += Math.max(0, baseline - d.actual);
    return Math.round(total * PRICE_PER_CIG);
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
    { hours: 0.33, stage: 0, label: 'Heart rate starts dropping to a normal level' },
    { hours: 8, stage: 0, label: 'Blood oxygen level rises' },
    { hours: 12, stage: 0, label: 'Carbon monoxide level in blood returns to normal' },
    { hours: 24, stage: 0, label: 'Heart attack risk begins to decrease' },
    { hours: 48, stage: 1, label: 'Sense of taste and smell start improving' },
    { hours: 72, stage: 1, label: 'Breathing gets easier, nicotine is fully out of your system' },
    { hours: 168, stage: 1, label: 'Energy levels increase' },
    { hours: 336, stage: 2, label: 'Lung function starts improving' },
    { hours: 720, stage: 2, label: 'Coughing and shortness of breath decrease' },
    { hours: 2160, stage: 2, label: 'Circulation and fitness improve' },
    { hours: 4320, stage: 2, label: 'Lung function improves by up to 30%' },
    { hours: 6552, stage: 3, label: 'Coronary heart disease risk drops by half' },
    { hours: 8760, stage: 3, label: 'Stroke risk returns to that of a non-smoker' },
    { hours: 17520, stage: 3, label: 'Lung cancer risk drops significantly' },
    { hours: 26280, stage: 3, label: 'Heart disease risk equals that of a non-smoker' }
  ];

  const STAGE_DEFS = [
    { key: '0-24 hours' },
    { key: '1-7 days' },
    { key: '1-6 months' },
    { key: '1+ years' }
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
      { label: 'Day one', desc: 'Started tracking and identifying key triggers.', done: dayIdx >= 0 },
      { label: 'End of first week', desc: 'Hit your reduction targets through the end of the week.', done: dayIdx >= 7 },
      { label: 'Milestone: 30 days', desc: 'Significant improvement in lung function and fitness.', done: dayIdx >= 30 },
      { label: 'Halfway there', desc: `Reaching day ${Math.round(total / 2)} of ${total}.`, done: dayIdx >= total / 2 },
      { label: 'Program complete', desc: 'Reaching your full quit goal.', done: dayIdx >= total }
    ];
  }

  global.Derive = {
    daysSinceStart, totalProgramDays, dailyLimitForDayIndex, currentDailyLimit,
    todayCount, countForDayKey, entriesForDayKey, dayStatus, streaks,
    lastCigaretteDate, msSinceLastCigarette, lastEntryDefaults, nicotineTodayMg, nicotineTotalMg,
    moneySaved, weeklyTrend, topTriggers, typeBreakdown, dailySeries, statsForPeriod, healthStatus,
    HEALTH_MILESTONES, STAGE_DEFS, programMilestones
  };
})(window);
