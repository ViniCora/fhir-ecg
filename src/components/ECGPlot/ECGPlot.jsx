import React from 'react';
import Plot from 'react-plotly.js';

export default function ECGPlot(){
  const samplingRate = 100; // 250 Hz
  const duration = 10; // segundos
  const time = Array.from({ length: samplingRate * duration }, (_, i) => i * (1 / samplingRate));

  // Função de ECG artificial (com mais picos, espaçados)
  const ecgFunction = (t) => {
    const cycle = t % 0.8;
    const qrs = Math.exp(-Math.pow((cycle - 0.04) / 0.01, 2)) * 1.5;
    const p = 0.2 * Math.exp(-Math.pow((cycle - 0.2) / 0.03, 2));
    const tWave = 0.35 * Math.exp(-Math.pow((cycle - 0.5) / 0.05, 2));
    const noise = 0.05 * (Math.random() - 0.5);
    return p + qrs + tWave + noise;
  };

  const xMin = 0;
  const xMax = 10;
  const xSmallStep = 0.04;
  const xStrongStep = 0.2;

  const yMin = -0.5;
  const yMax = 2;
  const ySmallStep = 0.1;
  const yStrongStep = 0.5;

  const shapes = [];

function isAlmostMultiple(value, step, epsilon = 1e-6) {
  const mod = ((value % step) + step) % step;
  return mod < epsilon || Math.abs(mod - step) < epsilon;
}

// Linhas horizontais (Y)
for (let y = yMin; y <= yMax + 1e-9; y += ySmallStep) {
  const isStrong = isAlmostMultiple(y, yStrongStep);
  shapes.push({
    type: 'line',
    x0: xMin,
    x1: xMax,
    y0: y,
    y1: y,
    line: {
      color: isStrong ? '#f12626ff' : '#ffcccc',
      width: isStrong ? 1.5 : 1,
    },
    layer: 'below',
  });
}

// Linhas verticais (X)
for (let x = xMin; x <= xMax + 1e-9; x += xSmallStep) {
  const isStrong = isAlmostMultiple(x, xStrongStep);
  shapes.push({
    type: 'line',
    x0: x,
    x1: x,
    y0: yMin,
    y1: yMax,
    line: {
      color: isStrong ? '#f12626ff' : '#ffcccc',
      width: isStrong ? 1.5 : 1,
    },
    layer: 'below',
  });
}

  const voltage = time.map(ecgFunction);

  return (
    <div
      style={{
        width: '95vw',
        height: '20vh',
        margin: 'auto',
        backgroundColor: '#fffafa', // Fundo ECG
      }}
    >
      <Plot
        data={[
          {
            x: time,
            y: voltage,
            type: 'scatter',
            mode: 'lines',
            line: { color: 'black', width: 2 },
            simplify: true,
          },
        ]}
        layout={{
          autosize: true,
          dragmode: 'pan',
          margin: { l: 40, r: 20, t: 20, b: 40 },
          xaxis: {
            title: 'Tempo (s)',
            showgrid: true,
            gridcolor: '#ff9999',
            gridwidth: 1,
            dtick: 0.04,
            range: [0, 5],
            zeroline: false,
            fixedrange: false,
            constrain: 'range'
          },
          yaxis: {
            title: 'Voltagem (mV)',
            showgrid: true,
            gridcolor: '#ff9999',
            gridwidth: 1,
            dtick: 0.1,
            range: [-0.1, 1.5],
            zeroline: false,
            fixedrange: false,
            scaleanchor: 'x', // Proporção 1:1
            scaleratio: 0.4,
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
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};
