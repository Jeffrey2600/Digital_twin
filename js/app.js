const $ = s => document.querySelector(s);
const C = { accent: "#2e7a53", blue: "#2d6690", warn: "#c7861a", alert: "#b8412f", purple: "#b5623a", muted: "#6b7068", grey: "#c9c3b6", grid: "#ece6da" };

Chart.defaults.color = C.muted;
Chart.defaults.font.family = "IBM Plex Sans, system-ui, sans-serif";
Chart.defaults.borderColor = C.grid;
Chart.defaults.plugins.legend.labels.boxWidth = 10;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.maintainAspectRatio = false;

const grad = (ctx, color) => {
  const g = ctx.createLinearGradient(0, 0, 0, 260);
  g.addColorStop(0, color + "30"); g.addColorStop(1, color + "00"); return g;
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
const syncTime = () => ($("#clock").textContent = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
syncTime(); setInterval(syncTime, 30000);

/* ---------- Navigation ---------- */
const built = {};
document.querySelectorAll(".nav").forEach(n => n.addEventListener("click", () => {
  document.querySelectorAll(".nav").forEach(x => x.classList.toggle("active", x === n));
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === "view-" + n.dataset.view));
  $("#page-title").textContent = n.textContent.trim();
  if (!built[n.dataset.view]) { built[n.dataset.view] = true; BUILD[n.dataset.view]?.(); }
  window.scrollTo({ top: 0, behavior: "smooth" });
}));

/* ---------- KPIs ---------- */
const kpis = [
  { k: "pop",  lbl: "Residents",       val: "4,862",   d: "1,134 households" },
  { k: "yld",  lbl: "Crop health",     val: "78 / 100", d: "up 6 from last month", c: "good" },
  { k: "wtr",  lbl: "Overhead tank",   val: "41%",     d: "refill starts 4:30 pm", c: "bad" },
  { k: "pwr",  lbl: "Solar right now", val: "212 kW",  d: "27% of today's use" },
  { k: "aqi",  lbl: "Air quality",     val: "AQI 56",  d: "satisfactory", c: "good" },
  { k: "risk", lbl: "Open alerts",     val: "2 urgent", d: "4 to look at", c: "bad" },
];
$("#kpis").innerHTML = kpis.map(k => `<div class="kpi"><div class="lbl">${k.lbl}</div><div class="val" id="kpi-${k.k}">${k.val}</div><div class="d ${k.c || ""}">${k.d}</div></div>`).join("");
/* ---------- Alerts / recs / sensors ---------- */
function alertHTML(a, isNew) {
  return `<div class="alert alert-${a.level}${isNew ? " new" : ""}"><div class="t">${a.title}<span>${a.time}</span></div><p>${a.body}</p></div>`;
}
function renderAlerts() {
  $("#alerts").innerHTML = DATA.alerts.map((a, i) => alertHTML(a, i === 0 && a.fresh)).join("");
  $("#alert-count").textContent = DATA.alerts.filter(a => a.level === "alert").length + " urgent";
}
renderAlerts();
$("#recs").innerHTML = DATA.recommendations.map(r => `<label class="rec"><input type="checkbox"><div><b>${r.title}</b><span class="muted">${r.impact}</span><div class="small muted">Assign: ${r.who}</div></div></label>`).join("");
$("#recs").addEventListener("change", e => e.target.closest(".rec").classList.toggle("done", e.target.checked));
$("#sensors").innerHTML = DATA.sensors.map((s, i) => `<div class="sensor"><span class="dot ${s.state}"></span><div><b>${s.kind}</b> <span class="muted small">${s.id} · ${s.loc}</span></div><span class="v" id="sv-${i}">${s.value}</span></div>`).join("");

/* ---------- 3D twin ---------- */
Twin.init($("#twin"), ({ kind, data }) => {
  const info = $("#twin-info");
  if (kind === "farm") {
    info.innerHTML = `<b>${data.name}</b><span>Soil moisture: <b style="color:${data.moisture < 40 ? C.alert : data.moisture < 50 ? C.warn : C.accent}">${data.moisture}%</b></span><span>Crop health (NDVI): <b>${data.health.toFixed(2)}</b></span><span class="muted">${data.moisture < 40 ? "Needs water within the next 4 hours." : "Moisture is fine."}</span>`;
  } else {
    const col = { ok: C.accent, warn: C.warn, alert: C.alert }[data.status];
    info.innerHTML = `<b>${data.name}</b><span class="small" style="color:${col}">${{ ok: "Normal", warn: "Needs attention", alert: "Act now" }[data.status]}</span><span class="muted">${data.info}</span>`;
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
    { label: "Village use", data: DATA.energyUse, borderColor: C.blue, tension: .4, pointRadius: 0, borderWidth: 2, borderDash: [4, 4] },
  ] },
  options: { interaction: { mode: "index", intersect: false }, scales: { x: { ticks: { maxTicksLimit: 6 }, grid: { display: false } } } },
});

/* ---------- Views built lazily ---------- */
const BUILD = {
  agri() {
    chart("c-yield", {
      type: "bar",
      data: { labels: DATA.crops.map(c => c.crop), datasets: [
        { label: "Last season", data: DATA.crops.map(c => c.last / c.last * 100), backgroundColor: C.grey, borderRadius: 6 },
        { label: "This season (expected)", data: DATA.crops.map(c => +(c.predicted / c.last * 100).toFixed(1)), backgroundColor: DATA.crops.map(c => c.predicted >= c.last ? C.accent : C.alert), borderRadius: 6 },
      ] },
      options: { scales: { y: { min: 60, title: { display: true, text: "last season = 100" } }, x: { grid: { display: false } } },
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
        { type: "line", label: "Forecast", data: DATA.rainForecast, borderColor: C.purple, backgroundColor: grad(ctxR, C.purple), fill: true, tension: .4, borderDash: [5, 4] },
      ] },
      options: { scales: { x: { grid: { display: false } } } },
    });
    drawNDVI();
  },

  water() {
    const g = (lbl, v, col, sub) => `<div class="card level"><span class="muted">${lbl}</span><span class="big">${v}%</span><div class="tank"><i style="width:${v}%;background:${col}"></i></div><span class="small muted">${sub}</span></div>`;
    $("#water-gauges").innerHTML = g("Overhead tank", 41, C.warn, "Refill pump starts 4:30 pm") + g("Periya Eri lake", 63, C.blue, "Enough for about 142 days") + g("Power from solar", 27, C.accent, "Share of today's use") + g("Groundwater, Cluster B", 38, C.alert, "Down 6 ft in 30 days");
    const ctx = document.getElementById("c-water").getContext("2d");
    chart("c-water", {
      type: "line",
      data: { labels: HOURS, datasets: [
        { label: "Expected use", data: DATA.waterDemand, borderColor: C.blue, backgroundColor: grad(ctx, C.blue), fill: true, tension: .4, pointRadius: 0 },
        { label: "Pumping schedule", data: DATA.waterSupply, borderColor: C.accent, stepped: true, pointRadius: 0, borderWidth: 2 },
      ] },
      options: { interaction: { mode: "index", intersect: false }, scales: { x: { ticks: { maxTicksLimit: 8 }, grid: { display: false } } } },
    });
    const ctx2 = document.getElementById("c-energy").getContext("2d");
    chart("c-energy", {
      type: "line",
      data: { labels: HOURS, datasets: [
        { label: "Solar farm", data: DATA.energyGen, borderColor: C.warn, backgroundColor: grad(ctx2, C.warn), fill: true, tension: .4, pointRadius: 0 },
        { label: "Village use", data: DATA.energyUse, borderColor: C.purple, tension: .4, pointRadius: 0 },
      ] },
      options: { interaction: { mode: "index", intersect: false }, scales: { x: { ticks: { maxTicksLimit: 8 }, grid: { display: false } } } },
    });
  },

  health() {
    const H = DATA.health, E = DATA.education;
    const box = (i, l, v, s, col) => `<div class="kpi"><div class="lbl">${l}</div><div class="val" style="color:${col || "inherit"}">${v}</div><div class="d muted">${s}</div></div>`;
    $("#health-kpis").innerHTML = box("", "Vaccination coverage", H.vaccination + "%", "target is 95%") + box("", "PHC beds", `${H.beds.used}/${H.beds.total}`, "beds in use at the PHC", C.warn) + box("", "Literacy rate", E.literacy + "%", `Digital literacy ${E.digitalLiteracy}%`) + box("", "Dropout risk", E.dropouts + " students", "need a follow-up visit", C.alert);
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
    const box = (i, l, v, s) => `<div class="kpi"><div class="lbl">${l}</div><div class="val">${v}</div><div class="d muted">${s}</div></div>`;
    $("#env-kpis").innerHTML = box("", "Temperature", "31 °C", "Feels like 35 °C") + box("", "Green cover", "34%", "up 2.1% since 2023") + box("", "Waste segregated", "72%", "Door-to-door collection") + box("", "CO₂ saved by solar", "1.3 t/day", "compared with diesel pumps");
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
        { label: "Now", data: DATA.risks.map(r => r.score), borderColor: C.alert, backgroundColor: "rgba(184,65,47,.12)", pointBackgroundColor: C.alert },
        { label: "Safe limit", data: DATA.risks.map(() => 40), borderColor: C.accent, backgroundColor: "transparent", borderDash: [4, 4], pointRadius: 0 },
      ] },
      options: { scales: { r: { min: 0, max: 100, grid: { color: C.grid }, angleLines: { color: C.grid }, ticks: { display: false }, pointLabels: { color: "#1f2922", font: { size: 12 } } } } },
    });
    const col = s => (s >= 60 ? C.alert : s >= 40 ? C.warn : C.accent);
    $("#risk-list").innerHTML = DATA.risks.map(r => `<div class="risk"><b>${r.name}</b><div class="bar"><i style="width:${r.score}%;background:${col(r.score)}"></i></div><span class="s" style="color:${col(r.score)}">${r.score}${{ up: "↑", down: "↓", flat: "→" }[r.trend]}</span><p>${r.note}</p></div>`).join("");
    const sim = () => {
      const rain = +$("#sim-rain").value, lake = +$("#sim-lake").value, drain = +$("#sim-drain").value;
      $("#sim-rain-v").textContent = rain + " mm"; $("#sim-lake-v").textContent = lake + " %"; $("#sim-drain-v").textContent = drain + " %";
      const score = Math.min(100, Math.round(rain * 0.18 + Math.max(0, lake - 50) * 0.7 + drain * 0.35));
      const hh = Math.round(Math.max(0, score - 25) * 6.4);
      const [lvl, c, act] = score >= 70 ? ["SEVERE", C.alert, "Move families out of low-lying Wards 2 and 5, open the relief camp at the school, and open the lake sluice gates."]
        : score >= 40 ? ["MODERATE", C.warn, "Keep pumps ready, clear the drains, and send an SMS warning to 312 households."]
        : ["LOW", C.accent, "Nothing to do yet. Keep watching the rain forecast."];
      $("#sim-out").style.setProperty("--c", c);
      $("#sim-out").innerHTML = `<span class="muted small">Flood risk</span><span class="lvl" style="color:${c}">${lvl[0] + lvl.slice(1).toLowerCase()} — ${score}/100</span><span>Houses likely to be affected: <b>${hh}</b></span><span class="muted">${act}</span>`;
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
    $("#schemes").innerHTML = schemes.map(([n, v]) => `<div class="scheme"><div><span>${n}</span><b>${v}%</b></div><div class="bar"><i style="width:${v}%;background:${C.accent}"></i></div></div>`).join("");
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
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.setLineDash([10, 8]); ctx.font = "600 22px IBM Plex Sans, sans-serif"; ctx.fillStyle = "#fff";
  [[W * 0.72, H * 0.7, "Possible pests — Plot E"], [W * 0.2, H * 0.8, "Too dry — Plot D"]].forEach(([x, y, t]) => {
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
  $("#temp").textContent = Math.round(30.6 + Math.random()) + "°C";
  const i = (Math.random() * DATA.sensors.length) | 0, el = $("#sv-" + i), s = DATA.sensors[i];
  const live = { 0: () => (33 + Math.random() * 2).toFixed(0) + " %", 1: () => tank.toFixed(0) + " %", 3: () => "AQI " + aqi.toFixed(0), 5: () => solar.toFixed(0) + " kW", 7: () => "pH " + (7.3 + Math.random() * 0.2).toFixed(1) }[i];
  if (live) { el.textContent = live(); el.classList.add("tick"); setTimeout(() => el.classList.remove("tick"), 600); }
  const c = charts["c-energy-mini"]; const h = new Date().getHours();
  c.data.datasets[1].data[h] = Math.round(DATA.energyUse[h] + (Math.random() - 0.5) * 20); c.update("none");
}, 1500);

// Staged "incoming" alerts for the demo
const INCOMING = [
  { level: "warn", title: "Market is crowded", body: "Camera count is about 420 people. Two volunteers could help with traffic." },
  { level: "info", title: "Drone flight #48 started", body: "Checking Plot E for leaf-miner spread. Back in about 12 minutes." },
  { level: "alert", title: "Standing water in the Ward 4 drain", body: "Spotted in drone photos. Likely mosquito breeding site; sanitation team informed." },
];
let inc = 0;
setInterval(() => {
  if (inc >= INCOMING.length) return;
  const a = { ...INCOMING[inc++], time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), fresh: true };
  DATA.alerts.forEach(x => (x.fresh = false));
  DATA.alerts.unshift(a); renderAlerts();
  const t = $("#toast"); t.style.setProperty("--c", { alert: C.alert, warn: C.warn, info: C.blue }[a.level]);
  t.innerHTML = `<b>${a.title}</b><div class="muted small">New alert · ${a.time}</div>`;
  t.classList.add("show"); setTimeout(() => t.classList.remove("show"), 3800);
}, 20000);

/* ---------- AI assistant (simulated NLP) ---------- */
const body = $("#chat-body");
function say(html, who) { const d = document.createElement("div"); d.className = "msg " + who; d.innerHTML = html; body.appendChild(d); body.scrollTop = 1e9; return d; }
function ask(q) {
  say(q.replace(/</g, "&lt;"), "me");
  const t = say('<span class="typing">looking it up…</span>', "bot");
  const ql = q.toLowerCase();
  const hit = ASSISTANT.find(a => a.k.some(k => ql.includes(k)));
  setTimeout(() => { t.innerHTML = hit ? hit.a : "Sorry, I don't have data on that. I can answer questions about water, crops, health, power, schools, air quality and flood risk."; body.scrollTop = 1e9; }, 900 + Math.random() * 600);
}
say("Vanakkam. Ask me about the village — water, crops, health, power or flood risk.", "bot");
$("#chips").innerHTML = ["Tank level", "Crop yield", "Dengue cases", "Flood risk", "Solar today"].map(c => `<button>${c}</button>`).join("");
$("#chips").addEventListener("click", e => e.target.tagName === "BUTTON" && ask(e.target.textContent));
$("#chat-f").addEventListener("submit", e => { e.preventDefault(); const v = $("#chat-in").value.trim(); if (v) { ask(v); $("#chat-in").value = ""; } });
$("#open-chat").addEventListener("click", () => $("#chat").classList.add("open"));
$("#close-chat").addEventListener("click", () => $("#chat").classList.remove("open"));
