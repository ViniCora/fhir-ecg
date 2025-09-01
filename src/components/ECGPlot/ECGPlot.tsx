import Plot from "react-plotly.js";
import type {
  Layout,
  PlotRelayoutEvent,
  Datum,
  PlotHoverEvent,
  Shape,
  Data as PlotData,
  PlotMouseEvent,
  Annotations
} from "plotly.js";

interface ECGPlotProps {
  data: number[];
  samplingRate: number;
  maxHeight?: number;
  layoutSync?: Partial<Layout>;
  onRelayout?: (event: PlotRelayoutEvent) => void;
  cursorX?: Datum | null;
  onHover?: (event: PlotHoverEvent) => void;
  onUnhover?: (event: PlotMouseEvent) => void;
  onClick?: (event: PlotMouseEvent) => void;
  extraShapes?: Partial<Shape>[];
  extraAnnotations?: Partial<Annotations>[];
}

export default function ECGPlot({
  data,
  samplingRate,
  maxHeight,
  layoutSync,
  onRelayout,
  cursorX,
  onHover,
  onUnhover,
  onClick,
  extraShapes = [],
  extraAnnotations = [],
}: ECGPlotProps) {
  if (!data || data.length === 0) return <div>Carregando...</div>;

  const gain = 200;
  const dataVoltagem = data.map((valor) => valor / gain);
  const time = data.map((_, i) => i / samplingRate);

  const yMin = Math.min(...dataVoltagem);
  const yMax = Math.max(...dataVoltagem);
  const xMin = Math.min(...time);
  const xMax = Math.max(...time);
  const margem = (yMax - yMin) * 0.1;
  const margemYShape = (yMax - yMin) * 2;
  const margemXShape = (xMin - xMax) * 2;

  const rangeX = [xMin, xMax];
  const rangeY = [yMin - margem, yMax + margem];

  function gerarLinhasVerticaisGrossas(
    rangeX: number[],
    rangeY: number[]
  ): Partial<Shape>[] {
    const shapes: Partial<Shape>[] = [];
    for (let x = Math.ceil(rangeX[0] / 0.2) * 0.2; x <= rangeX[1]; x += 0.2) {
      shapes.push({
        type: "line",
        x0: x,
        y0: rangeY[0],
        x1: x,
        y1: rangeY[1],
        line: { color: "#eb2020ff", width: 3 },
        layer: "below",
      });
    }
    return shapes;
  }

  function gerarLinhasHorizontaisGrossas(
    rangeX: number[],
    rangeY: number[]
  ): Partial<Shape>[] {
    const shapes: Partial<Shape>[] = [];
    for (let y = Math.ceil(rangeY[0] / 0.5) * 0.5; y <= rangeY[1]; y += 0.5) {
      shapes.push({
        type: "line",
        x0: rangeX[0],
        y0: y,
        x1: rangeX[1],
        y1: y,
        line: { color: "#eb2020ff", width: 3 },
        layer: "below",
      });
    }
    return shapes;
  }

  const cursorShape: Partial<Shape>[] =
    cursorX !== null
      ? [
          {
            type: "line",
            x0: cursorX,
            x1: cursorX,
            yref: "paper",
            y0: 0,
            y1: 1,
            line: { color: "#37d110ff", width: 2 },
          },
        ]
      : [];

  const shapes: Partial<Shape>[] = [
    ...gerarLinhasVerticaisGrossas(rangeX, rangeY),
    ...gerarLinhasHorizontaisGrossas(rangeX, rangeY),
  ];

  const plotData: Partial<PlotData>[] = [
    {
      x: time,
      y: dataVoltagem,
      type: "scatter",
      mode: "lines",
      line: { color: "black", width: 2 }
    },
  ];

  const layout: Partial<Layout> = {
    autosize: true,
    dragmode: "pan",
    margin: { l: 0, r: 0, t: 0, b: 0 },
    xaxis: {
      showgrid: true,
      gridcolor: "#ff9999",
      gridwidth: 1,
      dtick: 0.04,
      range: [0, 5],
      zeroline: false,
      showticklabels: false,
      automargin: false,
      ...layoutSync?.xaxis,
    },
    yaxis: {
      showgrid: true,
      gridcolor: "#ff9999",
      gridwidth: 1,
      dtick: 0.1,
      range: rangeY,
      zeroline: false,
      fixedrange: true,
      showticklabels: false,
      automargin: false,
      ...layoutSync?.yaxis,
    },
    shapes: [ ...shapes, ...cursorShape, ...extraShapes],
    annotations: extraAnnotations,
    plot_bgcolor: "#fffafa",
    paper_bgcolor: "#fffafa",
  };

  return (
    <div
      style={{
        width: "99%",
        height: maxHeight,
        maxHeight: maxHeight,
        overflow: "hidden",
        backgroundColor: "#fffafa",
      }}
    >
      <Plot
        data={plotData}
        layout={layout}
        config={{
          responsive: true,
          scrollZoom: true,
          displayModeBar: false,
        }}
        onRelayout={onRelayout}
        onHover={onHover}
        onUnhover={onUnhover}
        onClick={onClick}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}