const $ = s => document.querySelector(s);
const C = { accent: "#2dd4a7", blue: "#38bdf8", warn: "#f5b041", alert: "#f5566c", purple: "#a78bfa", muted: "#8499ab", grid: "rgba(120,170,210,.10)" };

Chart.defaults.color = C.muted;
Chart.defaults.font.family = "Inter, system-ui, sans-serif";
Chart.defaults.borderColor = C.grid;
Chart.defaults.plugins.legend.labels.boxWidth = 10;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.maintainAspectRatio = false;

const grad = (ctx, color) => {
  const g = ctx.createLinearGradient(0, 0, 0, 260);
  g.addColorStop(0, color + "55"); g.addColorStop(1, color + "00"); return g;
};
const charts = {};
function chart(id, cfg) {
  const el = document.getElementById(id);
  const wrap = document.createElement("div");
  wrap.style.cssText = `position:relative;height:${el.getAttribute("height")}px`;
  el.replaceWith(wrap); wrap.appendChild(el);
  charts[id] = new Chart(el, cfg); return charts[id];
}

/* ---------- Header ---------- */
$("#village-meta").textContent = `${VILLAGE.district} · Pop. ${VILLAGE.population.toLocaleString()} · ${VILLAGE.households.toLocaleString()} households · ${VILLAGE.area}`;
setInterval(() => ($("#clock").textContent = new Date().toLocaleTimeString("en-GB")), 1000);

/* ---------- Navigation ---------- */
const built = {};
document.querySelectorAll(".nav").forEach(n => n.addEventListener("click", () => {
  document.querySelectorAll(".nav").forEach(x => x.classList.toggle("active", x === n));
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === "view-" + n.dataset.view));
  if (!built[n.dataset.view]) { built[n.dataset.view] = true; BUILD[n.dataset.view]?.(); }
  window.scrollTo({ top: 0, behavior: "smooth" });
}));

/* ---------- KPIs ---------- */
const kpis = [
  { k: "pop",  icon: "👥", lbl: "Population",      val: 4862,  fmt: v => v.toLocaleString(), d: "+1.2% YoY", up: true, glow: "rgba(56,189,248,.2)" },
  { k: "yld",  icon: "🌾", lbl: "Crop health index", val: 78,  fmt: v => v + "/100", d: "+6 vs last month", up: true },
  { k: "wtr",  icon: "💧", lbl: "Water tank",      val: 41,    fmt: v => v.toFixed(0) + "%", d: "Refill 16:30", up: false, glow: "rgba(245,176,65,.2)" },
  { k: "pwr",  icon: "⚡", lbl: "Solar output",    val: 212,   fmt: v => v.toFixed(0) + " kW", d: "86% efficiency", up: true, glow: "rgba(245,176,65,.2)" },
  { k: "aqi",  icon: "🌿", lbl: "Air quality",     val: 56,    fmt: v => "AQI " + v.toFixed(0), d: "Satisfactory", up: true },
  { k: "risk", icon: "🚨", lbl: "Active alerts",   val: 2,     fmt: v => v + " critical", d: "4 warnings", up: false, glow: "rgba(245,86,108,.22)" },
];
$("#kpis").innerHTML = kpis.map(k => `<div class="kpi" style="--glow:${k.glow || ""}"><div class="lbl">${k.icon} ${k.lbl}</div><div class="val" id="kpi-${k.k}">${k.fmt(k.val)}</div><div class="d ${k.up ? "up" : "down"}">${k.up ? "▲" : "▼"} ${k.d}</div></div>`).join("");

/* ---------- Alerts / recs / sensors ---------- */
function alertHTML(a, isNew) {
  return `<div class="alert alert-${a.level}${isNew ? " new" : ""}"><div class="t">${a.title}<span>${a.time}</span></div><p>${a.body}</p></div>`;
}
function renderAlerts() {
  $("#alerts").innerHTML = DATA.alerts.map((a, i) => alertHTML(a, i === 0 && a.fresh)).join("");
  $("#alert-count").textContent = DATA.alerts.filter(a => a.level === "alert").length + " critical";
}
renderAlerts();
$("#recs").innerHTML = DATA.recommendations.map(r => `<div class="rec"><div class="ic">${r.icon}</div><div style="flex:1"><b>${r.title}</b><span class="muted">${r.impact}</span><div class="conf"><i style="width:${r.conf}%"></i></div></div><span class="muted small">${r.conf}%</span></div>`).join("");
$("#sensors").innerHTML = DATA.sensors.map((s, i) => `<div class="sensor"><span class="dot ${s.state}"></span><div><b>${s.kind}</b> <span class="muted small">${s.id} · ${s.loc}</span></div><span class="v" id="sv-${i}">${s.value}</span></div>`).join("");

/* ---------- 3D twin ---------- */
Twin.init($("#twin"), ({ kind, data }) => {
  const info = $("#twin-info");
  if (kind === "farm") {
    info.innerHTML = `<b>🌾 ${data.name}</b><span>Soil moisture: <b style="color:${data.moisture < 40 ? C.alert : data.moisture < 50 ? C.warn : C.accent}">${data.moisture}%</b></span><span>NDVI crop health: <b>${data.health.toFixed(2)}</b></span><span class="muted">${data.moisture < 40 ? "⚠️ Irrigation recommended within 4 h" : "✓ Within optimal range"}</span>`;
  } else {
    const col = { ok: C.accent, warn: C.warn, alert: C.alert }[data.status];
    info.innerHTML = `<b>${data.name}</b><span class="small" style="color:${col}">● ${data.status.toUpperCase()}</span><span class="muted">${data.info}</span>`;
  }
});
document.querySelectorAll("#layer-seg button").forEach(b => b.addEventListener("click", () => {
  document.querySelectorAll("#layer-seg button").forEach(x => x.classList.toggle("on", x === b));
  Twin.setLayer(b.dataset.layer);
}));

/* ---------- Overview mini energy chart ---------- */
const ctxE = document.getElementById("c-energy-mini").getContext("2d");
chart("c-energy-mini", {
  type: "line",
  data: { labels: HOURS, datasets: [
    { label: "Solar", data: DATA.energyGen, borderColor: C.warn, backgroundColor: grad(ctxE, C.warn), fill: true, tension: .4, pointRadius: 0, borderWidth: 2 },
    { label: "Demand", data: DATA.energyUse, borderColor: C.blue, tension: .4, pointRadius: 0, borderWidth: 2, borderDash: [4, 4] },
  ] },
  options: { interaction: { mode: "index", intersect: false }, scales: { x: { ticks: { maxTicksLimit: 6 }, grid: { display: false } } } },
});

/* ---------- Views built lazily ---------- */
const BUILD = {
  agri() {
    chart("c-yield", {
      type: "bar",
      data: { labels: DATA.crops.map(c => c.crop), datasets: [
        { label: "Last season", data: DATA.crops.map(c => c.last / c.last * 100), backgroundColor: "rgba(132,153,171,.35)", borderRadius: 6 },
        { label: "AI prediction", data: DATA.crops.map(c => +(c.predicted / c.last * 100).toFixed(1)), backgroundColor: DATA.crops.map(c => c.predicted >= c.last ? C.accent : C.alert), borderRadius: 6 },
      ] },
      options: { scales: { y: { min: 60, title: { display: true, text: "% of last season" } }, x: { grid: { display: false } } },
        plugins: { tooltip: { callbacks: { afterLabel: i => { const c = DATA.crops[i.dataIndex]; return `${i.datasetIndex ? c.predicted : c.last} ${c.unit}`; } } } } },
    });
    $("#farm-table").innerHTML = `<table><tr><th>Crop</th><th>Area</th><th>Forecast</th><th>Soil moisture</th><th>Risk</th></tr>${DATA.crops.map((c, i) => {
      const m = DATA.farms[i].moisture; const col = m < 40 ? C.alert : m < 50 ? C.warn : C.accent;
      return `<tr><td><b>${c.crop}</b></td><td>${c.area} ha</td><td>${c.predicted} ${c.unit}</td><td><div class="bar"><i style="width:${m}%;background:${col}"></i></div><span class="small muted">${m}%</span></td><td><span class="tag ${c.risk}">${c.risk}</span></td></tr>`;
    }).join("")}</table>`;
    const ctxR = document.getElementById("c-rain").getContext("2d");
    chart("c-rain", {
      type: "bar",
      data: { labels: MONTHS, datasets: [
        { type: "bar", label: "Actual", data: DATA.rainfall.map((v, i) => i < 8 ? v : null), backgroundColor: C.blue, borderRadius: 5 },
        { type: "line", label: "AI forecast", data: DATA.rainForecast, borderColor: C.purple, backgroundColor: grad(ctxR, C.purple), fill: true, tension: .4, borderDash: [5, 4] },
      ] },
      options: { scales: { x: { grid: { display: false } } } },
    });
    drawNDVI();
  },

  water() {
    const g = (lbl, v, unit, col, sub) => `<div class="card gauge"><svg viewBox="0 0 120 70"><path d="M10 64 A50 50 0 0 1 110 64" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="10" stroke-linecap="round"/><path d="M10 64 A50 50 0 0 1 110 64" fill="none" stroke="${col}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${157 * v / 100} 200"/></svg><div class="g-v">${v}${unit}</div><div class="g-l">${lbl}<br><span class="small">${sub}</span></div></div>`;
    $("#water-gauges").innerHTML = g("Overhead tank", 41, "%", C.warn, "Refill at 16:30") + g("Periya Eri lake", 63, "%", C.blue, "≈ 142 days supply") + g("Solar share", 27, "%", C.accent, "of today's demand") + g("Groundwater health", 38, "%", C.alert, "Cluster B falling");
    const ctx = document.getElementById("c-water").getContext("2d");
    chart("c-water", {
      type: "line",
      data: { labels: HOURS, datasets: [
        { label: "Predicted demand", data: DATA.waterDemand, borderColor: C.blue, backgroundColor: grad(ctx, C.blue), fill: true, tension: .4, pointRadius: 0 },
        { label: "Planned supply", data: DATA.waterSupply, borderColor: C.accent, stepped: true, pointRadius: 0, borderWidth: 2 },
      ] },
      options: { interaction: { mode: "index", intersect: false }, scales: { x: { ticks: { maxTicksLimit: 8 }, grid: { display: false } } } },
    });
    const ctx2 = document.getElementById("c-energy").getContext("2d");
    chart("c-energy", {
      type: "line",
      data: { labels: HOURS, datasets: [
        { label: "Solar generation", data: DATA.energyGen, borderColor: C.warn, backgroundColor: grad(ctx2, C.warn), fill: true, tension: .4, pointRadius: 0 },
        { label: "Consumption", data: DATA.energyUse, borderColor: C.purple, tension: .4, pointRadius: 0 },
      ] },
      options: { interaction: { mode: "index", intersect: false }, scales: { x: { ticks: { maxTicksLimit: 8 }, grid: { display: false } } } },
    });
  },

  health() {
    const H = DATA.health, E = DATA.education;
    const box = (i, l, v, s, col) => `<div class="kpi"><div class="lbl">${i} ${l}</div><div class="val" style="color:${col || "inherit"}">${v}</div><div class="d muted">${s}</div></div>`;
    $("#health-kpis").innerHTML = box("💉", "Vaccination coverage", H.vaccination + "%", "Target 95%") + box("🛏️", "PHC beds", `${H.beds.used}/${H.beds.total}`, "69% occupancy", C.warn) + box("📚", "Literacy rate", E.literacy + "%", `Digital literacy ${E.digitalLiteracy}%`) + box("🎒", "Dropout risk", E.dropouts + " students", "Flagged by ML model", C.alert);
    const ctx = document.getElementById("c-disease").getContext("2d");
    const dash = { segment: { borderDash: c => (c.p1DataIndex >= 9 ? [5, 4] : undefined) } };
    chart("c-disease", {
      type: "line",
      data: { labels: H.cases.weeks, datasets: [
        { label: "Fever", data: H.cases.fever, borderColor: C.warn, backgroundColor: grad(ctx, C.warn), fill: true, tension: .4, ...dash },
        { label: "Diarrhoea", data: H.cases.diarrhea, borderColor: C.blue, tension: .4, ...dash },
        { label: "Dengue", data: H.cases.dengue, borderColor: C.alert, tension: .4, borderWidth: 3, ...dash },
      ] },
      options: { interaction: { mode: "index", intersect: false }, scales: { x: { grid: { display: false } } } },
    });
    chart("c-attend", {
      type: "bar",
      data: { labels: MONTHS, datasets: [{ label: "Attendance %", data: E.attendance, backgroundColor: E.attendance.map(v => v < 90 ? C.warn : C.accent), borderRadius: 6 }] },
      options: { plugins: { legend: { display: false } }, scales: { y: { min: 80, max: 100 }, x: { grid: { display: false } } } },
    });
  },

  env() {
    const box = (i, l, v, s) => `<div class="kpi"><div class="lbl">${i} ${l}</div><div class="val">${v}</div><div class="d muted">${s}</div></div>`;
    $("#env-kpis").innerHTML = box("🌡️", "Temperature", "31 °C", "Feels like 35 °C") + box("🌳", "Green cover", "34%", "+2.1% since 2023 (drone)") + box("♻️", "Waste segregated", "72%", "Door-to-door collection") + box("🌫️", "CO₂ offset (solar)", "1.3 t/day", "vs. diesel baseline");
    const ctx = document.getElementById("c-aqi").getContext("2d");
    chart("c-aqi", {
      type: "line",
      data: { labels: DATA.aqi.map((_, i) => `D-${29 - i}`), datasets: [{ label: "AQI", data: DATA.aqi, borderColor: C.accent, backgroundColor: grad(ctx, C.accent), fill: true, tension: .4, pointRadius: 0 }] },
      options: { plugins: { legend: { display: false } }, scales: { x: { ticks: { maxTicksLimit: 8 }, grid: { display: false } }, y: { min: 0, max: 120 } } },
    });
    chart("c-demo", {
      type: "doughnut",
      data: { labels: DATA.demographics.map(d => d.label), datasets: [{ data: DATA.demographics.map(d => d.value), backgroundColor: [C.blue, C.accent, C.purple, C.warn, C.alert], borderWidth: 0 }] },
      options: { cutout: "65%", plugins: { legend: { position: "right" } } },
    });
  },

  risk() {
    chart("c-risk", {
      type: "radar",
      data: { labels: DATA.risks.map(r => r.name), datasets: [
        { label: "Current", data: DATA.risks.map(r => r.score), borderColor: C.alert, backgroundColor: "rgba(245,86,108,.2)", pointBackgroundColor: C.alert },
        { label: "Safe threshold", data: DATA.risks.map(() => 40), borderColor: C.accent, backgroundColor: "transparent", borderDash: [4, 4], pointRadius: 0 },
      ] },
      options: { scales: { r: { min: 0, max: 100, grid: { color: C.grid }, angleLines: { color: C.grid }, ticks: { display: false }, pointLabels: { color: "#cfe0ec", font: { size: 12 } } } } },
    });
    const col = s => (s >= 60 ? C.alert : s >= 40 ? C.warn : C.accent);
    $("#risk-list").innerHTML = DATA.risks.map(r => `<div class="risk"><b>${r.name}</b><div class="bar"><i style="width:${r.score}%;background:${col(r.score)}"></i></div><span class="s" style="color:${col(r.score)}">${r.score}${{ up: "↑", down: "↓", flat: "→" }[r.trend]}</span><p>${r.note}</p></div>`).join("");
    const sim = () => {
      const rain = +$("#sim-rain").value, lake = +$("#sim-lake").value, drain = +$("#sim-drain").value;
      $("#sim-rain-v").textContent = rain + " mm"; $("#sim-lake-v").textContent = lake + " %"; $("#sim-drain-v").textContent = drain + " %";
      const score = Math.min(100, Math.round(rain * 0.18 + Math.max(0, lake - 50) * 0.7 + drain * 0.35));
      const hh = Math.round(Math.max(0, score - 25) * 6.4);
      const [lvl, c, act] = score >= 70 ? ["SEVERE", C.alert, "Evacuate low-lying Ward 2 & 5; open relief camp at the school; release lake sluice gates."]
        : score >= 40 ? ["MODERATE", C.warn, "Pre-position pumps, clear drains, and send SMS alerts to 312 households."]
        : ["LOW", C.accent, "No action needed. Continue monitoring."];
      $("#sim-out").innerHTML = `<span class="muted small">Predicted flood risk</span><span class="lvl" style="color:${c}">${lvl} · ${score}/100</span><span>🏠 Households affected: <b>${hh}</b></span><span class="muted">${act}</span>`;
    };
    ["#sim-rain", "#sim-lake", "#sim-drain"].forEach(s => $(s).addEventListener("input", sim)); sim();
  },

  gov() {
    chart("c-griev", {
      type: "bar",
      data: { labels: DATA.grievances.map(g => g.cat), datasets: [{ data: DATA.grievances.map(g => g.n), backgroundColor: [C.blue, C.warn, C.purple, C.accent, C.alert], borderRadius: 6 }] },
      options: { indexAxis: "y", plugins: { legend: { display: false } }, scales: { y: { grid: { display: false } } } },
    });
    const schemes = [["PM-KISAN farmer support", 94], ["Jal Jeevan tap connections", 88], ["Ayushman Bharat health cards", 76], ["Old-age pension", 97], ["MGNREGA job cards", 69], ["PM Awas housing", 58]];
    $("#schemes").innerHTML = schemes.map(([n, v]) => `<div class="scheme"><div><span>${n}</span><b>${v}%</b></div><div class="bar"><i style="width:${v}%;background:linear-gradient(90deg,${C.blue},${C.accent})"></i></div></div>`).join("");
  },
};

/* ---------- NDVI heatmap (procedural "drone scan") ---------- */
function drawNDVI() {
  const cv = $("#ndvi"), W = (cv.width = cv.clientWidth * 2), H = (cv.height = 520), ctx = cv.getContext("2d");
  const img = ctx.createImageData(W, H), r = seeded(3);
  const blobs = Array.from({ length: 14 }, () => ({ x: r() * W, y: r() * H, s: 60 + r() * 160, v: r() * 2 - 1 }));
  blobs.push({ x: W * 0.72, y: H * 0.7, s: 120, v: -2.2 }, { x: W * 0.2, y: H * 0.8, s: 90, v: -1.6 });
  const ramp = [[215, 48, 31], [253, 174, 97], [166, 217, 106], [26, 152, 80]];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let v = 0.62;
    for (const b of blobs) v += b.v * 0.25 * Math.exp(-((x - b.x) ** 2 + (y - b.y) ** 2) / (b.s * b.s));
    v += (Math.sin(x / 9) * Math.sin(y / 11)) * 0.03 + (((x / 40) | 0) % 7 === 0 ? -0.08 : 0);
    v = Math.max(0, Math.min(0.999, v)) * 3;
    const i = v | 0, f = v - i, a = ramp[i], b = ramp[i + 1], p = (y * W + x) * 4;
    img.data[p] = a[0] + (b[0] - a[0]) * f; img.data[p + 1] = a[1] + (b[1] - a[1]) * f; img.data[p + 2] = a[2] + (b[2] - a[2]) * f; img.data[p + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 3; ctx.setLineDash([10, 8]); ctx.font = "600 22px Inter"; ctx.fillStyle = "#fff";
  [[W * 0.72, H * 0.7, "Pest hotspot · Plot E"], [W * 0.2, H * 0.8, "Water stress · Plot D"]].forEach(([x, y, t]) => {
    ctx.beginPath(); ctx.arc(x, y, 70, 0, Math.PI * 2); ctx.stroke(); ctx.fillText(t, x - 90, y - 84);
  });
}

/* ---------- Live simulation ---------- */
let tank = 41, solar = 212, aqi = 56;
setInterval(() => {
  tank = Math.max(20, Math.min(95, tank + (Math.random() - 0.55) * 0.8));
  solar = Math.max(150, Math.min(260, solar + (Math.random() - 0.5) * 8));
  aqi = Math.max(35, Math.min(90, aqi + (Math.random() - 0.5) * 2));
  $("#kpi-wtr").textContent = tank.toFixed(0) + "%";
  $("#kpi-pwr").textContent = solar.toFixed(0) + " kW";
  $("#kpi-aqi").textContent = "AQI " + aqi.toFixed(0);
  $("#temp").textContent = (30.5 + Math.random()).toFixed(1) + "°C";
  const i = (Math.random() * DATA.sensors.length) | 0, el = $("#sv-" + i), s = DATA.sensors[i];
  const live = { 0: () => (33 + Math.random() * 2).toFixed(0) + " %", 1: () => tank.toFixed(0) + " %", 3: () => "AQI " + aqi.toFixed(0), 5: () => solar.toFixed(0) + " kW", 7: () => "pH " + (7.3 + Math.random() * 0.2).toFixed(1) }[i];
  if (live) { el.textContent = live(); el.classList.add("tick"); setTimeout(() => el.classList.remove("tick"), 600); }
  const c = charts["c-energy-mini"]; const h = new Date().getHours();
  c.data.datasets[1].data[h] = Math.round(DATA.energyUse[h] + (Math.random() - 0.5) * 20); c.update("none");
}, 1500);

// Staged "incoming" alerts for the demo
const INCOMING = [
  { level: "warn", title: "CCTV: crowd density high at market", body: "Computer vision estimates 420 people. Suggest deploying 2 volunteers for traffic control." },
  { level: "info", title: "Drone mission #48 launched", body: "Surveying Plot E for leaf-miner spread. ETA 12 min." },
  { level: "alert", title: "Stagnant water detected — Ward 4 drain", body: "Drone image classifier (96% conf.) flagged a mosquito breeding site. Sanitation team notified." },
];
let inc = 0;
setInterval(() => {
  if (inc >= INCOMING.length) return;
  const a = { ...INCOMING[inc++], time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), fresh: true };
  DATA.alerts.forEach(x => (x.fresh = false));
  DATA.alerts.unshift(a); renderAlerts();
  const t = $("#toast"); t.innerHTML = `<b>${a.level === "alert" ? "🚨" : a.level === "warn" ? "⚠️" : "ℹ️"} ${a.title}</b>`;
  t.classList.add("show"); setTimeout(() => t.classList.remove("show"), 3800);
}, 20000);

/* ---------- AI assistant (simulated NLP) ---------- */
const body = $("#chat-body");
function say(html, who) { const d = document.createElement("div"); d.className = "msg " + who; d.innerHTML = html; body.appendChild(d); body.scrollTop = 1e9; return d; }
function ask(q) {
  say(q.replace(/</g, "&lt;"), "me");
  const t = say('<span class="typing"><span></span><span></span><span></span></span>', "bot");
  const ql = q.toLowerCase();
  const hit = ASSISTANT.find(a => a.k.some(k => ql.includes(k)));
  setTimeout(() => { t.innerHTML = hit ? hit.a : "I watch water, crops, health, energy, education, air quality, and disaster risk for Ananthapuram. Try asking <i>“Will there be a flood this month?”</i>"; body.scrollTop = 1e9; }, 900 + Math.random() * 600);
}
say("Vanakkam! 🙏 I'm the Ananthapuram Digital Twin assistant. Ask me anything about the village.", "bot");
$("#chips").innerHTML = ["Water status?", "Crop yield forecast", "Dengue risk?", "Flood risk", "Solar today"].map(c => `<button>${c}</button>`).join("");
$("#chips").addEventListener("click", e => e.target.tagName === "BUTTON" && ask(e.target.textContent));
$("#chat-f").addEventListener("submit", e => { e.preventDefault(); const v = $("#chat-in").value.trim(); if (v) { ask(v); $("#chat-in").value = ""; } });
$("#open-chat").addEventListener("click", () => $("#chat").classList.add("open"));
$("#close-chat").addEventListener("click", () => $("#chat").classList.remove("open"));
