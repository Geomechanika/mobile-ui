const TAU = Math.PI * 2;
const DIAL_RADIUS = 88;
const DIAL_CIRC = TAU * DIAL_RADIUS;

const UI_CONFIG = {
  dialReadOnly: true,
  experimentHud: {
    topVisible: true,
    sideVisible: false,
    items: {
      battery: true,
      probeVoltage: true,
      stationTemp: true,
      probeTemp: true,
      memory: true,
      link: true,
    },
  },
  panels: {
    infoGrid: true,
    infoTiles: {
      power: true,
      temperature: true,
      signal: true,
      voltage: true,
    },
    tiltPanel: false,
    measureButton: true,
    powerPanel: true,
    tablePanel: true,
  },
  measureButtonColor: "#ff865c",
  showDialLabel: true,
  showSensorSource: false,
  showChartTitle: true,
  showYAxisTitle: false,
  chartXTitle: "Глубина, м",
  tableMaxRows: Infinity,
  tableColumns: [
    { key: "index", label: "Точка" },
    { key: "x", label: "Дист., м", digits: 0 },
    { key: "height", label: "H, м", digits: 1 },
    { key: "angle", label: "Угол", type: "angle" },
    { key: "temp", label: "Темп.", digits: 1, suffix: "°" },
  ],
  pollMs: 3000,
};

const landscapeQuery = window.matchMedia("(orientation: landscape) and (max-height: 560px)");

const chartMetrics = {
  height: {
    label: "Высота",
    unit: "м",
    yTitle: "Высота, м",
    range: [0, 48],
    digits: 1,
  },
  angle: {
    label: "Угол",
    unit: "°",
    yTitle: "Угол, °",
    range: [-60, 60],
    digits: 0,
  },
  temp: {
    label: "Температура",
    unit: "°C",
    yTitle: "Температура, °C",
    range: [18, 32],
    digits: 1,
  },
};

const state = {
  angle: 0,
  chartActiveIndex: null,
  chartTooltipVisible: false,
  connected: true,
  dialReadOnly: UI_CONFIG.dialReadOnly,
  battery: 4.12,
  inclineAngle: 3.7,
  metric: "height",
  memoryFree: 399,
  power: true,
  probePower: true,
  probeTemp: 8.1,
  probeVoltage: 13.02,
  probeVoltageAvailable: true,
  stationTemp: 12.1,
  temp: 24.1,
  wifi: -54,
  voltage: 5.04,
  profile: {
    x: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45],
    height: [0, 2.6, 6.4, 10.2, 14.6, 19.2, 24.3, 29.8, 35.1, 41.4],
    angle: [-18, -11, 4, 16, 12, 3, 10, 29, 22, 11],
    temp: [22.8, 22.9, 23.0, 23.3, 23.7, 24.1, 24.4, 24.6, 24.9, 25.1],
  },
};

const els = {
  root: document.documentElement,
  metaTheme: document.querySelector('meta[name="theme-color"]'),
  stationTitle: document.getElementById("stationTitle"),
  stationName: document.getElementById("stationName"),
  stationInput: document.getElementById("stationInput"),
  topExperimentHud: document.getElementById("topExperimentHud"),
  sideExperimentHud: document.getElementById("sideExperimentHud"),
  rollDial: document.getElementById("rollDial"),
  sensorSource: document.getElementById("sensorSource"),
  dialMode: document.getElementById("dialMode"),
  dialTicks: document.getElementById("dialTicks"),
  dialArc: document.getElementById("dialArc"),
  dialKnob: document.getElementById("dialKnob"),
  axisMark: document.getElementById("axisMark"),
  dialValue: document.getElementById("dialValue"),
  dialLabel: document.getElementById("dialLabel"),
  chartKicker: document.getElementById("chartKicker"),
  chartGrid: document.getElementById("chartGrid"),
  chartYAxis: document.getElementById("chartYAxis"),
  chartXAxis: document.getElementById("chartXAxis"),
  chartYTitle: document.getElementById("chartYTitle"),
  chartXTitle: document.getElementById("chartXTitle"),
  chartLine: document.getElementById("chartLine"),
  chartFill: document.getElementById("chartFill"),
  chartPoint: document.getElementById("chartPoint"),
  chartHitPoints: document.getElementById("chartHitPoints"),
  chartTooltip: document.getElementById("chartTooltip"),
  chartTooltipBox: document.getElementById("chartTooltipBox"),
  chartTooltipTitle: document.getElementById("chartTooltipTitle"),
  chartTooltipValue: document.getElementById("chartTooltipValue"),
  chartPeak: document.getElementById("chartPeak"),
  metricTabs: [...document.querySelectorAll("[data-metric]")],
  dataHead: document.getElementById("dataHead"),
  dataRows: document.getElementById("dataRows"),
  tableStatus: document.getElementById("tableStatus"),
  tiltPanel: document.getElementById("tiltPanel"),
  tiltValue: document.getElementById("tiltValue"),
  measureButton: document.getElementById("measureButton"),
  infoGrid: document.getElementById("infoGrid"),
  powerTile: document.getElementById("powerTile"),
  tempTile: document.getElementById("tempTile"),
  signalTile: document.getElementById("signalTile"),
  voltageTile: document.getElementById("voltageTile"),
  tempText: document.getElementById("tempText"),
  signalIcon: document.getElementById("signalIcon"),
  wifiText: document.getElementById("wifiText"),
  voltageIcon: document.getElementById("voltageIcon"),
  voltText: document.getElementById("voltText"),
  powerText: document.getElementById("powerText"),
  powerPanel: document.getElementById("powerPanel"),
  powerState: document.getElementById("powerState"),
  powerSwitch: document.getElementById("powerSwitch"),
  probePowerSwitch: document.getElementById("probePowerSwitch"),
  probeConfirmBackdrop: document.getElementById("probeConfirmBackdrop"),
  probeConfirm: document.getElementById("probeConfirm"),
  probeCancel: document.getElementById("probeCancel"),
  probeConfirmOff: document.getElementById("probeConfirmOff"),
  tablePanel: document.getElementById("tablePanel"),
  settingsOpen: document.getElementById("settingsOpen"),
  settingsClose: document.getElementById("settingsClose"),
  settingsSheet: document.getElementById("settingsSheet"),
  sheetBackdrop: document.getElementById("sheetBackdrop"),
  themeSwitch: document.getElementById("themeSwitch"),
  fontWeight: document.getElementById("fontWeight"),
  fontWeightValue: document.getElementById("fontWeightValue"),
  textContrast: document.getElementById("textContrast"),
  textContrastValue: document.getElementById("textContrastValue"),
  scrollTop: document.getElementById("scrollTop"),
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function svgNode(name, attrs = {}) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

function setVisible(element, visible) {
  if (visible) {
    element.removeAttribute("hidden");
  } else {
    element.setAttribute("hidden", "");
  }
  element.style.display = visible ? "" : "none";
}

function isLandscapeLayout() {
  return landscapeQuery.matches;
}

function formatValue(value, metric = state.metric) {
  const config = chartMetrics[metric];
  if (metric === "angle") return formatAngle(Number(value));
  return `${Number(value).toFixed(config.digits)}${config.unit}`;
}

function tableValue(row, column) {
  const value = row[column.key];
  if (column.type === "angle") return formatAngle(Number(value));
  if (column.key === "index") return `#${value}`;
  if (!Number.isFinite(Number(value))) return "";
  const digits = Number.isFinite(column.digits) ? column.digits : 1;
  return `${Number(value).toFixed(digits)}${column.suffix || ""}`;
}

function colorFromQuality(value) {
  const quality = clamp(value, 0, 1);
  const hue = Math.round(5 + quality * 205);
  return `hsl(${hue} 88% 58%)`;
}

function signalColor(dbm) {
  if (!Number.isFinite(dbm)) return "#ff5b5b";
  return colorFromQuality((clamp(dbm, -92, -42) + 92) / 50);
}

function voltageColor(voltage) {
  if (!Number.isFinite(voltage)) return "#ff5b5b";
  const quality = (clamp(voltage, 3.2, 5.2) - 3.2) / 2;
  return `hsl(${Math.round(5 + quality * 135)} 78% 48%)`;
}

function formatVoltage(value) {
  return Number.isFinite(Number(value)) ? `${Number(value).toFixed(2)}В` : "--";
}

function formatTemperature(value) {
  return Number.isFinite(Number(value)) ? `${Number(value).toFixed(1)}°C` : "--";
}

function hudItems() {
  return [
    {
      key: "battery",
      tag: "B",
      value: formatVoltage(state.battery),
      visible: UI_CONFIG.experimentHud.items.battery,
    },
    {
      key: "probeVoltage",
      tag: "P",
      value: state.probeVoltageAvailable ? formatVoltage(state.probeVoltage) : "--",
      visible: UI_CONFIG.experimentHud.items.probeVoltage,
    },
    {
      key: "stationTemp",
      tag: "Ts",
      value: formatTemperature(state.stationTemp),
      visible: UI_CONFIG.experimentHud.items.stationTemp,
    },
    {
      key: "probeTemp",
      tag: "Tp",
      value: formatTemperature(state.probeTemp),
      visible: UI_CONFIG.experimentHud.items.probeTemp,
    },
    {
      key: "memory",
      tag: "Mem",
      value: Number.isFinite(Number(state.memoryFree)) ? String(Math.round(state.memoryFree)) : "--",
      visible: UI_CONFIG.experimentHud.items.memory,
    },
    {
      key: "link",
      tag: "",
      value: "",
      type: "link",
      visible: UI_CONFIG.experimentHud.items.link,
    },
  ].filter((item) => item.visible);
}

function renderHudItem(item) {
  const node = document.createElement("span");
  node.className = `hud-item hud-${item.key}`;

  if (item.type === "link") {
    node.classList.add("hud-link");
    const dot = document.createElement("span");
    dot.className = "link-dot";
    dot.classList.toggle("is-lost", !state.connected);
    dot.setAttribute("aria-label", state.connected ? "Связь есть" : "Связь потеряна");
    node.appendChild(dot);
    return node;
  }

  const tag = document.createElement("span");
  tag.className = "hud-tag";
  tag.textContent = item.tag;

  const value = document.createElement("strong");
  value.className = "hud-value";
  value.textContent = item.value;

  node.append(tag, value);
  return node;
}

function renderExperimentHud() {
  const items = hudItems();
  const topFragment = document.createDocumentFragment();
  const sideFragment = document.createDocumentFragment();
  const landscape = isLandscapeLayout();

  items.forEach((item) => {
    topFragment.appendChild(renderHudItem(item));
    sideFragment.appendChild(renderHudItem(item));
  });

  els.topExperimentHud.replaceChildren(topFragment);
  els.sideExperimentHud.replaceChildren(sideFragment);
  setVisible(els.topExperimentHud, !landscape && UI_CONFIG.experimentHud.topVisible);
  setVisible(els.sideExperimentHud, landscape || UI_CONFIG.experimentHud.sideVisible);
  els.sideExperimentHud.dataset.visible = String(landscape || UI_CONFIG.experimentHud.sideVisible);
}

function renderPanelVisibility() {
  const panels = UI_CONFIG.panels;
  setVisible(els.infoGrid, panels.infoGrid);
  setVisible(els.powerTile, panels.infoTiles.power);
  setVisible(els.tempTile, panels.infoTiles.temperature);
  setVisible(els.signalTile, panels.infoTiles.signal);
  setVisible(els.voltageTile, panels.infoTiles.voltage);
  setVisible(els.tiltPanel, panels.tiltPanel);
  setVisible(els.measureButton, panels.measureButton);
  setVisible(els.powerPanel, panels.powerPanel);
  setVisible(els.tablePanel, panels.tablePanel);
}

function polarPoint(angleDeg, radius = DIAL_RADIUS) {
  const radians = (angleDeg - 90) * Math.PI / 180;
  return {
    x: 120 + radius * Math.cos(radians),
    y: 120 + radius * Math.sin(radians),
  };
}

function angleFromPointer(event) {
  const rect = els.rollDial.getBoundingClientRect();
  const x = event.clientX - rect.left - rect.width / 2;
  const y = event.clientY - rect.top - rect.height / 2;
  return Math.round(Math.atan2(y, x) * 180 / Math.PI + 90);
}

function normalizeAngle(angle) {
  let next = angle;
  while (next > 180) next -= 360;
  while (next < -180) next += 360;
  return next;
}

function formatAngle(value) {
  const sign = value < 0 ? "-" : "";
  const absolute = Math.abs(value);
  let degrees = Math.floor(absolute);
  let minutes = Math.round((absolute - degrees) * 60);

  if (minutes === 60) {
    degrees += 1;
    minutes = 0;
  }

  return `${sign}${degrees}°${String(minutes).padStart(2, "0")}′`;
}

function drawTicks() {
  const fragment = document.createDocumentFragment();

  for (let angle = -150; angle <= 150; angle += 15) {
    const major = angle % 45 === 0;
    const start = polarPoint(angle, major ? 76 : 80);
    const end = polarPoint(angle, 88);
    const line = svgNode("line", {
      x1: start.x.toFixed(2),
      y1: start.y.toFixed(2),
      x2: end.x.toFixed(2),
      y2: end.y.toFixed(2),
    });
    if (major) line.setAttribute("class", "major");
    fragment.appendChild(line);
  }

  els.dialTicks.replaceChildren(fragment);
}

function setDialReadOnly(readOnly) {
  state.dialReadOnly = Boolean(readOnly);
  els.rollDial.dataset.readOnly = String(state.dialReadOnly);
  els.rollDial.classList.toggle("is-control", !state.dialReadOnly);
  els.dialMode.textContent = state.dialReadOnly ? "IMU" : "Ручной";
}

function setDialLabelVisible(visible) {
  setVisible(els.dialLabel, visible);
}

function setSensorSourceVisible(visible) {
  setVisible(els.sensorSource, visible);
}

function setChartTitleVisible(visible) {
  setVisible(els.chartKicker, visible);
}

function setYAxisTitleVisible(visible) {
  setVisible(els.chartYTitle, visible);
}

function applyChartXTitle(label) {
  els.chartXTitle.textContent = label || UI_CONFIG.chartXTitle;
}

function renderDial(angle) {
  state.angle = normalizeAngle(angle);
  const point = polarPoint(state.angle);
  const abs = Math.abs(state.angle);
  const visibleArc = clamp(abs / 180, 0, 1) * DIAL_CIRC / 2;

  els.dialArc.style.strokeDasharray = `${visibleArc.toFixed(2)} ${DIAL_CIRC.toFixed(2)}`;
  els.dialArc.style.transform = `rotate(${state.angle < 0 ? 90 : -90}deg)`;
  els.dialKnob.setAttribute("cx", point.x.toFixed(2));
  els.dialKnob.setAttribute("cy", point.y.toFixed(2));
  els.axisMark.style.transform = `rotate(${state.angle}deg)`;
  els.dialValue.textContent = formatAngle(state.angle);
}

function renderIncline() {
  const value = formatAngle(state.inclineAngle);
  els.dialLabel.textContent = value;
  els.tiltValue.textContent = value;
}

function smoothPath(points) {
  if (points.length < 2) return "";
  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  for (let i = 0; i < points.length - 1; i += 1) {
    const current = points[i];
    const next = points[i + 1];
    const midX = (current.x + next.x) / 2;
    path += ` C ${midX.toFixed(2)} ${current.y.toFixed(2)}, ${midX.toFixed(2)} ${next.y.toFixed(2)}, ${next.x.toFixed(2)} ${next.y.toFixed(2)}`;
  }

  return path;
}

function metricDomain(samples, metric) {
  const [baseMin, baseMax] = chartMetrics[metric].range;
  const min = Math.min(baseMin, ...samples);
  const max = Math.max(baseMax, ...samples);
  if (min === max) return [min - 1, max + 1];
  const pad = (max - min) * 0.08;
  return [min - pad, max + pad];
}

function renderChartAxes(layout, xDomain, yDomain, metric) {
  const grid = document.createDocumentFragment();
  const yAxis = document.createDocumentFragment();
  const xAxis = document.createDocumentFragment();
  const xTicks = 4;
  const yTicks = 4;

  for (let i = 0; i <= yTicks; i += 1) {
    const t = i / yTicks;
    const y = layout.top + layout.plotH * t;
    const value = yDomain[1] - (yDomain[1] - yDomain[0]) * t;
    grid.appendChild(svgNode("path", { d: `M${layout.left} ${y.toFixed(2)}H${layout.rightEdge}` }));
    const text = svgNode("text", {
      x: layout.left - 9,
      y: (y + 3).toFixed(2),
      "text-anchor": "end",
    });
    text.textContent = Number(value).toFixed(chartMetrics[metric].digits);
    yAxis.appendChild(text);
  }

  for (let i = 0; i <= xTicks; i += 1) {
    const t = i / xTicks;
    const x = layout.left + layout.plotW * t;
    const value = xDomain[0] + (xDomain[1] - xDomain[0]) * t;
    grid.appendChild(svgNode("path", { d: `M${x.toFixed(2)} ${layout.top}V${layout.bottomEdge}` }));
    const text = svgNode("text", {
      x: x.toFixed(2),
      y: layout.bottomEdge + 20,
      "text-anchor": "middle",
    });
    text.textContent = Number(value).toFixed(0);
    xAxis.appendChild(text);
  }

  yAxis.appendChild(svgNode("path", { d: `M${layout.left} ${layout.top}V${layout.bottomEdge}` }));
  xAxis.appendChild(svgNode("path", { d: `M${layout.left} ${layout.bottomEdge}H${layout.rightEdge}` }));
  els.chartGrid.replaceChildren(grid);
  els.chartYAxis.replaceChildren(yAxis);
  els.chartXAxis.replaceChildren(xAxis);
  els.chartYTitle.textContent = chartMetrics[metric].yTitle;
  setVisible(els.chartYTitle, UI_CONFIG.showYAxisTitle);
  els.chartXTitle.textContent = UI_CONFIG.chartXTitle;
  els.chartXTitle.setAttribute("x", ((layout.left + layout.rightEdge) / 2).toFixed(2));
  els.chartXTitle.setAttribute("y", (layout.bottomEdge + 34).toFixed(2));
}

function positionChartPoint(index, points) {
  const point = points[index];
  if (!point) return;
  state.chartActiveIndex = index;
  els.chartPoint.setAttribute("cx", point.x.toFixed(2));
  els.chartPoint.setAttribute("cy", point.y.toFixed(2));
}

function selectChartPoint(index, points) {
  const metric = state.metric;
  const point = points[index];
  if (!point) return;
  const tooltipW = 100;
  const tooltipH = 44;
  const x = clamp(point.x - tooltipW / 2, 48, 354 - tooltipW);
  const y = point.y > 72 ? point.y - tooltipH - 12 : point.y + 14;

  state.chartTooltipVisible = true;
  positionChartPoint(index, points);
  els.chartTooltip.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
  els.chartTooltipTitle.textContent = `${UI_CONFIG.chartXTitle}: ${Number(state.profile.x[point.sourceIndex]).toFixed(0)}`;
  els.chartTooltipValue.textContent = `${chartMetrics[metric].label}: ${formatValue(point.sample, metric)}`;
  setVisible(els.chartTooltip, true);
}

function renderChartHitPoints(points) {
  const fragment = document.createDocumentFragment();

  points.forEach((point, index) => {
    const hit = svgNode("circle", {
      cx: point.x.toFixed(2),
      cy: point.y.toFixed(2),
      r: "13",
      tabindex: "0",
      "aria-label": `Точка ${index + 1}`,
    });
    hit.addEventListener("pointerdown", () => selectChartPoint(index, points));
    hit.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectChartPoint(index, points);
      }
    });
    fragment.appendChild(hit);
  });

  els.chartHitPoints.replaceChildren(fragment);
}

function renderChart() {
  const metric = state.metric;
  const config = chartMetrics[metric];
  const chartStart = Math.max(0, state.profile[metric].length - 24);
  const samples = state.profile[metric].slice(chartStart);
  const xs = state.profile.x.slice(chartStart);
  const layout = {
    left: UI_CONFIG.showYAxisTitle ? 50 : 40,
    top: 20,
    plotW: UI_CONFIG.showYAxisTitle ? 290 : 300,
    plotH: 118,
  };
  layout.rightEdge = layout.left + layout.plotW;
  layout.bottomEdge = layout.top + layout.plotH;

  const xDomain = [Math.min(...xs), Math.max(...xs)];
  const yDomain = metricDomain(samples, metric);
  const points = samples.map((sample, index) => {
    const xValue = xs[index] ?? index;
    const x = layout.left + ((xValue - xDomain[0]) / (xDomain[1] - xDomain[0] || 1)) * layout.plotW;
    const y = layout.bottomEdge - ((sample - yDomain[0]) / (yDomain[1] - yDomain[0])) * layout.plotH;
    return { x, y, sample, sourceIndex: chartStart + index };
  });
  const line = smoothPath(points);
  const last = points[points.length - 1];

  renderChartAxes(layout, xDomain, yDomain, metric);
  els.chartLine.setAttribute("d", line);
  els.chartFill.setAttribute("d", `${line} L ${last.x.toFixed(2)} ${layout.bottomEdge} L ${points[0].x.toFixed(2)} ${layout.bottomEdge} Z`);
  renderChartHitPoints(points);
  const markerIndex = clamp(state.chartActiveIndex ?? points.length - 1, 0, points.length - 1);
  positionChartPoint(markerIndex, points);
  if (state.chartTooltipVisible && state.chartActiveIndex !== null) {
    selectChartPoint(state.chartActiveIndex, points);
  } else {
    setVisible(els.chartTooltip, false);
  }
  els.chartPeak.textContent = `${config.label}: ${formatValue(last.sample, metric)}`;
}

function renderTable() {
  const rows = [];
  const total = state.profile.x.length;
  const start = Number.isFinite(UI_CONFIG.tableMaxRows)
    ? Math.max(0, total - UI_CONFIG.tableMaxRows)
    : 0;
  const columns = UI_CONFIG.tableColumns.filter((column) => (
    column.key === "index" || Array.isArray(state.profile[column.key])
  ));

  for (let i = start; i < total; i += 1) {
    rows.push({
      index: i + 1,
      ...Object.fromEntries(
        Object.entries(state.profile).map(([key, values]) => [key, values[i]])
      ),
    });
  }

  const headRow = document.createElement("tr");
  columns.forEach((column) => {
    const th = document.createElement("th");
    th.textContent = column.label || column.key;
    headRow.appendChild(th);
  });
  els.dataHead.replaceChildren(headRow);

  const fragment = document.createDocumentFragment();
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    columns.forEach((column) => {
      const td = document.createElement("td");
      td.textContent = tableValue(row, column);
      if (column.key === "index") td.className = "row-index";
      tr.appendChild(td);
    });

    fragment.appendChild(tr);
  });

  els.dataRows.replaceChildren(fragment);
  els.tableStatus.textContent = `${rows.length} строк`;
}

function setMetric(metric) {
  if (!chartMetrics[metric]) return;
  state.metric = metric;
  els.metricTabs.forEach((button) => {
    const active = button.dataset.metric === metric;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  renderChart();
}

function renderTelemetry() {
  els.tempText.textContent = `${state.temp.toFixed(1)}°C`;
  els.signalIcon.style.setProperty("--icon-color", signalColor(state.wifi));
  els.signalIcon.classList.toggle("is-offline", !state.connected);
  els.wifiText.textContent = state.connected && Number.isFinite(state.wifi) ? `${state.wifi} dBm` : "нет связи";
  els.voltageIcon.style.setProperty("--icon-color", voltageColor(state.voltage));
  els.voltText.textContent = `${state.voltage.toFixed(2)} V`;
  els.powerText.textContent = state.power ? "Вкл" : "Выкл";
  els.powerState.textContent = state.power ? "Включено" : "Отключено";
  els.powerSwitch.classList.toggle("is-on", state.power);
  els.powerSwitch.setAttribute("aria-checked", String(state.power));
  els.probePowerSwitch.classList.toggle("is-on", state.probePower);
  els.probePowerSwitch.setAttribute("aria-checked", String(state.probePower));
  renderExperimentHud();
}

async function postJson(url, payload) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch {
    return false;
  }
}

function setPower(nextPower, sync = true) {
  state.power = nextPower;
  renderTelemetry();
  if (sync) postJson("/api/power", { power: nextPower });
}

function setProbePower(nextPower, sync = true) {
  state.probePower = Boolean(nextPower);
  state.probeVoltageAvailable = state.probePower;
  renderTelemetry();
  if (sync) postJson("/api/probe-power", { probePower: state.probePower });
}

function openProbeConfirm() {
  els.probeConfirmBackdrop.hidden = false;
  requestAnimationFrame(() => {
    els.probeConfirmBackdrop.classList.add("is-open");
    els.probeConfirm.classList.add("is-open");
    els.probeConfirm.setAttribute("aria-hidden", "false");
    els.probeCancel.focus();
  });
}

function closeProbeConfirm() {
  els.probeConfirmBackdrop.classList.remove("is-open");
  els.probeConfirm.classList.remove("is-open");
  els.probeConfirm.setAttribute("aria-hidden", "true");
  window.setTimeout(() => {
    if (!els.probeConfirm.classList.contains("is-open")) els.probeConfirmBackdrop.hidden = true;
  }, 180);
}

function confirmProbeOff() {
  closeProbeConfirm();
  setProbePower(false);
}

function setInclineAngle(angle) {
  if (!Number.isFinite(Number(angle))) return;
  state.inclineAngle = normalizeAngle(Number(angle));
  renderIncline();
}

function applyMeasureButtonColor(color) {
  if (typeof color !== "string" || !color.trim()) return;
  const nextColor = color.trim();
  if (window.CSS?.supports && !CSS.supports("color", nextColor)) return;
  UI_CONFIG.measureButtonColor = nextColor;
  els.root.style.setProperty("--measure-color", nextColor);
  els.measureButton.dataset.color = nextColor;
  els.measureButton.style.setProperty("--measure-color", nextColor);
}

function triggerMeasure(sync = true) {
  els.measureButton.classList.add("is-firing");
  window.setTimeout(() => els.measureButton.classList.remove("is-firing"), 320);
  if (sync) postJson("/api/measure", { measure: true });
}

function setTheme(theme) {
  const isDark = theme === "dark";
  els.root.dataset.theme = theme;
  els.metaTheme.setAttribute("content", isDark ? "#161b22" : "#e9eef5");
  els.themeSwitch.classList.toggle("is-on", isDark);
  els.themeSwitch.setAttribute("aria-checked", String(isDark));
  localStorage.setItem("pico-theme", theme);
  setTextContrast(Number(els.textContrast.value || 86));
}

function setStationName(name) {
  const safeName = name.trim().slice(0, 32) || "Станция";
  els.stationName.textContent = safeName;
  els.stationInput.value = safeName;
  localStorage.setItem("pico-station-name", safeName);
}

function channelMix(from, to, amount) {
  return Math.round(from + (to - from) * amount);
}

function rgbString(rgb) {
  return `rgb(${rgb[0]} ${rgb[1]} ${rgb[2]})`;
}

function setFontWeight(weight) {
  const value = clamp(Number(weight) || 560, 420, 760);
  els.root.style.setProperty("--ui-weight", String(value));
  els.root.style.setProperty("--title-weight", String(clamp(value + 160, 560, 860)));
  els.fontWeight.value = String(value);
  els.fontWeightValue.textContent = String(value);
  localStorage.setItem("pico-font-weight", String(value));
}

function setTextContrast(contrast) {
  const value = clamp(Number(contrast) || 86, 68, 100);
  const amount = (value - 68) / 32;
  const isDark = els.root.dataset.theme === "dark";
  const rgb = isDark
    ? [
        channelMix(190, 255, amount),
        channelMix(199, 255, amount),
        channelMix(210, 255, amount),
      ]
    : [
        channelMix(75, 12, amount),
        channelMix(84, 18, amount),
        channelMix(98, 32, amount),
      ];

  els.root.style.setProperty("--text", rgbString(rgb));
  els.textContrast.value = String(value);
  els.textContrastValue.textContent = `${value}%`;
  localStorage.setItem("pico-text-contrast", String(value));
}

function startRename() {
  els.stationName.contentEditable = "true";
  els.stationName.classList.add("is-editing");
  els.stationName.focus();

  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(els.stationName);
  selection.removeAllRanges();
  selection.addRange(range);
}

function finishRename() {
  if (els.stationName.contentEditable !== "true") return;
  els.stationName.contentEditable = "false";
  els.stationName.classList.remove("is-editing");
  setStationName(els.stationName.textContent);
}

function openSettings() {
  els.sheetBackdrop.hidden = false;
  requestAnimationFrame(() => {
    els.sheetBackdrop.classList.add("is-open");
    els.settingsSheet.classList.add("is-open");
    els.settingsSheet.setAttribute("aria-hidden", "false");
  });
}

function closeSettings() {
  els.sheetBackdrop.classList.remove("is-open");
  els.settingsSheet.classList.remove("is-open");
  els.settingsSheet.setAttribute("aria-hidden", "true");
  window.setTimeout(() => {
    if (!els.settingsSheet.classList.contains("is-open")) els.sheetBackdrop.hidden = true;
  }, 220);
}

function bindDial() {
  let dragging = false;

  els.rollDial.addEventListener("pointerdown", (event) => {
    if (state.dialReadOnly) return;
    dragging = true;
    els.rollDial.setPointerCapture(event.pointerId);
    renderDial(angleFromPointer(event));
  });

  els.rollDial.addEventListener("pointermove", (event) => {
    if (!dragging || state.dialReadOnly) return;
    renderDial(angleFromPointer(event));
  });

  els.rollDial.addEventListener("pointerup", (event) => {
    if (!dragging) return;
    dragging = false;
    els.rollDial.releasePointerCapture(event.pointerId);
    postJson("/api/roll", { angle: state.angle });
  });

  els.rollDial.addEventListener("pointercancel", () => {
    dragging = false;
  });
}

function bindStationName() {
  let pressTimer = 0;

  els.stationTitle.addEventListener("pointerdown", () => {
    pressTimer = window.setTimeout(startRename, 650);
  });

  ["pointerup", "pointercancel", "pointerleave"].forEach((eventName) => {
    els.stationTitle.addEventListener(eventName, () => {
      window.clearTimeout(pressTimer);
    });
  });

  els.stationTitle.addEventListener("contextmenu", (event) => event.preventDefault());
  els.stationName.addEventListener("blur", finishRename);
  els.stationName.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      els.stationName.blur();
    }
  });

  els.stationInput.addEventListener("input", () => setStationName(els.stationInput.value));
}

function bindControls() {
  els.powerSwitch.addEventListener("click", () => setPower(!state.power));
  els.probePowerSwitch.addEventListener("click", () => {
    if (state.probePower) {
      openProbeConfirm();
    } else {
      setProbePower(true);
    }
  });
  els.probeCancel.addEventListener("click", closeProbeConfirm);
  els.probeConfirmOff.addEventListener("click", confirmProbeOff);
  els.probeConfirmBackdrop.addEventListener("click", closeProbeConfirm);
  els.measureButton.addEventListener("click", () => triggerMeasure());
  els.settingsOpen.addEventListener("click", openSettings);
  els.settingsClose.addEventListener("click", closeSettings);
  els.sheetBackdrop.addEventListener("click", closeSettings);
  els.themeSwitch.addEventListener("click", () => {
    setTheme(els.root.dataset.theme === "dark" ? "light" : "dark");
  });
  els.fontWeight.addEventListener("input", () => setFontWeight(els.fontWeight.value));
  els.textContrast.addEventListener("input", () => setTextContrast(els.textContrast.value));
  els.metricTabs.forEach((button) => {
    button.addEventListener("click", () => setMetric(button.dataset.metric));
  });
  els.scrollTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  window.addEventListener("scroll", () => {
    els.scrollTop.hidden = window.scrollY < 360;
  }, { passive: true });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && els.probeConfirm.classList.contains("is-open")) {
      closeProbeConfirm();
    }
  });
  landscapeQuery.addEventListener("change", () => {
    renderExperimentHud();
    renderChart();
  });
}

function applyExperimentOptions(options) {
  if (!options || typeof options !== "object") return;
  if (typeof options.topVisible === "boolean") {
    UI_CONFIG.experimentHud.topVisible = options.topVisible;
  }
  if (typeof options.sideVisible === "boolean") {
    UI_CONFIG.experimentHud.sideVisible = options.sideVisible;
  }
  if (options.items && typeof options.items === "object") {
    Object.entries(options.items).forEach(([key, visible]) => {
      if (key in UI_CONFIG.experimentHud.items && typeof visible === "boolean") {
        UI_CONFIG.experimentHud.items[key] = visible;
      }
    });
  }
}

function applyPanelOptions(options) {
  if (!options || typeof options !== "object") return;
  const panels = UI_CONFIG.panels;

  ["infoGrid", "tiltPanel", "measureButton", "powerPanel", "tablePanel"].forEach((key) => {
    if (typeof options[key] === "boolean") panels[key] = options[key];
  });

  if (options.infoTiles && typeof options.infoTiles === "object") {
    Object.entries(options.infoTiles).forEach(([key, visible]) => {
      if (key in panels.infoTiles && typeof visible === "boolean") {
        panels.infoTiles[key] = visible;
      }
    });
  }
}

function applyExperimentData(data) {
  if (!data || typeof data !== "object") return;

  const battery = data.battery ?? data.bat;
  const probeVoltage = data.probeVoltage ?? data.vprobe;
  const stationTemp = data.stationTemp ?? data.tstation;
  const probeTemp = data.probeTemp ?? data.tprobe;
  const memoryFree = data.memoryFree ?? data.mem;
  const probePower = data.probePower ?? data.probePowered ?? data.probe_power;
  const inclineAngle = data.inclineAngle ?? data.tiltAngle ?? data.A0 ?? data.a0;
  const measureButtonColor = data.measureButtonColor ?? data.measureColor;

  if (Number.isFinite(Number(battery))) state.battery = Number(battery);
  if (Number.isFinite(Number(probeVoltage))) state.probeVoltage = Number(probeVoltage);
  if (Number.isFinite(Number(stationTemp))) state.stationTemp = Number(stationTemp);
  if (Number.isFinite(Number(probeTemp))) state.probeTemp = Number(probeTemp);
  if (Number.isFinite(Number(memoryFree))) state.memoryFree = Number(memoryFree);
  if (Number.isFinite(Number(inclineAngle))) state.inclineAngle = normalizeAngle(Number(inclineAngle));
  applyMeasureButtonColor(measureButtonColor);

  if (typeof probePower === "boolean") {
    state.probePower = probePower;
  }

  if (typeof data.probeVoltageAvailable === "boolean") {
    state.probeVoltageAvailable = data.probeVoltageAvailable;
  } else if (typeof probePower === "boolean") {
    state.probeVoltageAvailable = state.probePower;
  }
}

function normalizeProfile(profile) {
  if (!profile || typeof profile !== "object") return false;
  const keys = [...new Set([
    "x",
    "height",
    "angle",
    "temp",
    ...UI_CONFIG.tableColumns.map((column) => column.key).filter((key) => key !== "index"),
  ])];
  const next = {};

  keys.forEach((key) => {
    if (Array.isArray(profile[key])) {
      next[key] = profile[key].map(Number).filter(Number.isFinite);
    }
  });

  const required = ["x", "height", "angle", "temp"];
  if (required.some((key) => !next[key]?.length)) return false;
  const lengths = Object.values(next).map((values) => values.length);
  const length = Math.min(...lengths);
  if (!length) return false;

  Object.keys(next).forEach((key) => {
    state.profile[key] = next[key].slice(0, length);
  });

  return true;
}

function pushDemoSample(nextAngle) {
  const profile = state.profile;
  const last = profile.x.length - 1;
  const nextX = profile.x[last] + 5;
  const nextHeight = profile.height[last] + 3.2 + Math.random() * 1.4;
  const nextTemp = profile.temp[last] + (Math.random() - 0.35) * 0.18;

  profile.x.push(nextX);
  profile.height.push(nextHeight);
  profile.angle.push(nextAngle);
  profile.temp.push(nextTemp);

  Object.keys(profile).forEach((key) => {
    profile[key] = profile[key].slice(-120);
  });
}

async function fetchState() {
  try {
    const response = await fetch("/api/state", { cache: "no-store" });
    if (!response.ok) {
      state.connected = false;
      renderTelemetry();
      return;
    }
    const data = await response.json();
    state.connected = true;
    applyExperimentData(data);
    applyExperimentOptions(data.experimentHud);
    applyPanelOptions(data.panels || data.visiblePanels);
    renderPanelVisibility();
    const rollAngle = data.angle ?? data.A1 ?? data.a1;
    if (Number.isFinite(Number(rollAngle))) renderDial(Number(rollAngle));
    if (Number.isFinite(data.temp)) state.temp = data.temp;
    if (Number.isFinite(data.wifi)) state.wifi = data.wifi;
    if (Number.isFinite(data.voltage)) state.voltage = data.voltage;
    if (typeof data.power === "boolean") state.power = data.power;
    if (typeof data.dialReadOnly === "boolean") setDialReadOnly(data.dialReadOnly);
    if (normalizeProfile(data.profile)) {
      renderChart();
      renderTable();
    } else if (Array.isArray(data.samples) && data.samples.length > 1) {
      state.profile.angle = data.samples.slice(-24).map(Number).filter(Number.isFinite);
      state.profile.x = state.profile.angle.map((_, index) => index * 5);
      state.profile.height = state.profile.angle.map((_, index) => index * 3.5);
      state.profile.temp = state.profile.angle.map((_, index) => state.temp + index * 0.04);
      renderChart();
      renderTable();
    }
    renderTelemetry();
    renderIncline();
  } catch {
    state.connected = false;
    const next = clamp(state.angle + (Math.random() - 0.5) * 8, -180, 180);
    state.temp += (Math.random() - 0.5) * 0.08;
    pushDemoSample(next);
    renderDial(next);
    renderIncline();
    renderChart();
    renderTable();
    renderTelemetry();
  }
}

function exposeApi() {
  window.PicoStationUI = {
    setDialReadOnly,
    setDialLabelVisible,
    setSensorSourceVisible,
    setChartTitleVisible,
    setExperimentHudOptions(options) {
      applyExperimentOptions(options);
      renderExperimentHud();
    },
    setPanelVisibility(options) {
      applyPanelOptions(options);
      renderPanelVisibility();
    },
    setYAxisTitleVisible,
    setChartXTitle(label) {
      UI_CONFIG.chartXTitle = label || UI_CONFIG.chartXTitle;
      applyChartXTitle(UI_CONFIG.chartXTitle);
      renderChart();
    },
    setMetric,
    setPower,
    setProbePower,
    setInclineAngle,
    setMeasureButtonColor: applyMeasureButtonColor,
    measure: triggerMeasure,
    setTableColumns(columns) {
      if (!Array.isArray(columns)) return;
      UI_CONFIG.tableColumns = columns.filter((column) => column && column.key);
      renderTable();
    },
    update(data) {
      const rollAngle = data.angle ?? data.A1 ?? data.a1;
      if (Number.isFinite(Number(rollAngle))) renderDial(Number(rollAngle));
      if (Number.isFinite(data.temp)) state.temp = data.temp;
      if (Number.isFinite(data.wifi)) state.wifi = data.wifi;
      if (Number.isFinite(data.voltage)) state.voltage = data.voltage;
      if (typeof data.power === "boolean") state.power = data.power;
      if (typeof data.connected === "boolean") state.connected = data.connected;
      applyExperimentData(data);
      applyExperimentOptions(data.experimentHud);
      applyPanelOptions(data.panels || data.visiblePanels);
      renderPanelVisibility();
      if (typeof data.dialReadOnly === "boolean") setDialReadOnly(data.dialReadOnly);
      if (typeof data.showDialLabel === "boolean") setDialLabelVisible(data.showDialLabel);
      if (typeof data.showSensorSource === "boolean") setSensorSourceVisible(data.showSensorSource);
      if (typeof data.showChartTitle === "boolean") setChartTitleVisible(data.showChartTitle);
      if (typeof data.showYAxisTitle === "boolean") {
        UI_CONFIG.showYAxisTitle = data.showYAxisTitle;
        setYAxisTitleVisible(data.showYAxisTitle);
      }
      if (typeof data.chartXTitle === "string") {
        UI_CONFIG.chartXTitle = data.chartXTitle;
        applyChartXTitle(data.chartXTitle);
      }
      renderIncline();
      if (normalizeProfile(data.profile)) {
        renderChart();
        renderTable();
      }
      renderTelemetry();
    },
  };
  document.documentElement.dataset.uiReady = "true";
  document.addEventListener("pico:set-dial-read-only", (event) => {
    setDialReadOnly(Boolean(event.detail?.readOnly));
  });
  document.addEventListener("pico:set-metric", (event) => {
    setMetric(event.detail?.metric);
  });
  document.addEventListener("pico:set-options", (event) => {
    window.PicoStationUI.update(event.detail || {});
  });
}

function boot() {
  const savedTheme = localStorage.getItem("pico-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  setTheme(savedTheme || (prefersDark ? "dark" : "light"));
  setFontWeight(localStorage.getItem("pico-font-weight") || 560);
  setTextContrast(localStorage.getItem("pico-text-contrast") || 86);
  setStationName(localStorage.getItem("pico-station-name") || els.stationName.textContent);

  drawTicks();
  setDialReadOnly(UI_CONFIG.dialReadOnly);
  setDialLabelVisible(UI_CONFIG.showDialLabel);
  setSensorSourceVisible(UI_CONFIG.showSensorSource);
  setChartTitleVisible(UI_CONFIG.showChartTitle);
  setYAxisTitleVisible(UI_CONFIG.showYAxisTitle);
  applyChartXTitle(UI_CONFIG.chartXTitle);
  applyMeasureButtonColor(els.measureButton.dataset.color || UI_CONFIG.measureButtonColor);
  renderPanelVisibility();
  renderDial(state.angle);
  renderIncline();
  renderChart();
  renderTable();
  renderExperimentHud();
  renderTelemetry();
  bindDial();
  bindStationName();
  bindControls();
  exposeApi();

  fetchState();
  window.setInterval(fetchState, UI_CONFIG.pollMs);
}

boot();
