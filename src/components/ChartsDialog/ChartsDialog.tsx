import { Dialog } from "primereact/dialog";
import { Chart } from "primereact/chart";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { coresPorTipo } from "../../types/TiposBatimentos/CoresPorTipo";
import type { Marcacoes } from "../../types/Marcacoes/Marcacoes";
import { tiposBatimentos } from "../../types/TiposBatimentos/TiposBatimentos";

interface ChartsDialogProps {
  mostrarModal: boolean;
  setMostrarModal: (p: boolean) => void;
  marcacoes: Marcacoes[];
}

export default function ChartsDialog({
  mostrarModal,
  setMostrarModal,
  marcacoes,
}: ChartsDialogProps) {
  const contagemPorTipo: Record<string, number> = marcacoes.reduce((acc, m) => {
    acc[m.tipo] = (acc[m.tipo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const labels = Object.keys(contagemPorTipo);

  const data = {
    labels,
    datasets: [
      {
        label: "Quantidade de Batimentos",
        data: Object.values(contagemPorTipo),
        backgroundColor: labels.map(
          (tipo) => coresPorTipo[tipo] || "rgba(200,200,200,0.5)" // fallback
        ),
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      datalabels: {
        anchor: "end",
        align: "top",
        color: "#000",
        font: {
          weight: "bold" as const,
          size: 14,
        },
        formatter: (value: number, context: any) => {
          const simbolo = context.chart.data.labels[
            context.dataIndex
          ] as keyof typeof tiposBatimentos;
          return `${simbolo}: ${value}`;
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#495057",
          callback: (_val: any, index: number): string => {
            const simbolo = labels[index] as keyof typeof tiposBatimentos;
            const nome = tiposBatimentos[simbolo] ?? "";
            return `${nome}`;
          },
        },
      },
      y: {
        ticks: {
          color: "#495057",
          precision: 0,
        },
      },
    },
  };

  return (
    <Dialog
      header="Gráfico de Batimentos"
      visible={mostrarModal}
      onHide={() => {
        setMostrarModal(false);
      }}
    >
      <Chart
        type="bar"
        data={data}
        options={options}
        plugins={[ChartDataLabels]} // registra o plugin
        width="500px"
        height="400px"
      />
    </Dialog>
  );
}
