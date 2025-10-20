import Plot from "react-plotly.js";
import type { Layout, PlotRelayoutEvent, PlotData } from "plotly.js";
import type { ECGData } from "../../types/ECGData/ECGData";
import { coresPorTipo } from "../../types/TiposBatimentos/CoresPorTipo";
import { useState, useRef } from "react";

interface ECGRangeSliderProps {
  ecgData: ECGData;
  layoutSync: Partial<Layout>;
  onRelayout: (event: PlotRelayoutEvent) => void;
  marcacoes?: { sample: number; tipo: string }[];
}

export default function ECGRangeSlider({
  ecgData,
  layoutSync,
  onRelayout,
  marcacoes,
}: ECGRangeSliderProps) {
  const [windowStart, setWindowStart] = useState(0);
  const windowSize = 10;
  const plotRef = useRef<any>(null);

  if (!ecgData.valores || ecgData.valores.length === 0) {
    return (
      <div
        style={{
          height: "10vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderTop: "1px solid #ccc",
          backgroundColor: "white",
        }}
      >
        Carregando dados de navegação...
      </div>
    );
  }

  const marcacoesData: Partial<PlotData>[] = marcacoes
    ? marcacoes
        .filter((m) => m.sample < ecgData.valores.length)
        .map((m) => ({
          x: [m.sample * ecgData.periodSec],
          y: [ecgData.valores[m.sample]],
          type: "scatter",
          mode: "markers",
          marker: { color: coresPorTipo[m.tipo] || "black", size: 8 },
          name: m.tipo,
          text: [`${m.tipo} (${m.sample})`],
          hoverinfo: "text",
        }))
    : [];

  const time = ecgData.valores.map(
    (_: number, i: number) => i * ecgData.periodSec
  );
  const totalDuration = time[time.length - 1];

  const tickInterval = 10;
  const tickVals = [];
  const tickTexts = [];

  for (let t = 0; t <= totalDuration; t += tickInterval) {
    tickVals.push(t);
    const minutes = Math.floor(t / 60);
    const seconds = Math.floor(t % 60);
    tickTexts.push(`${minutes}:${seconds.toString().padStart(2, "0")}`);
  }

  const xStart = windowStart;
  const xEnd = windowStart + windowSize;

  const layout: Partial<Layout> = {
    autosize: true,
    showlegend: false,
    margin: { l: 20, r: 20, t: 10, b: 20 },
    dragmode: false,
    xaxis: {
      showgrid: false,
      zeroline: false,
      showticklabels: true,
      range: [0, totalDuration],
      fixedrange: true,
      tickvals: tickVals,
      ticktext: tickTexts,
      ...layoutSync?.xaxis,
    },
    yaxis: {
      showgrid: false,
      zeroline: false,
      showticklabels: false,
      fixedrange: true,
    },
    shapes: [
      {
        type: "rect",
        xref: "x",
        yref: "paper",
        x0: xStart,
        x1: xEnd,
        y0: 0,
        y1: 1,
        fillcolor: "rgba(0, 102, 255, 0.3)",
        line: { color: "#0066ff", width: 2 },
      },
    ],
    plot_bgcolor: "white",
    paper_bgcolor: "white",
  };

  const data: Partial<PlotData>[] = [
    {
      x: time,
      y: ecgData.valores,
      type: "scatter",
      mode: "lines",
      line: { color: "gray", width: 1 },
      name: "ECG",
    },
    ...marcacoesData,
  ];

  const handleClick = (event: any) => {
    const xValue = event.points?.[0]?.x;
    if (xValue !== undefined) {
      let newStart = xValue - windowSize / 2;

      if (newStart < 0) newStart = 0;
      if (newStart + windowSize > totalDuration)
        newStart = totalDuration - windowSize;

      setWindowStart(newStart);
      onRelayout({
        "xaxis.range[0]": newStart,
        "xaxis.range[1]": newStart + windowSize,
      });
    }
  };

  const handleRelayout = (event: any) => {
    // Impede o Plotly de mudar o zoom ou range
    if (
      event["xaxis.range[0]"] !== undefined ||
      event["xaxis.range[1]"] !== undefined
    ) {
      const plot = plotRef.current;
      if (plot) {
        plot.relayout({
          "xaxis.range": [0, totalDuration],
        });
      }
    }
  };

  return (
    <div
      style={{
        height: "12vh",
        width: "100%",
        marginBottom: "7px",
        borderTop: "1px solid #ccc",
        backgroundColor: "white",
      }}
    >
      <Plot
        ref={plotRef}
        data={data}
        layout={{
          ...layout,
          xaxis: {
            ...layout.xaxis,
            range: [0, totalDuration],
            autorange: false,
            fixedrange: true,
          },
          yaxis: {
            ...layout.yaxis,
            autorange: true,
            fixedrange: true,
          },
        }}
        config={{
          responsive: true,
          displayModeBar: false,
          scrollZoom: false,
        }}
        onClick={handleClick}
        onRelayout={(event) => {
          const plot = plotRef.current;
          if (!plot) return;

          const changedRange =
            event["xaxis.range[0]"] !== undefined ||
            event["xaxis.range[1]"] !== undefined;

          if (changedRange) {
            plot.relayout({
              "xaxis.range": [0, totalDuration],
            });
          }
        }}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
