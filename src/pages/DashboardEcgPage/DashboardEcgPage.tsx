
import { useState, useEffect, type ReactElement } from 'react';
import ContainerAbas from '../../components/AbasEcg/ContainerAbas/ContainerAbas';
import ECGPlot from '../../components/ECGPlot/ECGPlot';
import type { Datum, Layout, PlotHoverEvent, PlotMouseEvent, PlotRelayoutEvent, Shape } from 'plotly.js';
import { LinhaVerticalMouse } from '../../components/LinhaVerticalMouse/LinhaVerticalMouse';
import type { TabItem } from '../../types/TabItem/TabItem';
import type { Paciente } from '../../types/Paciente/Paciente';
import type { ECGData } from '../../types/ECGData/ECGData';
import ConfiguracaoLateral from '../../components/Configuracoes/ConfiguracaoLateral';
import ConfiguracaoTopo from '../../components/Configuracoes/ConfiguracaoTopo';

export default function DashboardEcgPage() {
  const [layoutSync, setLayoutSync] = useState<Partial<Layout>>({}); 
  const [cursorX, setCursorX] = useState<Datum>(null);
  const [visivelEsquerda, setVisivelEsquerda] = useState(false);
  const [visivelTopo, setVisivelTopo] = useState(false);
  const [mostrarLinha, setMostrarLinha] = useState(false);
  const [mostrarLinhaGrafico, setMostrarLinhaGrafico] = useState(false);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente>({});
  const [ecgsSelecionados, setEcgsSelecionados] = useState<ECGData[] | null>(null);
  const [pacientes, setPacientes] = useState<Paciente[] | null>(null);
  const [pontos, setPontos] = useState<number[]>([]);
  const [shapesSelecionados, setShapesSelecionados] = useState<Partial<Shape>[]>([]);
  const [anotacao, setAnotacao] = useState<any | null>(null);
  const [marcacoes, setMarcacoes] = useState<{sample: number, tipo: string}[]>([]);

  useEffect(() => {
    carregarArquivos();
  }, []);

  async function carregarArquivos() {
    const todos: { ecgDerivacao: string; samplingRate: number; valores: number[] }[] = [];

    const resp = await fetch("/ecg_completo.csv");
    const texto = await resp.text();

    const linhas = texto.split(/\r?\n/).map(l => l.trim()).filter(l => l !== "");

    const cabecalho = linhas[0].split(",").map(h => h.replace(/['"]/g, "").trim());

    const derivacoes = cabecalho.slice(1);

    const valoresPorDerivacao: Record<string, number[]> = {};
    derivacoes.forEach(nome => valoresPorDerivacao[nome] = []);

    for (let i = 1; i < linhas.length; i++) {
      const partes = linhas[i].split(",").map(p => p.trim());
      if (partes.length !== cabecalho.length) continue;
      derivacoes.forEach((nome, idx) => {
        const valor = parseFloat(partes[idx + 1]);
        if (!isNaN(valor)) {
          valoresPorDerivacao[nome].push(valor);
        }
      });
    }

    const respMarks = await fetch("/200annotations.txt");
    const textoMarks = await respMarks.text();
    const linhasMarks = textoMarks.split(/\r?\n/).map(l => l.trim()).filter(l => l !== "" && !l.startsWith("Time"));
    
    const marcacoes = linhasMarks.map(l => {
      const partes = l.split(/\s+/); // separa por espaço
      return {
        sample: parseInt(partes[1]),
        tipo: partes[2]
      };
    });

    for (const nome of derivacoes) {
      todos.push({
        ecgDerivacao: nome,
        samplingRate: 360,
        valores: valoresPorDerivacao[nome],
      });
    }

    const pacientes: Paciente[] = [
      { nome: "Adriano Paulichi", ecgs: todos },
      { nome: "Fábio Itturriet", ecgs: todos },
      { nome: "Vinicius Coradassi", ecgs: todos },
    ];

    setPacientes(pacientes);
    setMarcacoes(marcacoes);
  }

  function handleRelayout(eventData: PlotRelayoutEvent) {
    if (eventData['xaxis.range[0]'] && eventData['xaxis.range[1]']) {
      setLayoutSync({
        xaxis: {
          range: [
            eventData['xaxis.range[0]'],
            eventData['xaxis.range[1]'],
          ]
        }
      });
    }

    if (eventData['yaxis.range[0]'] && eventData['yaxis.range[1]']) {
      setLayoutSync(prev => ({
        ...prev,
        yaxis: {
          range: [
            eventData['yaxis.range[0]'],
            eventData['yaxis.range[1]'],
          ]
        }
      }));
    }
  }

  function handleHover(data: PlotHoverEvent) {
    if (data && data.points && data.points.length > 0 && mostrarLinhaGrafico) {
      setCursorX(data.points[0].x);
    }
  }

  function handleUnhover() {
    setCursorX(null);
  }

  function handleClick(event: PlotMouseEvent) {
    if (!event || !event.points) return;

    const x = event.points[0].x as number;
    const novosPontos = [...pontos, x].slice(-2); // máximo 2 pontos

    let novosShapes: Partial<Shape>[] = [];
    let novaAnotacao = null;

    novosShapes.push({
      type: "line",
      x0: novosPontos[0],
      x1: novosPontos[0],
      yref: "paper",
      y0: 0,
      y1: 1,
      line: { color: "#1cdfdfff", width: 2, dash: "dot" }
    });

    if (novosPontos.length === 2) {
      novosShapes.push({
        type: "line",
        x0: novosPontos[1],
        x1: novosPontos[1],
        yref: "paper",
        y0: 0,
        y1: 1,
        line: { color: "#1cdfdfff", width: 2, dash: "dot" }
      });

      const [x1, x2] = novosPontos;
      const distancia = Math.abs(x2 - x1);

      novosShapes.push({
        type: "rect",
        x0: Math.min(x1, x2),
        x1: Math.max(x1, x2),
        yref: "paper",
        y0: 0,
        y1: 1,
        fillcolor: "rgba(0, 200, 255, 0.2)",
        line: { width: 0 },
      });

      novaAnotacao = {
        x: (x1 + x2) / 2,
        y: 0.98,
        xref: "x",
        yref: "paper",
        text: `Distância: ${distancia.toFixed(2)}s`,
        showarrow: false,
        font: { size: 14, color: "black" },
        bgcolor: "rgba(255, 255, 255, 0.8)",
        bordercolor: "black",
        borderwidth: 1,
      };
    }

    setPontos(novosPontos);
    setShapesSelecionados(novosShapes);
    setAnotacao(novaAnotacao);
  }

  const minhasAbas: TabItem[] = (ecgsSelecionados ?? []).map((dado) => ({
    title: dado.ecgDerivacao,
    content: (
      <ECGPlot
        key={dado.ecgDerivacao}
        data={dado.valores}
        samplingRate={dado.samplingRate}
        layoutSync={layoutSync}
        cursorX={cursorX}
        onRelayout={handleRelayout}
        onHover={handleHover}
        onUnhover={handleUnhover}
        onClick={handleClick}
        extraShapes={shapesSelecionados}
        extraAnnotations={anotacao ? [anotacao] : []}
        marcacoes={dado.ecgDerivacao === "MLII" ? marcacoes : []}
      />
    ),
  }));

  return (
    <>
      <LinhaVerticalMouse
        show={mostrarLinha}
        color="#d614b6ff"
        thickness={2}
        zIndex={10}
      ></LinhaVerticalMouse>
      <ContainerAbas tabs={minhasAbas} setVisivelEsquerda={setVisivelEsquerda} setVisivelTopo={setVisivelTopo} />
      <ConfiguracaoLateral
        visivelEsquerda={visivelEsquerda}
        setVisivelEsquerda={setVisivelEsquerda}
        pacienteSelecionado={pacienteSelecionado}
        setPacienteSelecionado={setPacienteSelecionado}
        ecgsSelecionados={ecgsSelecionados}
        setEcgsSelecionados={setEcgsSelecionados}
        pacientes={pacientes}
        mostrarLinha={mostrarLinha}
        setMostrarLinha={setMostrarLinha}
        mostrarLinhaGrafico={mostrarLinhaGrafico}
        setMostrarLinhaGrafico={setMostrarLinhaGrafico}
      />
      <ConfiguracaoTopo
        visivelTopo={visivelTopo}
        setVisivelTopo={setVisivelTopo}
        pacienteSelecionado={pacienteSelecionado}
        setPacienteSelecionado={setPacienteSelecionado}
        ecgsSelecionados={ecgsSelecionados}
        setEcgsSelecionados={setEcgsSelecionados}
        pacientes={pacientes}
        mostrarLinha={mostrarLinha}
        setMostrarLinha={setMostrarLinha}
        mostrarLinhaGrafico={mostrarLinhaGrafico}
        setMostrarLinhaGrafico={setMostrarLinhaGrafico}
      />
  </>);
}
