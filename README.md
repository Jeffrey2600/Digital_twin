# AI Digital Twin of a Village

An interactive dashboard for a smart-village **digital twin**. It shows the sample village of *Ananthapuram*, Tamil Nadu. It brings farm, water, health, environment and disaster information together on a 3D village model, with forecasts and suggested actions.

> All readings are sample data for demonstration. No real sensors are connected.

## How to run (no installation needed)

1. On this GitHub page, click the green **Code** button, then **Download ZIP**.
2. Unzip the downloaded file.
3. Open the unzipped folder and double-click **`index.html`**.

The dashboard opens in your web browser. Chrome, Edge, Firefox and Safari all work.

- You don't need to install anything: no Python, Node.js or other setup.
- It works without internet. Only the fonts need a connection; offline, the browser uses its standard font.
- If the 3D village looks blank, make sure hardware acceleration is turned on in your browser settings.

## What to try

- **Village map**: drag the 3D village to turn it and scroll to zoom. Click any building or field to see its details. Switch between *Map*, *Crop health* and *Dry fields*.
- **Farms & crops**: expected yield, the drone crop-health survey, and the rainfall forecast.
- **Water & power**: tank, lake and groundwater levels, and solar power compared with village use.
- **Health & schools**: case trends at the health centre and school attendance.
- **Environment**: air quality and residents by age.
- **Disaster readiness**: risk levels and a **flood check** with sliders.
- **Panchayat desk**: citizen complaints, scheme coverage, and how the data flows.
- **Ask the assistant** (top right): ask about water, crops, dengue, floods or solar power.
- Keep the page open for a minute to see new alerts arrive.

## For developers

It is a plain HTML/CSS/JavaScript site with no build step. Three.js and Chart.js are included in `js/lib`.

```
index.html        page layout
css/style.css     styling
js/data.js        all sample data (edit here to change numbers or the village name)
js/village3d.js   3D village model (Three.js)
js/app.js         charts, live updates and the assistant
js/lib/           bundled libraries
```
