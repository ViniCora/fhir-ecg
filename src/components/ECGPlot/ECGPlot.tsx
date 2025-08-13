
import Plot from 'react-plotly.js';

interface ECGPlotProps {
  data: number[];
  samplingRate: number;
  maxHeight?: number;
}

export default function ECGPlot({ data, samplingRate, maxHeight }: ECGPlotProps) {
  if (!data || data.length === 0) return <div>Carregando...</div>;

  const dataVoltagem = data;
  const time = data.map((_, i) => i / samplingRate);

  const yMin = Math.min(...dataVoltagem);
  const yMax = Math.max(...dataVoltagem);
  const margem = (yMax - yMin) * 0.1;

  const shapes: Partial<Plotly.Shape>[] = [];

  // function isAlmostMultiple(value: number, step: number, epsilon = 1e-6) {
  //   const mod = ((value % step) + step) % step;
  //   return mod < epsilon || Math.abs(mod - step) < epsilon;
  // }

  // // Linhas horizontais
  // for (let y = yMin; y <= yMax; y += ySmallStep) {
  //   const isStrong = isAlmostMultiple(y, yStrongStep);
  //   shapes.push({
  //     type: 'line',
  //     x0: xMin,
  //     x1: xMax,
  //     y0: y,
  //     y1: y,
  //     line: {
  //       color: isStrong ? '#f12626ff' : '#ffcccc',
  //       width: isStrong ? 1.5 : 1,
  //     },
  //     layer: 'below',
  //   });
  // }

  // // Linhas verticais
  // for (let x = xMin; x <= xMax; x += xSmallStep) {
  //   const isStrong = isAlmostMultiple(x, xStrongStep);
  //   shapes.push({
  //     type: 'line',
  //     x0: x,
  //     x1: x,
  //     y0: yMin,
  //     y1: yMax,
  //     line: {
  //       color: isStrong ? '#f12626ff' : '#ffcccc',
  //       width: isStrong ? 1.5 : 1,
  //     },
  //     layer: 'below',
  //   });
  // }

  return (
    <div style={{
      width: '95vw',
      height: maxHeight,
      maxHeight: maxHeight,
      overflow: 'hidden',
      margin: 'auto',
      backgroundColor: '#fffafa',
    }}>
      <Plot
        data={[{
          x: time,
          y: dataVoltagem,
          type: 'scatter',
          mode: 'lines',
          line: { color: 'black', width: 2, simplify: true },
        }]}
        layout={{
          autosize: true,
          dragmode: 'pan',
          margin: { l: 40, r: 20, t: 20, b: 40 },
          xaxis: {
            title: { text: 'Tempo (s)' },
            showgrid: true,
            gridcolor: '#ff9999',
            gridwidth: 1,
            dtick: 0.1,
            range: [0, 5],
            zeroline: false,
            fixedrange: false,
          },
          yaxis: {
            title: { text: 'Tensão (V)' },
            showgrid: true,
            gridcolor: '#ff9999',
            gridwidth: 1,
            dtick: 40,
            range: [yMin - margem, yMax + margem],
            zeroline: false,
            fixedrange: false,
            // scaleanchor: 'x',
            // scaleratio: 0.4,
          },
          shapes: shapes,
          plot_bgcolor: '#fffafa',
          paper_bgcolor: '#fffafa',
        }}
        config={{
          responsive: true,
          scrollZoom: true,
          displayModeBar: false,
        }}
        style={{
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
}
