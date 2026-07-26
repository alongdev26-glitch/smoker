(function (global) {
  const addOverlay = () => document.getElementById('modalOverlay');
  const genOverlay = () => document.getElementById('genericOverlay');
  const genBody = () => document.getElementById('genericModalBody');

  // When set, the add sheet is editing an existing log entry instead of adding one.
  let editingId = null;

  // Pass an entry to edit it; omit to log a new cigarette.
  function openAddModal(entry) {
    editingId = entry ? entry.id : null;
    const when = entry ? new Date(entry.ts) : new Date();
    document.getElementById('addModalTitle').textContent = I18N.t(entry ? 'edit_modal_title' : 'add_modal_title');
    document.getElementById('fldDatetime').value = Store.toDatetimeLocalValue(when);
    document.getElementById('fldQty').value = entry ? entry.quantity : 1;
    document.getElementById('fldType').value = entry ? entry.type : Store.CIG_TYPES[0];
    document.getElementById('fldTrigger').value = entry ? entry.trigger : Store.TRIGGERS[0];
    document.querySelectorAll('.quick-btn').forEach(b => b.classList.remove('selected'));
    addOverlay().hidden = false;
  }

  function closeAddModal() {
    addOverlay().hidden = true;
    editingId = null;
  }

  function submitAddForm(state, onSaved) {
    const ts = document.getElementById('fldDatetime').value;
    const type = document.getElementById('fldType').value;
    const trigger = document.getElementById('fldTrigger').value;
    const qty = Math.max(1, parseInt(document.getElementById('fldQty').value, 10) || 1);
    const isoTs = ts ? new Date(ts).toISOString() : new Date().toISOString();
    const existing = editingId && state.log.find(e => e.id === editingId);
    if (existing) {
      Object.assign(existing, { ts: isoTs, type, trigger, quantity: qty });
    } else {
      state.log.push({ id: Store.uid(), ts: isoTs, type, trigger, quantity: qty });
    }
    state.log.sort((a, b) => new Date(a.ts) - new Date(b.ts));
    Store.save(state);
    const wasEdit = !!existing;
    closeAddModal();
    onSaved && onSaved(wasEdit);
  }

  function openGeneric(html) {
    genBody().innerHTML = html;
    genOverlay().hidden = false;
  }

  function closeGeneric() {
    genOverlay().hidden = true;
  }

  function editProfileHtml(state) {
    return `
      <h2>${I18N.t('modal_profile_settings')}</h2>
      <p class="sheet-sub">${I18N.t('modal_profile_sub')}</p>
      <label class="field-label" for="epName">${I18N.t('modal_name')}</label>
      <input class="field-input" id="epName" value="${Charts.esc(state.profile.name || '')}">

      <label class="field-label" for="epStart">${I18N.t('modal_plan_start')}</label>
      <input class="field-input" type="date" id="epStart" value="${state.program.startDate}">

      <label class="field-label" for="epDuration">${I18N.t('modal_plan_duration_months')}</label>
      <input class="field-input" type="number" id="epDuration" min="1" max="24" value="${state.program.durationMonths}">

      <label class="field-label" for="epStartCount">${I18N.t('modal_starting_amount')}</label>
      <input class="field-input" type="number" id="epStartCount" min="1" value="${state.program.startCount}">

      <label class="field-label" for="epEndCount">${I18N.t('modal_final_target')}</label>
      <input class="field-input" type="number" id="epEndCount" min="0" value="${state.program.endCount}">

      <div class="sheet-actions">
        <button type="button" class="btn btn-ghost" data-action="close-generic">${I18N.t('modal_cancel')}</button>
        <button type="button" class="btn btn-primary" data-action="save-profile">${I18N.t('modal_save')}</button>
      </div>
    `;
  }

  function typePickerHtml(state) {
    const current = state.profile.quickAddType || Store.CIG_TYPES[0];
    return `
      <h2>${I18N.t('modal_type_for_quick')}</h2>
      <p class="sheet-sub">${I18N.t('modal_type_for_quick_sub')}</p>
      ${Store.CIG_TYPES.map(t => `
        <button type="button" class="type-picker-item ${t === current ? 'selected' : ''}" data-action="select-quick-type" data-type="${Charts.esc(t)}">
          <span>${Charts.esc(Store.cigTypeLabel(t))}</span>${t === current ? '<span>✓</span>' : ''}
        </button>
      `).join('')}
    `;
  }

  function rewardFormHtml(reward) {
    const r = reward || {};
    return `
      <h2>${I18N.t(reward ? 'reward_edit_title' : 'reward_add_title')}</h2>
      <p class="sheet-sub">${I18N.t('reward_form_sub')}</p>
      <label class="field-label" for="rwName">${I18N.t('reward_name')}</label>
      <input class="field-input" id="rwName" value="${Charts.esc(r.name || '')}" placeholder="${Charts.esc(I18N.t('reward_name_placeholder'))}">
      <label class="field-label" for="rwCost">${I18N.t('reward_cost')}</label>
      <input class="field-input" type="number" id="rwCost" min="1" inputmode="numeric" value="${r.cost || ''}">
      <div class="sheet-actions">
        <button type="button" class="btn btn-ghost" data-action="close-generic">${I18N.t('modal_cancel')}</button>
        <button type="button" class="btn btn-primary" data-action="save-reward" data-id="${r.id || ''}">${I18N.t('modal_save')}</button>
      </div>
    `;
  }

  function saveRewardForm(state, id, onSaved) {
    const name = document.getElementById('rwName').value.trim();
    const cost = Math.max(1, parseInt(document.getElementById('rwCost').value, 10) || 0);
    if (!name || !cost) return; // ignore empty submissions
    if (!Array.isArray(state.rewards)) state.rewards = [];
    const existing = id && state.rewards.find(r => r.id === id);
    if (existing) { existing.name = name; existing.cost = cost; }
    else state.rewards.push({ id: Store.uid(), name, cost, purchased: false });
    Store.save(state);
    closeGeneric();
    onSaved && onSaved();
  }

  function triggerPickerHtml(state) {
    const current = state.profile.quickAddTrigger || Store.TRIGGERS[0];
    return `
      <h2>${I18N.t('modal_trigger_for_quick')}</h2>
      <p class="sheet-sub">${I18N.t('modal_trigger_for_quick_sub')}</p>
      ${Store.TRIGGERS.map(t => `
        <button type="button" class="type-picker-item ${t === current ? 'selected' : ''}" data-action="select-quick-trigger" data-trigger="${Charts.esc(t)}">
          <span>${Charts.esc(Store.triggerLabel(t))}</span>${t === current ? '<span>✓</span>' : ''}
        </button>
      `).join('')}
    `;
  }

  function saveProfileForm(state, onSaved) {
    state.profile.name = document.getElementById('epName').value.trim() || state.profile.name;
    state.program.startDate = document.getElementById('epStart').value || state.program.startDate;
    state.program.durationMonths = Math.max(1, parseInt(document.getElementById('epDuration').value, 10) || state.program.durationMonths);
    state.program.startCount = Math.max(1, parseInt(document.getElementById('epStartCount').value, 10) || state.program.startCount);
    state.program.endCount = Math.max(0, parseInt(document.getElementById('epEndCount').value, 10) || 0);
    Store.save(state);
    closeGeneric();
    onSaved && onSaved();
  }

  function historyHtml(state) {
    const head = `<h2>${I18N.t('modal_history_title')}</h2><p class="sheet-sub">${I18N.t('modal_history_sub')}</p>`;
    if (!state.log.length) return head + `<div class="empty-state">${I18N.t('history_empty')}</div>`;

    const entries = state.log.slice().sort((a, b) => new Date(b.ts) - new Date(a.ts));
    const lang = I18N.getLang();
    const groups = [];
    const index = {};
    entries.forEach(e => {
      const k = Store.dateKey(new Date(e.ts));
      if (index[k] == null) { index[k] = groups.length; groups.push({ key: k, items: [] }); }
      groups[index[k]].items.push(e);
    });

    const body = groups.map(g => {
      let dayLabel;
      try { dayLabel = Store.parseDateKey(g.key).toLocaleDateString(lang, { weekday: 'short', day: 'numeric', month: 'short' }); }
      catch (e) { dayLabel = g.key; }
      const dayTotal = g.items.reduce((s, e) => s + e.quantity, 0);
      const rows = g.items.map(e => {
        const d = new Date(e.ts);
        const hh = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
        const qty = e.quantity > 1 ? ` <span class="history-qty">×${e.quantity}</span>` : '';
        return `
          <div class="history-item">
            <span class="history-time">${hh}</span>
            <div class="history-meta">
              <span class="history-type">${Charts.esc(Store.cigTypeLabel(e.type))}${qty}</span>
              <span class="history-trigger">${Charts.esc(Store.triggerLabel(e.trigger))}</span>
            </div>
            <div class="history-actions">
              <button type="button" class="history-btn" data-action="edit-log" data-id="${e.id}" aria-label="Edit">${Icons.svg('pencil', 16)}</button>
              <button type="button" class="history-btn history-btn--danger" data-action="delete-log" data-id="${e.id}" aria-label="Delete">${Icons.svg('trash', 16)}</button>
            </div>
          </div>`;
      }).join('');
      return `
        <div class="history-day">
          <div class="history-day-head"><span>${Charts.esc(dayLabel)}</span><span class="history-day-total">${dayTotal}</span></div>
          ${rows}
        </div>`;
    }).join('');

    return head + `<div class="history-list">${body}</div>`;
  }

  function helpCenterHtml() {
    const tips = [
      [I18N.t('help_1_t'), I18N.t('help_1_d')],
      [I18N.t('help_2_t'), I18N.t('help_2_d')],
      [I18N.t('help_3_t'), I18N.t('help_3_d')],
      [I18N.t('help_4_t'), I18N.t('help_4_d')]
    ];
    return `
      <h2>${I18N.t('modal_help_title')}</h2>
      <p class="sheet-sub">${I18N.t('modal_help_sub')}</p>
      ${tips.map(([t, d]) => `<p class="help-item"><b>${Charts.esc(t)}</b><br>${Charts.esc(d)}</p>`).join('')}
      <div class="sheet-actions">
        <button type="button" class="btn btn-primary btn-block" data-action="close-generic">${I18N.t('modal_got_it')}</button>
      </div>
    `;
  }

  function exportCsv(state) {
    const rows = [[I18N.t('csv_datetime'), I18N.t('csv_type'), I18N.t('csv_trigger'), I18N.t('csv_quantity')]];
    state.log.forEach(e => rows.push([new Date(e.ts).toLocaleString('en-US'), Store.cigTypeLabel(e.type), Store.triggerLabel(e.trigger), e.quantity]));
    const csv = '﻿' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smoking-log-${Store.todayKey()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  global.Modal = {
    openAddModal, closeAddModal, submitAddForm,
    openGeneric, closeGeneric, editProfileHtml, saveProfileForm, typePickerHtml, triggerPickerHtml,
    rewardFormHtml, saveRewardForm, historyHtml, helpCenterHtml, exportCsv
  };
})(window);
