/* Dependency-free inline SVG charts. Colors are CSS custom properties so
   they repaint automatically with the light/dark theme toggle. */
(function (global) {
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function niceMax(v) {
    if (v <= 0) return 4;
    const mag = Math.pow(10, Math.floor(Math.log10(v)));
    const norm = v / mag;
    let step;
    if (norm <= 1) step = 1; else if (norm <= 2) step = 2; else if (norm <= 5) step = 5; else step = 10;
    return step * mag;
  }

  // Smooth a polyline into a cubic path using simple midpoint smoothing.
  function smoothPath(pts) {
    if (pts.length < 2) return '';
    let d = `M ${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[i + 1];
      const mx = (x1 + x2) / 2;
      d += ` Q ${x1},${y1} ${mx},${(y1 + y2) / 2}`;
    }
    const last = pts[pts.length - 1];
    d += ` T ${last[0]},${last[1]}`;
    return d;
  }

  /**
   * series: [{ label, color, data:number[], dashed?:bool }]
   * xLabels: string[] same length as each series.data
   */
  function lineChart({ width = 340, height = 150, series, xLabels, yFormat = v => v }) {
    const pad = { top: 12, right: 8, bottom: 20, left: 8 };
    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;
    const allVals = series.flatMap(s => s.data);
    const maxV = niceMax(Math.max(1, ...allVals));
    const n = xLabels.length;
    const stepX = n > 1 ? innerW / (n - 1) : 0;

    const yToPx = v => pad.top + innerH - (v / maxV) * innerH;
    const xToPx = i => pad.left + i * stepX;

    const gridN = 3;
    let gridLines = '';
    for (let g = 0; g <= gridN; g++) {
      const y = pad.top + (innerH / gridN) * g;
      gridLines += `<line x1="${pad.left}" y1="${y.toFixed(1)}" x2="${width - pad.right}" y2="${y.toFixed(1)}" class="grid-line"/>`;
    }

    let paths = '';
    series.forEach(s => {
      const pts = s.data.map((v, i) => [xToPx(i), yToPx(v)]);
      const dash = s.dashed ? ' stroke-dasharray="4 4"' : '';
      paths += `<path d="${smoothPath(pts)}" fill="none" stroke="${s.color}" stroke-width="2"${dash} stroke-linecap="round" stroke-linejoin="round"/>`;
      const [lx, ly] = pts[pts.length - 1];
      if (!s.dashed) {
        paths += `<circle cx="${lx}" cy="${ly}" r="4.5" fill="${s.color}"><title>${esc(s.label)}: ${esc(yFormat(s.data[s.data.length - 1]))}</title></circle>`;
      }
      pts.forEach((p, i) => {
        paths += `<circle cx="${p[0]}" cy="${p[1]}" r="9" fill="transparent"><title>${esc(xLabels[i])} — ${esc(s.label)}: ${esc(yFormat(s.data[i]))}</title></circle>`;
      });
    });

    let xAxis = '';
    xLabels.forEach((lab, i) => {
      if (n > 8 && i % Math.ceil(n / 6) !== 0 && i !== n - 1) return;
      xAxis += `<text x="${xToPx(i)}" y="${height - 4}" text-anchor="middle" class="axis-label">${esc(lab)}</text>`;
    });

    return `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">${gridLines}${paths}${xAxis}</svg>`;
  }

  /**
   * categories: string[]
   * series: [{ label, color, data:number[] }]  values aligned with categories
   */
  function groupedBarChart({ width = 340, height = 160, categories, series, yFormat = v => v }) {
    const pad = { top: 10, right: 6, bottom: 20, left: 6 };
    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;
    const allVals = series.flatMap(s => s.data);
    const maxV = niceMax(Math.max(1, ...allVals));
    const n = categories.length;
    const groupW = innerW / n;
    const barGap = 2;
    const barW = Math.max(4, (groupW - barGap * (series.length + 1)) / series.length);

    const yToPx = v => pad.top + innerH - (v / maxV) * innerH;

    const gridN = 3;
    let gridLines = '';
    for (let g = 0; g <= gridN; g++) {
      const y = pad.top + (innerH / gridN) * g;
      gridLines += `<line x1="${pad.left}" y1="${y.toFixed(1)}" x2="${width - pad.right}" y2="${y.toFixed(1)}" class="grid-line"/>`;
    }

    let bars = '';
    let xAxis = '';
    categories.forEach((cat, ci) => {
      const groupX = pad.left + ci * groupW;
      series.forEach((s, si) => {
        const v = s.data[ci] || 0;
        const barH = (v / maxV) * innerH;
        const x = groupX + barGap + si * (barW + barGap);
        const y = pad.top + innerH - barH;
        bars += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(1, barH).toFixed(1)}" rx="3" fill="${s.color}"><title>${esc(cat)} — ${esc(s.label)}: ${esc(yFormat(v))}</title></rect>`;
      });
      xAxis += `<text x="${(groupX + groupW / 2).toFixed(1)}" y="${height - 4}" text-anchor="middle" class="axis-label">${esc(cat)}</text>`;
    });

    return `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">${gridLines}${bars}${xAxis}</svg>`;
  }

  // angle 0 = top (12 o'clock), positive = clockwise
  function polar(cx, cy, r, angleDeg) {
    const rad = angleDeg * Math.PI / 180;
    return [cx + r * Math.sin(rad), cy - r * Math.cos(rad)];
  }

  function arcPath(cx, cy, r, startDeg, endDeg) {
    const sweep = endDeg - startDeg;
    const [x1, y1] = polar(cx, cy, r, startDeg);
    const [x2, y2] = polar(cx, cy, r, endDeg);
    const largeArc = sweep > 180 ? 1 : 0;
    return `M ${x1.toFixed(2)},${y1.toFixed(2)} A ${r},${r} 0 ${largeArc} 1 ${x2.toFixed(2)},${y2.toFixed(2)}`;
  }

  /**
   * A 270°-sweep speedometer-style ring (gap centered at the bottom),
   * used for the "today's count vs. limit" hero on the home screen.
   */
  function gaugeChart({ size = 220, stroke = 16, pct, color = 'var(--accent-blue)', trackColor = 'var(--surface-3)' }) {
    const cx = size / 2, cy = size / 2, r = (size - stroke) / 2;
    const startDeg = -135, endDeg = 135; // 270deg sweep, 90deg gap at bottom
    const clamped = Math.max(0, Math.min(100, pct));
    const valueEndDeg = startDeg + (endDeg - startDeg) * (clamped / 100);
    const track = arcPath(cx, cy, r, startDeg, endDeg);
    const value = clamped > 0 ? arcPath(cx, cy, r, startDeg, valueEndDeg) : '';
    return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <path d="${track}" fill="none" stroke="${trackColor}" stroke-width="${stroke}" stroke-linecap="round"/>
      ${value ? `<path d="${value}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"/>` : ''}
    </svg>`;
  }

  function legendHtml(series) {
    return `<div class="chart-legend">${series.map(s => `
      <span class="legend-dot">${s.shape === 'line' ? `<span class="legend-line" style="background:${s.color}${s.dashed ? ';background-image:linear-gradient(90deg,' + s.color + ' 60%,transparent 0);background-size:6px 2px' : ''}"></span>` : `<span class="legend-swatch" style="background:${s.color}"></span>`}${esc(s.label)}</span>
    `).join('')}</div>`;
  }

  global.Charts = { lineChart, groupedBarChart, gaugeChart, legendHtml, esc };
})(window);
