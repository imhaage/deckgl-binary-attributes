import React, { useEffect, useState } from "react";
import DeckGL from "@deck.gl/react";
import Map from "react-map-gl";
import { BASEMAP } from "@deck.gl/carto";
import { SolidPolygonLayer } from "@deck.gl/layers";
import { COORDINATE_SYSTEM } from "deck.gl";

// Set your mapbox access token here
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// Viewport settings
const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 0,
  zoom: 2,
  pitch: 0,
  bearing: 0
};

const gridSize = 512;
const cellSize = 2;

function getRandomData() {
  let dataGrid = [];
  for (let x = 0; x < gridSize; x += cellSize) {
    for (let y = 0; y < gridSize; y += cellSize) {
      dataGrid.push({
        contour: [
          [x, y],
          [x, y + cellSize],
          [x + cellSize, y + cellSize],
          [x + cellSize, y],
          [x, y]
        ],
        color: [
          Math.floor(Math.random() * 256),
          Math.floor(Math.random() * 256),
          Math.floor(Math.random() * 256),
          150
        ],
        elevation: Math.floor(Math.random() * 256)
      });
    }
  }

  return dataGrid;
}

performance.mark("data_array_start");
const data = [];
for (let i = 0; i < 5; i++) {
  console.log(`Data index : ${i}`);
  const d = getRandomData();

  const polygons = new Float32Array(d.flatMap((d) => d.contour.flat()));

  const colors = new Uint8Array(
    d.flatMap((d) => d.contour.flatMap((_) => d.color))
  );

  const elevations = new Uint8Array(
    d.flatMap((d) => d.contour.map((_) => d.elevation))
  );

  const polygonCount = d.length;

  const startIndices = [];
  for (let index = 0; index < polygons.length; index = index + 5) {
    startIndices.push(index);
  }

  data.push({
    polygons,
    colors,
    elevations,
    polygonCount,
    startIndices
  });
}
performance.mark("data_array_end");
console.log(
  (
    performance.measure("time", "data_array_start", "data_array_end").duration /
    1000
  ).toFixed(1) + "sec"
);

export const App = () => {
  const [frame, setFrame] = useState(0);
  const [logCurrentData, setLogCurrentData] = useState(false);
  const { polygons, colors, elevations, polygonCount, startIndices } = data[
    frame
  ];

  if (logCurrentData) {
    console.log(data[frame]);
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((prev) => (prev === data.length - 1 ? 0 : prev + 1));
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div>
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={[
          new SolidPolygonLayer({
            id: "polygon-layer",
            coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
            data: {
              length: polygonCount,
              startIndices,
              attributes: {
                // size: 2 = 1 point = [x,y]
                getPolygon: {
                  value: polygons,
                  size: 2
                },
                // size: 4 = 1 color = [r, g, b, a]
                getFillColor: { value: colors, size: 4 },
                // size: 1 = elevation
                getElevation: { value: elevations, size: 1 }
              }
            },
            _normalize: false,
            filled: true,
            extruded: true,
            elevationScale: 1000
          })
        ]}
      >
        <Map
          mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
          mapStyle={BASEMAP.POSITRON}
        />
      </DeckGL>
      )
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          padding: 5,
          backgroundColor: "white",
          fontFamily: "monospace"
        }}
      >
        <div>Frame: {frame + 1}</div>
        <div>Number of polygons: {polygonCount}</div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <label htmlFor="logCurrentData">Log current frame data </label>
          <input
            id="logCurrentData"
            type="checkbox"
            checked={logCurrentData}
            onChange={() => setLogCurrentData((prev) => !prev)}
          />
        </div>
      </div>
    </div>
  );
};
