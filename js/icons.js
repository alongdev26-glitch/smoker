/* Line-icon set used across the app. Every icon is drawn on a 24x24 grid with
   stroke="currentColor", so it inherits the colour of its container — the
   .icon-tile classes and .avatar-btn already set `color`, and nothing extra
   is needed per icon. */
(function (global) {
  const PATHS = {
    person: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5"/>',
    cigarette: '<rect x="2" y="13" width="14" height="5" rx="1.5"/><path d="M19 13v5M22 13v5M12 13v5M17 9.5c1.6-.6 2.4-1.6 2.4-3S18.6 4.1 17 3.5"/>',
    smoke: '<path d="M4 8h9a3 3 0 1 0-3-3M4 13h13a3 3 0 1 1-3 3M4 18h7"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5A3.5 3.5 0 0 1 16.5 11M10 20h4M12 14v6"/>',
    flame: '<path d="M12 3s5 4.2 5 8.5a5 5 0 0 1-10 0C7 9 9 7.5 9 7.5s.4 2 1.5 2.5c.8-2.6 1.5-5 1.5-7Z"/>',
    chart: '<path d="M4 20V4"/><path d="M4 20h16"/><path d="M8 17v-5M13 17V8M18 17v-7"/>',
    wallet: '<path d="M3 8.5A2.5 2.5 0 0 1 5.5 6H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5.5A2.5 2.5 0 0 1 3 16.5v-8Z"/><path d="M3 9h18M16.5 13.5h.01"/>',
    alert: '<path d="M12 4.5 21 19.5H3L12 4.5Z"/><path d="M12 10v4M12 17h.01"/>',
    heart: '<path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.6-7 9-7 9Z"/>',
    bulb: '<path d="M9.5 17h5M10 20h4"/><path d="M12 3a6 6 0 0 0-3.5 10.8V17h7v-3.2A6 6 0 0 0 12 3Z"/>',
    trash: '<path d="M4 7h16M10 4h4M9.5 7l.7 12M14.5 7l-.7 12"/><path d="M6.5 7 7.4 20h9.2L17.5 7"/>',
    camera: '<path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2.7l1.3-2h7l1.3 2h2.7A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-9Z"/><circle cx="12" cy="13" r="3.2"/>',
    bell: '<path d="M18 10a6 6 0 0 0-12 0c0 4-1.5 5.5-1.5 5.5h15S18 14 18 10Z"/><path d="M10.5 19a1.8 1.8 0 0 0 3 0"/>',
    palette: '<path d="M12 3a9 9 0 0 0 0 18c1.4 0 2-1 2-2s-.8-1.6-.8-2.4c0-.9.7-1.6 1.6-1.6H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8Z"/><circle cx="8" cy="10" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="16" cy="10" r="1"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.2 2.3 3.4 5.3 3.4 8.5S14.2 18.2 12 20.5c-2.2-2.3-3.4-5.3-3.4-8.5S9.8 5.8 12 3.5Z"/>',
    link: '<path d="M10 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1.5 1.5"/><path d="M14 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1.5-1.5"/>',
    download: '<path d="M12 3v11"/><path d="m8 10.5 4 4 4-4"/><path d="M4 17v2.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V17"/>',
    help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.5a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.8-.9 1.4v.4M12 17h.01"/>',
    star: '<path d="m12 4 2.5 5.2 5.5.8-4 3.9 1 5.6-5-2.7-5 2.7 1-5.6-4-3.9 5.5-.8L12 4Z"/>',
    ticket: '<path d="M3 9V7.5A1.5 1.5 0 0 1 4.5 6h15A1.5 1.5 0 0 1 21 7.5V9a3 3 0 0 0 0 6v1.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16.5V15a3 3 0 0 0 0-6Z"/><path d="M14 6v12"/>',
    'arrow-right': '<path d="M4 12h15"/><path d="m13 6 6 6-6 6"/>',
    shield: '<path d="M12 3 5 6v5c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6l-7-3Z"/>',
    refresh: '<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8"/><path d="M20 4v4h-4"/><path d="M20 12a8 8 0 0 1-13.7 5.6L4 16"/><path d="M4 20v-4h4"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    leaf: '<path d="M4 20c0-8 6-14 16-14 0 10-6 16-14 16-1 0-2 0-2-2Z"/><path d="M9 15c2-2 5-4 8-5"/>',
    run: '<circle cx="15" cy="5" r="2"/><path d="M5 21l3-5 3 1 1-4-3-2 3-3 3 3h3"/><path d="M8 16l-1 2"/>',
    moon: '<path d="M20 14A8 8 0 0 1 9.5 4.5 8 8 0 1 0 20 14Z"/>',
    pencil: '<path d="M4 20h4L18 10l-4-4L4 16v4Z"/><path d="M13 7l4 4"/>',
    chat: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v10a1.5 1.5 0 0 1-1.5 1.5H10l-4 3v-3H5.5A1.5 1.5 0 0 1 4 15.5v-10Z"/>',
    vape: '<rect x="9" y="10" width="6" height="11" rx="1.5"/><path d="M10.5 10V7.5a1.5 1.5 0 0 1 3 0V10"/><path d="M7 4c1.2 1 1.2 2-.2 3S5.6 9 6.8 10M17 4c-1.2 1-1.2 2 .2 3s1.2 2 0 3"/>',
    'trend-up': '<path d="M4 17 14 7"/><path d="M8 7h6v6"/>',
    'trend-down': '<path d="M4 7 14 17"/><path d="M8 17h6v-6"/>',
    bicep: '<path d="M9 7a2.5 2.5 0 0 1 6 0v6c0 1.5-1 3-3 3s-3-1.5-3-3V7Z"/><path d="M10.5 10a1.5 1.5 0 1 1 3 0"/>'
  };

  function svg(name, size = 20) {
    const body = PATHS[name];
    if (!body) return '';
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  }

  global.Icons = { svg };
})(window);
