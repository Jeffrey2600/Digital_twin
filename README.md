# AI Digital Twin of a Village

An interactive demo dashboard for a smart-village **digital twin**. It shows the fictional village of *Ananthapuram*, Tamil Nadu. The dashboard combines simulated AI, IoT, GIS, drone, and cloud data into one view for monitoring, prediction, and decision support.

> Everything is **simulated demo data**. No real sensors or back-end are connected.

## Run

It is a static site with no build step:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Or open `index.html` directly in a browser. Three.js and Chart.js are included in `js/lib`, so it works offline.

## Modules

| View | What it shows |
|---|---|
| Village map | Interactive **3D village twin** (click buildings and fields, crop-health and alert layers, a survey drone), live KPIs, alerts, AI recommendations, and an IoT sensor stream |
| Farms & crops | ML crop-yield prediction, a drone NDVI scan with pest and water-stress hotspots, field status, and a rainfall forecast |
| Water & power | Tank, lake, and groundwater gauges, a water-demand forecast, and solar generation vs. consumption |
| Health & schools | Disease-outbreak forecast (dengue/fever), PHC capacity, school attendance, and dropout risk |
| Environment | AQI trend, green cover, and demographics |
| Disaster readiness | Risk radar, an early-warning board, and a **what-if flood simulator** |
| Panchayat desk | NLP-classified citizen grievances, scheme coverage, and the system architecture |
| Ask the assistant | A simulated NLP assistant that answers questions about the village |

## Structure

```
index.html        layout
css/style.css     styling (light theme)
js/data.js        all demo data
js/village3d.js   Three.js 3D village scene
js/app.js         charts, live simulation, assistant
```
