import React, { useEffect, useRef, useState } from "react";
import DeckGL from "@deck.gl/react";
import Map from "react-map-gl";
import { BASEMAP } from "@deck.gl/carto";
import { SolidPolygonLayer } from "@deck.gl/layers";
import { COORDINATE_SYSTEM } from "deck.gl";
import { motion } from "framer-motion";

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

// gridSize = 512 = deckgl cartesian coordinates
function getRandomData(gridSize = 512, cellSize = 2) {
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

function getGrids() {
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
    for (let index = 0; index < polygons.length / 2; index += 5) {
      startIndices.push(index);
    }

    data.push({
      data: d,
      polygons,
      colors,
      elevations,
      polygonCount,
      startIndices: new Uint32Array(startIndices)
    });
  }
  performance.mark("data_array_end");
  console.log(
    "Data generation duration : " +
      (
        performance.measure("time", "data_array_start", "data_array_end")
          .duration / 1000
      ).toFixed(1) +
      "sec"
  );

  return data;
}

const data = getGrids();

export const App = () => {
  const [frame, setFrame] = useState(0);
  const [logCurrentData, setLogCurrentData] = useState(false);
  const [isBinaryDataEnabled, setIsBinaryDataEnabled] = useState(true);
  const { polygons, colors, elevations, polygonCount, startIndices } = data[
    frame
  ];
  const animationRef = useRef();

  if (logCurrentData) {
    console.log(data[frame]);
  }

  useEffect(() => {
    let lastTime = 0;
    function playAnimation(time) {
      if (time - lastTime > 1000) {
        setFrame((prev) => (prev === data.length - 1 ? 0 : prev + 1));
        lastTime = time;
      }

      requestAnimationFrame(playAnimation);
    }

    animationRef.current = requestAnimationFrame(playAnimation);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div>
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={[
          isBinaryDataEnabled
            ? new SolidPolygonLayer({
                id: "solid-polygon-layer-binary",
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
            : new SolidPolygonLayer({
                id: "solid-polygon-layer",
                coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
                data: data[frame].data,
                getPolygon: (d) => d.contour,
                getFillColor: (d) => d.color,
                getElevation: (d) => d.elevation,
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
          padding: 10,
          backgroundColor: "white",
          fontFamily: "monospace"
        }}
      >
        <div>Frame: {frame + 1}</div>

        <div>Number of polygons: {polygonCount}</div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <input
            id="binary-attributes"
            type="checkbox"
            checked={isBinaryDataEnabled}
            onChange={() => setIsBinaryDataEnabled((prev) => !prev)}
          />
          <label htmlFor="binary-attributes">Supply binary attributes </label>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <input
            id="log-current-data"
            type="checkbox"
            checked={logCurrentData}
            onChange={() => setLogCurrentData((prev) => !prev)}
          />
          <label htmlFor="log-current-data">Log current frame data </label>
        </div>
      </div>
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          padding: 10,
          backgroundColor: "white"
        }}
      >
        <motion.div
          style={{ width: 100, height: 100, backgroundColor: "red" }}
          animate={{
            scale: [1, 0.2, 0.8, 0.5, 1],
            rotate: [0, 0, 270, 270, 0],
            borderRadius: ["20%", "20%", "50%", "50%", "20%"]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </div>
    </div>
  );
};
