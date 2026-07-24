(function (global) {
  const addOverlay = () => document.getElementById('modalOverlay');
  const genOverlay = () => document.getElementById('genericOverlay');
  const genBody = () => document.getElementById('genericModalBody');

  function openAddModal() {
    const now = new Date();
    document.getElementById('fldDatetime').value = Store.toDatetimeLocalValue(now);
    document.getElementById('fldQty').value = 1;
    document.getElementById('fldType').selectedIndex = 0;
    document.getElementById('fldTrigger').selectedIndex = 0;
    document.querySelectorAll('.quick-btn').forEach(b => b.classList.remove('selected'));
    addOverlay().hidden = false;
  }

  function closeAddModal() {
    addOverlay().hidden = true;
  }

  function submitAddForm(state, onSaved) {
    const ts = document.getElementById('fldDatetime').value;
    const type = document.getElementById('fldType').value;
    const trigger = document.getElementById('fldTrigger').value;
    const qty = Math.max(1, parseInt(document.getElementById('fldQty').value, 10) || 1);
    const isoTs = ts ? new Date(ts).toISOString() : new Date().toISOString();
    state.log.push({ id: Store.uid(), ts: isoTs, type, trigger, quantity: qty });
    state.log.sort((a, b) => new Date(a.ts) - new Date(b.ts));
    Store.save(state);
    closeAddModal();
    onSaved && onSaved();
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
    openGeneric, closeGeneric, editProfileHtml, saveProfileForm, typePickerHtml, helpCenterHtml, exportCsv
  };
})(window);
