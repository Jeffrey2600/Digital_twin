// Demo data for the simulated village "Ananthapuram"
// Everything in this project is simulated — no real sensors are connected.

const VILLAGE = {
  name: "Ananthapuram",
  district: "Tiruppur District, Tamil Nadu",
  population: 4862,
  households: 1134,
  area: "12.4 km²",
  lat: 11.108, lon: 77.341,
};

// Small seeded RNG so charts look the same on every load
function seeded(seed) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
const rnd = seeded(42);

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);

const DATA = {
  // Buildings and assets placed on the 3D map (x, z in a 100x100 grid)
  assets: [
    { id: "PHC",  type: "health",    name: "Primary Health Centre", x: -18, z: -12, status: "ok",   info: "38 patients today · 2 doctors on duty · 94% medicine stock" },
    { id: "SCH1", type: "school",    name: "Govt. Higher Secondary School", x: 16, z: -20, status: "ok", info: "612 students · 91% attendance · smart class active" },
    { id: "SCH2", type: "school",    name: "Panchayat Primary School", x: -30, z: 14, status: "ok", info: "184 students · 88% attendance" },
    { id: "PAN",  type: "gov",       name: "Gram Panchayat Office", x: 0, z: 0, status: "ok", info: "e-Governance kiosk · 27 grievances this week (21 resolved)" },
    { id: "TANK", type: "water",     name: "Overhead Water Tank", x: 8, z: 10, status: "warn", info: "Level 41% · refill pump scheduled 18:30" },
    { id: "LAKE", type: "lake",      name: "Periya Eri (Lake)", x: 30, z: 22, status: "ok", info: "Storage 63% · pH 7.4 · turbidity 3.1 NTU" },
    { id: "SOL",  type: "solar",     name: "Community Solar Farm", x: -32, z: -30, status: "ok", info: "Generating 212 kW · 86% efficiency" },
    { id: "MKT",  type: "market",    name: "Weekly Market & Uzhavar Sandhai", x: -8, z: 20, status: "ok", info: "Tomato ₹22/kg · Onion ₹31/kg · Banana ₹38/doz" },
    { id: "TWR",  type: "tower",     name: "Weather Station & IoT Gateway", x: 22, z: -4, status: "ok", info: "126 sensors online · uplink 4G/LoRaWAN" },
    { id: "WELL", type: "water",     name: "Borewell Cluster B", x: -22, z: 30, status: "alert", info: "Groundwater at 142 ft — dropped 6 ft in 30 days" },
  ],

  farms: [
    { name: "Plot A — Paddy",     crop: "Paddy",     x: 32, z: -32, w: 22, d: 16, moisture: 71, health: 0.86 },
    { name: "Plot B — Sugarcane", crop: "Sugarcane", x: 40, z: -8,  w: 14, d: 18, moisture: 58, health: 0.78 },
    { name: "Plot C — Banana",    crop: "Banana",    x: -40, z: 0,  w: 14, d: 22, moisture: 64, health: 0.91 },
    { name: "Plot D — Groundnut", crop: "Groundnut", x: -8, z: 40,  w: 22, d: 12, moisture: 34, health: 0.52 },
    { name: "Plot E — Tomato",    crop: "Tomato",    x: 18, z: 38,  w: 12, d: 12, moisture: 47, health: 0.69 },
  ],

  crops: [
    { crop: "Paddy",     area: 186, predicted: 5.8, last: 5.2, unit: "t/ha", risk: "Low" },
    { crop: "Sugarcane", area: 94,  predicted: 98,  last: 91,  unit: "t/ha", risk: "Low" },
    { crop: "Banana",    area: 61,  predicted: 42,  last: 44,  unit: "t/ha", risk: "Medium" },
    { crop: "Groundnut", area: 73,  predicted: 1.6, last: 2.1, unit: "t/ha", risk: "High" },
    { crop: "Tomato",    area: 38,  predicted: 31,  last: 27,  unit: "t/ha", risk: "Medium" },
  ],

  rainfall:    [8, 12, 18, 46, 72, 38, 44, 51, 88, 176, 142, 41],
  rainForecast:[null,null,null,null,null,null,null,null,88, 164, 150, 52],

  waterDemand: HOURS.map((_, h) => Math.round(60 + 90 * Math.exp(-((h - 7) ** 2) / 6) + 70 * Math.exp(-((h - 18) ** 2) / 5) + rnd() * 12)),
  waterSupply: HOURS.map((_, h) => (h >= 5 && h <= 9) || (h >= 16 && h <= 20) ? 175 : 70),

  energyGen:  HOURS.map((_, h) => Math.max(0, Math.round(260 * Math.sin(((h - 6) / 12) * Math.PI)) + (h > 6 && h < 18 ? Math.round(rnd() * 20) : 0))),
  energyUse:  HOURS.map((_, h) => Math.round(90 + 60 * Math.exp(-((h - 20) ** 2) / 8) + 40 * Math.exp(-((h - 7) ** 2) / 4) + rnd() * 15)),

  aqi: Array.from({ length: 30 }, (_, i) => Math.round(48 + 18 * Math.sin(i / 4) + rnd() * 14)),

  health: {
    cases: { weeks: ["W31","W32","W33","W34","W35","W36","W37","W38","W39","W40*","W41*","W42*"],
      fever:   [12, 14, 13, 18, 22, 27, 31, 36, 41, 47, 52, 49],
      diarrhea:[6, 5, 7, 6, 8, 9, 8, 10, 12, 14, 13, 11],
      dengue:  [0, 0, 1, 1, 2, 2, 4, 5, 7, 9, 11, 10] },
    vaccination: 92,
    anc: 97,
    beds: { used: 11, total: 16 },
  },

  education: {
    attendance: [93, 91, 90, 92, 89, 94, 91, 88, 90, 92, 91, 93],
    literacy: 81.4,
    digitalLiteracy: 58,
    dropouts: 7,
  },

  demographics: [
    { label: "0–14",  value: 1102 },
    { label: "15–29", value: 1284 },
    { label: "30–44", value: 1041 },
    { label: "45–59", value: 832 },
    { label: "60+",   value: 603 },
  ],

  risks: [
    { name: "Flood",        score: 34, trend: "up",   note: "NE monsoon onset expected in 9 days; Periya Eri at 63%." },
    { name: "Drought",      score: 58, trend: "up",   note: "Groundwater falling 0.2 ft/day in cluster B." },
    { name: "Heatwave",     score: 22, trend: "down", note: "Max temps easing to 33 °C this week." },
    { name: "Disease",      score: 66, trend: "up",   note: "Dengue cases rising; stagnant water in ward 4." },
    { name: "Crop pest",    score: 47, trend: "flat", note: "Leaf-miner signs detected by drone on Plot E." },
  ],

  alerts: [
    { level: "alert", time: "08:42", title: "Borewell Cluster B — water table falling", body: "Level fell 6 ft in 30 days. Rotate pumping between clusters and move Plot D to drip irrigation." },
    { level: "alert", time: "07:15", title: "Dengue cases rising in Ward 4", body: "11 cases expected by week 41 if nothing changes. Fogging team needed." },
    { level: "warn",  time: "06:50", title: "Groundnut field (Plot D) is dry", body: "Moisture 34% (target 55%). Irrigate 22 mm before 10:00 to avoid 18% yield loss." },
    { level: "warn",  time: "05:30", title: "Overhead tank below 45%", body: "Evening demand peak 18:00–20:00. Refill pump auto-scheduled 16:30." },
    { level: "info",  time: "Yesterday", title: "Drone survey completed", body: "412 ha scanned. Crop health map updated. Possible pest damage in 3 spots on Plot E." },
    { level: "ok",    time: "Yesterday", title: "Solar farm: best day this month", body: "1.84 MWh generated — 27% of the village's daily demand." },
  ],

  recommendations: [
    { title: "Move Plot D (groundnut) to drip irrigation", impact: "Saves about 1.2 ML of water a month", who: "Agri. officer" },
    { title: "Fogging and larvicide in Wards 3 and 4", impact: "Could cut expected dengue cases by ~40%", who: "PHC / Sanitation" },
    { title: "Harvest paddy between 18–24 Oct", impact: "Before heavy monsoon rain flattens the crop", who: "Farmers' group" },
    { title: "Run water pumps 11 am–2 pm on solar power", impact: "Saves about ₹18,400 a month on the EB bill", who: "Water committee" },
    { title: "Clear the Ward 2 culvert before the monsoon", impact: "86 houses flooded there last year", who: "Ward member" },
  ],

  sensors: [
    { id: "SM-014", kind: "Soil moisture", loc: "Plot D", value: "34 %",  state: "warn" },
    { id: "WL-002", kind: "Water level",   loc: "Tank",   value: "41 %",  state: "warn" },
    { id: "GW-007", kind: "Groundwater",   loc: "Cluster B", value: "142 ft", state: "alert" },
    { id: "AQ-001", kind: "Air quality",   loc: "Panchayat", value: "AQI 56", state: "ok" },
    { id: "WS-001", kind: "Weather",       loc: "Tower",  value: "31 °C · 68%", state: "ok" },
    { id: "EM-021", kind: "Energy meter",  loc: "Solar farm", value: "212 kW", state: "ok" },
    { id: "CC-004", kind: "Market camera",     loc: "Market", value: "Crowd: normal", state: "ok" },
    { id: "WQ-003", kind: "Water quality", loc: "Periya Eri", value: "pH 7.4", state: "ok" },
  ],

  grievances: [
    { cat: "Water supply", n: 9 }, { cat: "Street lights", n: 6 }, { cat: "Roads", n: 5 },
    { cat: "Pension", n: 4 }, { cat: "Sanitation", n: 3 },
  ],
};

// Canned answers for the simulated NLP assistant
const ASSISTANT = [
  { k: ["water", "tank", "groundwater", "borewell"], a: "Overhead tank is at <b>41%</b>; the evening peak (18:00–20:00) needs ~175 kL/h. Borewell Cluster B has dropped <b>6 ft in 30 days</b>. Rotating pumping across clusters A and C and moving Plot D to drip irrigation would save about <b>1.2 ML/month</b>." },
  { k: ["crop", "yield", "paddy", "harvest", "farm", "agri"], a: "Yield forecast: Paddy <b>5.8 t/ha</b> (+11.5%), Sugarcane <b>98 t/ha</b>, Groundnut <b>1.6 t/ha</b> (−24%, moisture stress). Best paddy harvest window: <b>Oct 18–24</b>, before heavy NE-monsoon rain." },
  { k: ["disease", "dengue", "health", "fever", "hospital"], a: "Fever cases are up <b>3.4×</b> over 8 weeks; dengue risk in ward 4 is <b>HIGH (66/100)</b>. The model predicts ~11 dengue cases by W41 unless we act. PHC bed occupancy is 11/16. Suggested: fogging + larvicide in wards 3–4 and a door-to-door fever survey." },
  { k: ["flood", "rain", "monsoon", "disaster", "weather"], a: "NE monsoon onset expected in <b>~9 days</b>. October rain forecast: <b>164 mm</b>. Flood risk is <b>34/100</b> and rising. Periya Eri is at 63% — safe, but clear the Ward 2 culvert before onset." },
  { k: ["energy", "solar", "power", "electric"], a: "The solar farm is producing <b>212 kW</b> right now (86% efficiency). Today's forecast: <b>1.8 MWh</b>, about 27% of demand. Moving pumping to 11:00–14:00 would save about <b>₹18,400/month</b>." },
  { k: ["school", "education", "student", "literacy"], a: "Average attendance is <b>91%</b> across 2 schools (796 students). Literacy: 81.4%, digital literacy: 58%. 7 at-risk students were flagged for dropout counselling." },
  { k: ["air", "aqi", "pollution", "environment"], a: "AQI is <b>56 (Satisfactory)</b>. The 30-day average is 55. No burning events were detected by CCTV/CV this week." },
  { k: ["population", "people", "household", "census"], a: "Ananthapuram: <b>4,862</b> residents in <b>1,134</b> households. 603 senior citizens (60+) — 97% are enrolled in pension schemes." },
];
