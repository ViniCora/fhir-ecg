import Plot from "react-plotly.js";
import type { Layout, PlotRelayoutEvent, PlotData } from "plotly.js";
import type { ECGData } from "../../types/ECGData/ECGData";
import { coresPorTipo } from "../../types/TiposBatimentos/CoresPorTipo";
import { useState, useRef, useEffect } from "react";
import { PrimeIcons } from "primereact/api";

interface ECGRangeSliderProps {
  ecgData: ECGData;
  layoutSync: Partial<Layout>;
  onRelayout: (event: PlotRelayoutEvent) => void;
  marcacoes?: { sample: number; tipo: string }[];
  minutoAtual: number;
}

export default function ECGRangeSlider({
  ecgData,
  layoutSync,
  onRelayout,
  marcacoes,
  minutoAtual,
}: ECGRangeSliderProps) {
  const [windowStart, setWindowStart] = useState(0);
  const [animatedStart, setAnimatedStart] = useState(0);
  const windowSize = 10;
  const plotRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);

  if (!ecgData.valores || ecgData.valores.length === 0) {
    return (
      <div
        style={{
          height: "12vh",
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

  useEffect(() => {
    const range = layoutSync?.xaxis?.range;
    if (Array.isArray(range) && range.length === 2) {
      const [start] = range.map(Number);
      const newStart = Math.max(0, start);
      if (Math.abs(newStart - windowStart) > 0.01) {
        setWindowStart(newStart);
      }
    }
  }, [layoutSync?.xaxis?.range]);

  useEffect(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    const duration = 300;
    const startValue = animatedStart;
    const endValue = windowStart;
    const startTime = performance.now();

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 0.5 - Math.cos(progress * Math.PI) / 2;
      const newPos = startValue + (endValue - startValue) * eased;
      setAnimatedStart(newPos);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setAnimatedStart(endValue);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [windowStart]);

  const time = ecgData.valores.map(
    (_: number, i: number) => i * ecgData.periodSec
  );
  const totalDuration = time[time.length - 1];

  const tickInterval = 10;
  const tickVals: number[] = [];
  const tickTexts: string[] = [];
  for (let t = 0; t <= totalDuration; t += tickInterval) {
    const minutes = minutoAtual + Math.floor(t / 60);
    const seconds = Math.floor(t % 60);
    tickVals.push(t);
    tickTexts.push(`${minutes}:${seconds.toString().padStart(2, "0")}`);
  }

  const xStart = animatedStart;
  const xEnd = animatedStart + windowSize;

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
        fillcolor: "rgba(0, 102, 255, 0.25)",
        line: { color: "#0066ff", width: 2 },
        layer: "above",
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

  return (
    <div
      style={{
        height: "14vh",
        width: "100%",
        marginBottom: "7px",
        borderTop: "1px solid #d0d7de",
        backgroundColor: "#f9fafb",
        borderRadius: "8px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "6px 12px",
          backgroundColor: "#eef6ff",
          borderBottom: "1px solid #c7dbff",
          fontSize: "0.9rem",
          color: "#004085",
          fontFamily: "Inter, sans-serif",
          fontWeight: 500,
        }}
      >
        <i
          className={`pi ${PrimeIcons.INFO_CIRCLE}`}
          style={{ fontSize: "1rem", marginRight: "8px", color: "#004085" }}
        />
        <span>
          Clique em uma posição do gráfico para visualizar 10 segundos dos
          traçados acima na região selecionada.
        </span>
      </div>

      <Plot
        ref={plotRef}
        data={data}
        layout={layout}
        config={{ responsive: true, displayModeBar: false, scrollZoom: false }}
        onClick={handleClick}
        style={{ width: "100%", height: "calc(100% - 34px)" }}
      />
    </div>
  );
}
