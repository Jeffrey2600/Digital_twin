# AI Digital Twin of a Village

An interactive demo dashboard for a smart-village **digital twin**. It shows the fictional village of *Ananthapuram*, Tamil Nadu. The dashboard combines simulated AI, IoT, GIS, drone, and cloud data into one view for monitoring, prediction, and decision support.

> Everything is **simulated demo data**. No real sensors or back-end are connected.

## Run

It is a static site with no build step:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Or open `index.html` directly in a browser. Three.js and Chart.js load from a CDN.

## Modules

| View | What it shows |
|---|---|
| 🛰️ Overview | Interactive **3D village twin** (click buildings and fields, crop-health and alert layers, a survey drone), live KPIs, alerts, AI recommendations, and an IoT sensor stream |
| 🌾 Agriculture | ML crop-yield prediction, a drone NDVI scan with pest and water-stress hotspots, field status, and a rainfall forecast |
| 💧 Water & Energy | Tank, lake, and groundwater gauges, a water-demand forecast, and solar generation vs. consumption |
| 🏥 Health & Education | Disease-outbreak forecast (dengue/fever), PHC capacity, school attendance, and dropout risk |
| 🌿 Environment | AQI trend, green cover, and demographics |
| ⚠️ Disaster & Risk | Risk radar, an early-warning board, and a **what-if flood simulator** |
| 🏛️ Governance | NLP-classified citizen grievances, scheme coverage, and the system architecture |
| ✨ Ask AI | A simulated NLP assistant that answers questions about the village |

## Structure

```
index.html        layout
css/style.css     styling (dark, glassmorphism theme)
js/data.js        all demo data
js/village3d.js   Three.js 3D village scene
js/app.js         charts, live simulation, assistant
```
