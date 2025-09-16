import { useState, useEffect, useRef } from "react";
import ContainerAbas from "../../components/AbasEcg/ContainerAbas/ContainerAbas";
import ECGPlot from "../../components/ECGPlot/ECGPlot";
import type {
  Datum,
  Layout,
  PlotHoverEvent,
  PlotMouseEvent,
  PlotRelayoutEvent,
  Shape,
} from "plotly.js";
import { LinhaVerticalMouse } from "../../components/LinhaVerticalMouse/LinhaVerticalMouse";
import type { TabItem } from "../../types/TabItem/TabItem";
import type { Paciente } from "../../types/Paciente/Paciente";
import type { ECGData } from "../../types/ECGData/ECGData";
import ConfiguracaoLateral from "../../components/Configuracoes/ConfiguracaoLateral";
import { coresPorTipo } from "../../types/TiposBatimentos/CoresPorTipo";
import { Toast } from "primereact/toast";
import { fhirService } from "../../services/fhirService";

export default function DashboardEcgPage() {
  const [layoutSync, setLayoutSync] = useState<Partial<Layout>>({});
  const [cursorX, setCursorX] = useState<Datum>(null);
  const [visivelEsquerda, setVisivelEsquerda] = useState(false);
  const [mostrarLinha, setMostrarLinha] = useState(false);
  const [mostrarLinhaGrafico, setMostrarLinhaGrafico] = useState(false);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente>({});
  const [ecgsSelecionados, setEcgsSelecionados] = useState<ECGData[] | null>(
    null
  );
  const [pacientes, setPacientes] = useState<Paciente[] | null>(null);
  const [pontos, setPontos] = useState<number[]>([]);
  const [shapesSelecionados, setShapesSelecionados] = useState<
    Partial<Shape>[]
  >([]);
  const [anotacao, setAnotacao] = useState<any | null>(null);
  const [marcacoes, setMarcacoes] = useState<
    { sample: number; tipo: string }[]
  >([]);
  const [marcacoesSelecionadas, setMarcacoesSelecionadas] = useState<
    { sample: number; tipo: string }[]
  >([]);
  const [tipoBatimentoSelecionado, setTipoBatimentoSelecionado] = useState("");
  const toast = useRef<Toast>(null);

  useEffect(() => {
    carregarArquivos();
  }, []);

  useEffect(() => {
    if (!tipoBatimentoSelecionado) {
      setMarcacoesSelecionadas([]);
      setShapesSelecionados([]);
      return;
    }

    const filtradas = marcacoes.filter(
      (m) => m.tipo === tipoBatimentoSelecionado
    );
    setMarcacoesSelecionadas(filtradas);

    if (temMarcacoes()) {
      toast.current?.show({
        severity: "warn",
        summary: "Aviso",
        detail: "Não existe nenhum marcação para esse tipo de batimento",
        life: 5000,
      });
    }
  }, [tipoBatimentoSelecionado, marcacoes]);

  async function carregarArquivos() {
    const { derivacoes, valoresPorDerivacao } = await carregarCSV(
      "/ecg_completo.csv"
    );
    const marcacoes = await carregarMarcacoes("/200annotations.txt");
    
    let fhirEcgData: ECGData[] | null = null;
    try {
      const observationId = '68c8ea55083e7f44c6e20354';
      console.log('Attempting to load FHIR data...');
      fhirEcgData = await fhirService.getECGData(observationId);
      
      toast.current?.show({
        severity: "success",
        summary: "FHIR Data Loaded",
        detail: "ECG data loaded from FHIR for Vinicius Coradassi",
        life: 3000,
      });
    } catch (error) {
      console.error('Failed to load FHIR data, using CSV fallback:', error);
      toast.current?.show({
        severity: "warn",
        summary: "FHIR Load Failed",
        detail: "Using CSV data for all patients",
        life: 5000,
      });
    }

    const pacientes = montarPacientes(derivacoes, valoresPorDerivacao, fhirEcgData);

    setPacientes(pacientes);
    setMarcacoes(marcacoes);
  }

  async function carregarCSV(path: string) {
    const resp = await fetch(path);
    const texto = await resp.text();

    const linhas = texto
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l !== "");
    const cabecalho = linhas[0]
      .split(",")
      .map((h) => h.replace(/['"]/g, "").trim());
    const derivacoes = cabecalho.slice(1);

    const valoresPorDerivacao: Record<string, number[]> = {};
    derivacoes.forEach((nome) => (valoresPorDerivacao[nome] = []));

    for (let i = 1; i < linhas.length; i++) {
      const partes = linhas[i].split(",").map((p) => p.trim());
      if (partes.length !== cabecalho.length) continue;

      derivacoes.forEach((nome, idx) => {
        const valor = parseFloat(partes[idx + 1]);
        if (!isNaN(valor)) {
          valoresPorDerivacao[nome].push(valor);
        }
      });
    }

    return { derivacoes, valoresPorDerivacao };
  }

  async function carregarMarcacoes(path: string) {
    const resp = await fetch(path);
    const texto = await resp.text();
    const linhas = texto
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l !== "" && !l.startsWith("Time"));

    return linhas.map((l) => {
      const partes = l.split(/\s+/);
      return {
        sample: parseInt(partes[1]),
        tipo: partes[2],
      };
    });
  }

  function temMarcacoes(): boolean {
    return marcacoesSelecionadas.length > 0;
  }

  function montarPacientes(
    derivacoes: string[],
    valoresPorDerivacao: Record<string, number[]>,
    fhirEcgData: ECGData[] | null = null
  ) {
    const csvEcgs: ECGData[] = [];

    for (const nome of derivacoes) {
      csvEcgs.push({
        ecgDerivacao: nome,
        samplingRate: 360,
        valores: valoresPorDerivacao[nome],
      });
    }

    const pacientes: Paciente[] = [
      { nome: "Adriano Paulichi", ecgs: csvEcgs },
      { nome: "Fábio Itturriet", ecgs: csvEcgs },
      { nome: "Vinicius Coradassi", ecgs: fhirEcgData || csvEcgs },
    ];

    return pacientes;
  }

  function handleRelayout(eventData: PlotRelayoutEvent) {
    if (eventData["xaxis.range[0]"] && eventData["xaxis.range[1]"]) {
      setLayoutSync({
        xaxis: {
          range: [eventData["xaxis.range[0]"], eventData["xaxis.range[1]"]],
        },
      });
    }

    if (eventData["yaxis.range[0]"] && eventData["yaxis.range[1]"]) {
      setLayoutSync((prev) => ({
        ...prev,
        yaxis: {
          range: [eventData["yaxis.range[0]"], eventData["yaxis.range[1]"]],
        },
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

  function criarLinha(x: number, cor: string): Partial<Shape> {
    return {
      type: "line",
      x0: x,
      x1: x,
      yref: "paper",
      y0: 0,
      y1: 1,
      line: { color: cor, width: 2, dash: "dot" },
    };
  }

  function criarRetangulo(x1: number, x2: number, cor: string): Partial<Shape> {
    return {
      type: "rect",
      x0: Math.min(x1, x2),
      x1: Math.max(x1, x2),
      yref: "paper",
      y0: 0,
      y1: 1,
      fillcolor: cor.includes("rgba")
        ? cor
        : cor.includes("rgb")
        ? cor.replace("rgb", "rgba").replace(")", ", 0.2)")
        : "rgba(0,200,255,0.2)",
      line: { width: 0 },
    };
  }

  function criarAnotacao(x1: number, x2: number): any {
    const distancia = Math.abs(x2 - x1);
    return {
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

  function handleClick(event: PlotMouseEvent) {
    if (!event || !event.points) return;

    const x = event.points[0].x as number;
    let novosPontos: number[];

    if (pontos.length === 2) {
      novosPontos = [x];
    } else {
      novosPontos = [...pontos, x];
    }

    const novosShapes: Partial<Shape>[] = [];
    let novaAnotacao = null;

    if (novosPontos.length >= 1) {
      novosShapes.push(criarLinha(novosPontos[0], "#1cdfdfff"));
    }

    if (novosPontos.length === 2) {
      novosShapes.push(criarLinha(novosPontos[1], "#1cdfdfff"));
      novosShapes.push(
        criarRetangulo(novosPontos[0], novosPontos[1], "rgba(0,200,255,0.2)")
      );
      novaAnotacao = criarAnotacao(novosPontos[0], novosPontos[1]);
    }

    setPontos(novosPontos);
    setShapesSelecionados(novosShapes);
    setAnotacao(novaAnotacao);
  }

  function gerarRetangulos(
    marcacoesSelecionadas: { sample: number; tipo: string }[],
    todasMarcacoes: { sample: number; tipo: string }[],
    samplingRate: number
  ): { shapes: Partial<Shape>[]; annotations: any[] } {
    const retangulos: Partial<Shape>[] = [];
    const anotacoes: any[] = [];

    marcacoesSelecionadas.forEach((batimento) => {
      const proximo = todasMarcacoes.find((m) => m.sample > batimento.sample);
      if (!proximo) return;

      const x1 = batimento.sample / samplingRate;
      const x2 = proximo.sample / samplingRate;

      retangulos.push(
        criarRetangulo(
          x1,
          x2,
          coresPorTipo[batimento.tipo] ?? "rgba(0,200,255,0.2)"
        )
      );

      anotacoes.push(criarAnotacao(x1, x2));
    });

    return { shapes: retangulos, annotations: anotacoes };
  }

  function centralizarNoPonto(sample: number, samplingRate: number) {
    const x = sample / samplingRate;

    const rangeAtual = layoutSync.xaxis?.range ?? [x - 1, x + 1];
    const largura = rangeAtual[1] - rangeAtual[0];

    const novoRange = [x - largura / 2, x + largura / 2];

    setLayoutSync((prev) => ({
      ...prev,
      xaxis: {
        ...prev.xaxis,
        range: novoRange,
      },
    }));

    setCursorX(x);
  }

  function irParaProximoPonto() {
    if (!temMarcacoes() || !ecgsSelecionados) return;

    const samplingRate = ecgsSelecionados[0].samplingRate;

    const cursorNum = typeof cursorX === "number" ? cursorX : -Infinity;
    const proximo = marcacoesSelecionadas
      .map((m) => m.sample)
      .find((s) => s / samplingRate > cursorNum);

    if (proximo !== undefined) {
      centralizarNoPonto(proximo, samplingRate);
    } else {
      centralizarNoPonto(marcacoesSelecionadas[0].sample, samplingRate);
    }
  }

  function irParaPontoAnterior() {
    if (!temMarcacoes() || !ecgsSelecionados) return;

    const samplingRate = ecgsSelecionados[0].samplingRate;

    const cursorNum = typeof cursorX === "number" ? cursorX : Infinity;
    const anteriores = marcacoesSelecionadas
      .map((m) => m.sample)
      .filter((s) => s / samplingRate < cursorNum);

    if (anteriores.length > 0) {
      centralizarNoPonto(anteriores[anteriores.length - 1], samplingRate);
    } else {
      const ultimo = marcacoesSelecionadas[marcacoesSelecionadas.length - 1];
      centralizarNoPonto(ultimo.sample, samplingRate);
    }
  }

  const minhasAbas: TabItem[] = (ecgsSelecionados ?? []).map((dado) => {
    const { shapes, annotations } = gerarRetangulos(
      marcacoesSelecionadas,
      marcacoes,
      dado.samplingRate
    );

    return {
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
          extraShapes={[...shapesSelecionados, ...shapes]}
          extraAnnotations={[...(anotacao ? [anotacao] : []), ...annotations]}
          marcacoes={marcacoesSelecionadas}
        />
      ),
    };
  });

  return (
    <>
      <Toast ref={toast} />
      <LinhaVerticalMouse
        show={mostrarLinha}
        color="#d614b6ff"
        thickness={2}
        zIndex={10}
      ></LinhaVerticalMouse>
      <ContainerAbas
        tabs={minhasAbas}
        setVisivelEsquerda={setVisivelEsquerda}
        tipoBatimentoSelecionado={tipoBatimentoSelecionado}
        temMarcacoes={temMarcacoes()}
        irParaProximoPonto={irParaProximoPonto}
        irParaPontoAnterior={irParaPontoAnterior}
      />
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
        tipoBatimentoSelecionado={tipoBatimentoSelecionado}
        setTipoBatimentoSelecionado={setTipoBatimentoSelecionado}
      />
    </>
  );
}
