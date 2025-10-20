import Plot from "react-plotly.js";
import type { Layout, PlotRelayoutEvent, PlotData } from "plotly.js";
import type { ECGData } from "../../types/ECGData/ECGData";
import { coresPorTipo } from "../../types/TiposBatimentos/CoresPorTipo";

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
          marker: { color: coresPorTipo[m.tipo] || "black", size: 10 },
          name: m.tipo,
          text: [`${m.tipo} (${m.sample})`],
          hoverinfo: "text",
        }))
    : [];

  const time = ecgData.valores.map(
    (_: number, i: number) => i * ecgData.periodSec
  );

  const rangesliderLayout: Partial<Layout> = {
    autosize: true,
    showlegend: false,
    dragmode: "zoom",
    margin: { l: 20, r: 20, t: 10, b: 20 },
    xaxis: {
      showgrid: false,
      zeroline: false,
      showticklabels: true,
      rangeslider: {
        visible: true,
        thickness: 0.1,
        bgcolor: "#f5f5f5",
        bordercolor: "#ccc",
      },
      ...layoutSync?.xaxis,
    },
    yaxis: {
      showgrid: false,
      zeroline: false,
      showticklabels: false,
      fixedrange: true,
    },
    plot_bgcolor: "white",
    paper_bgcolor: "white",
  };

  const rangesliderData: Partial<PlotData>[] = [
    {
      x: time,
      y: ecgData.valores,
      type: "scatter",
      mode: "lines",
      line: { color: "gray", width: 1 },
    },
    ...marcacoesData,
  ];

  const handleRelayout = (event: PlotRelayoutEvent) => {
    if (
      event["xaxis.range[0]"] !== undefined &&
      event["xaxis.range[1]"] !== undefined
    ) {
      const start = event["xaxis.range[0]"] as number;
      const end = event["xaxis.range[1]"] as number;
      const desiredDuration = 10;

      const actualDuration = end - start;
      if (Math.abs(actualDuration - desiredDuration) > 1e-6) {
        const newEnd = start + desiredDuration;
        onRelayout({
          "xaxis.range[0]": start,
          "xaxis.range[1]": newEnd,
        });
      } else {
        onRelayout(event);
      }
    } else {
      onRelayout(event);
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
        data={rangesliderData}
        layout={rangesliderLayout}
        config={{
          responsive: true,
          displayModeBar: false,
          scrollZoom: false,
        }}
        onRelayout={handleRelayout}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
