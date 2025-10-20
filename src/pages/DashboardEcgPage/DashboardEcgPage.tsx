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
import type { Marcacoes } from "../../types/Marcacoes/Marcacoes";
import ECGRangeSlider from "../../components/ECGRangeSlider/ECGRangeSlider";

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
  const [marcacoes, setMarcacoes] = useState<Marcacoes[]>([]);
  const [marcacoesSelecionadas, setMarcacoesSelecionadas] = useState<
    Marcacoes[]
  >([]);
  const [tiposBatimentosSelecionados, setTiposBatimentosSelecionados] =
    useState<string[]>([]);
  const toast = useRef<Toast>(null);
  const [mostrarSlider, setMostrarSlider] = useState<boolean>(false);

  useEffect(() => {
    carregarArquivos();
  }, []);

  useEffect(() => {
    if (
      !tiposBatimentosSelecionados ||
      tiposBatimentosSelecionados.length === 0
    ) {
      setMarcacoesSelecionadas([]);
      setShapesSelecionados([]);
      return;
    }

    const filtradas = marcacoes.filter((m) =>
      tiposBatimentosSelecionados.includes(m.tipo)
    );

    if (filtradas.length > 0) {
      toast.current?.show({
        severity: "success",
        summary: "Aviso",
        detail: "Marcações carregadas com sucesso",
        life: 5000,
      });
    } else {
      toast.current?.show({
        severity: "warn",
        summary: "Aviso",
        detail: "Não existe nenhuma marcação para esses tipos de batimento",
        life: 5000,
      });
    }

    setMarcacoesSelecionadas(filtradas);
  }, [tiposBatimentosSelecionados, marcacoes]);

  async function carregarArquivos() {
    const { derivacoes, valoresPorDerivacao } = await carregarCSV(
      "/ecg_completo.csv"
    );
    const marcacoes = await carregarMarcacoes("/200annotations.txt");

    let fhirEcgData: ECGData[] | null = null;
    try {
      const observationId = "68c9715e083e7f44c6e203b0";
      console.log("Attempting to load FHIR data...");
      fhirEcgData = await fhirService.getECGData(observationId);

      toast.current?.show({
        severity: "success",
        summary: "FHIR Data Loaded",
        detail: "ECG data loaded from FHIR for Vinicius Coradassi",
        life: 3000,
      });
    } catch (error) {
      console.error("Failed to load FHIR data, using CSV fallback:", error);
      toast.current?.show({
        severity: "warn",
        summary: "FHIR Load Failed",
        detail: "Using CSV data for all patients",
        life: 5000,
      });
    }

    const pacientes = montarPacientes(
      derivacoes,
      valoresPorDerivacao,
      fhirEcgData
    );

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
      const scaledValues = valoresPorDerivacao[nome].map(
        (value) => value * 0.005
      );
      csvEcgs.push({
        ecgDerivacao: nome,
        periodSec: 1 / 360,
        valores: scaledValues,
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

  function criarAnotacao(x1: number, x2: number, altura: number = 0.98): any {
    const distancia = Math.abs(x2 - x1);
    return {
      x: (x1 + x2) / 2,
      y: altura,
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
    periodSec: number
  ): { shapes: Partial<Shape>[]; annotations: any[] } {
    const retangulos: Partial<Shape>[] = [];
    const anotacoes: any[] = [];

    marcacoesSelecionadas.forEach((batimento) => {
      const proximo = todasMarcacoes.find((m) => m.sample > batimento.sample);
      if (!proximo) return;

      const x1 = batimento.sample * periodSec;
      const x2 = proximo.sample * periodSec;

      retangulos.push(
        criarRetangulo(
          x1,
          x2,
          coresPorTipo[batimento.tipo] ?? "rgba(0,200,255,0.2)"
        )
      );

      anotacoes.push(criarAnotacao(x1, x2, 0.9));
    });

    return { shapes: retangulos, annotations: anotacoes };
  }

  function centralizarNoPonto(sample: number, periodSec: number) {
    const x = sample * periodSec;

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

    const periodSec = ecgsSelecionados[0].periodSec;
    const rangeRaw = layoutSync.xaxis?.range;

    let cursor = cursorX as number | null;

    const range =
      rangeRaw && rangeRaw.length === 2
        ? ([Number(rangeRaw[0]), Number(rangeRaw[1])] as [number, number])
        : null;

    if (
      range &&
      (typeof cursor !== "number" || cursor < range[0] || cursor > range[1])
    ) {
      cursor = (range[0] + range[1]) / 2;
    }

    const proximo = marcacoesSelecionadas
      .map((m) => m.sample)
      .find((s) => s * periodSec > (cursor ?? -Infinity));

    if (proximo !== undefined) {
      centralizarNoPonto(proximo, periodSec);
    } else {
      centralizarNoPonto(marcacoesSelecionadas[0].sample, periodSec);
    }
  }

  function irParaPontoAnterior() {
    if (!temMarcacoes() || !ecgsSelecionados) return;

    const periodSec = ecgsSelecionados[0].periodSec;
    const rangeRaw = layoutSync.xaxis?.range;

    let cursor = cursorX as number | null;

    const range =
      rangeRaw && rangeRaw.length === 2
        ? ([Number(rangeRaw[0]), Number(rangeRaw[1])] as [number, number])
        : null;

    if (
      range &&
      (typeof cursor !== "number" || cursor < range[0] || cursor > range[1])
    ) {
      cursor = (range[0] + range[1]) / 2;
    }

    const anteriores = marcacoesSelecionadas
      .map((m) => m.sample)
      .filter((s) => s * periodSec < (cursor ?? Infinity));

    if (anteriores.length > 0) {
      centralizarNoPonto(anteriores[anteriores.length - 1], periodSec);
    } else {
      const ultimo = marcacoesSelecionadas[marcacoesSelecionadas.length - 1];
      centralizarNoPonto(ultimo.sample, periodSec);
    }
  }

  function formatarTempo(segundos: number): string {
    const min = Math.floor(segundos / 60);
    const sec = Math.floor(segundos % 60);
    return `${min.toString().padStart(2, "0")}:${sec
      .toString()
      .padStart(2, "0")}`;
  }

  function gerarLinhasTemporais(duracao: number): {
    shapes: Partial<Shape>[];
    annotations: any[];
  } {
    const shapes: Partial<Shape>[] = [];
    const annotations: any[] = [];

    for (let t = 0; t <= duracao; t += 10) {
      shapes.push({
        type: "line",
        x0: t,
        x1: t,
        yref: "paper",
        y0: 0,
        y1: 1,
        line: { color: "black", width: 3, dash: "dot" },
      });

      annotations.push({
        x: t - 0.15,
        y: 0.95,
        xref: "x",
        yref: "paper",
        text: formatarTempo(t),
        showarrow: false,
        font: { size: 14, color: "black" },
        yanchor: "bottom",
      });
    }

    return { shapes, annotations };
  }

  function handleRangeSliderRelayout(eventData: PlotRelayoutEvent) {
    if (eventData["xaxis.range[0]"] && eventData["xaxis.range[1]"]) {
      setLayoutSync({
        xaxis: {
          range: [eventData["xaxis.range[0]"], eventData["xaxis.range[1]"]],
        },
      });
    }
  }

  const minhasAbas: TabItem[] = (ecgsSelecionados ?? []).map((dado, index) => {
    const { shapes, annotations } = gerarRetangulos(
      marcacoesSelecionadas,
      marcacoes,
      dado.periodSec
    );

    const duracao = dado.valores.length * dado.periodSec;

    const { shapes: linhasTempo, annotations: anotacoesTempo } =
      gerarLinhasTemporais(duracao);

    return {
      title: dado.ecgDerivacao,
      content: (
        <ECGPlot
          key={dado.ecgDerivacao}
          ecgData={dado}
          layoutSync={layoutSync}
          cursorX={cursorX}
          onRelayout={handleRelayout}
          onHover={handleHover}
          onUnhover={handleUnhover}
          onClick={handleClick}
          extraShapes={[...shapesSelecionados, ...shapes, ...linhasTempo]}
          extraAnnotations={[
            ...(anotacao ? [anotacao] : []),
            ...annotations,
            ...anotacoesTempo,
          ]}
          marcacoes={marcacoesSelecionadas}
        />
      ),
    };
  });
  const dadosPrimeiraDerivacao = ecgsSelecionados ? ecgsSelecionados[0] : null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <Toast ref={toast} />
      <LinhaVerticalMouse
        show={mostrarLinha}
        color="#d614b6ff"
        thickness={2}
        zIndex={10}
      ></LinhaVerticalMouse>

      <div style={{ flexGrow: 1, minHeight: 0 }}>
        <ContainerAbas
          tabs={minhasAbas}
          setVisivelEsquerda={setVisivelEsquerda}
          tiposBatimentosSelecionados={tiposBatimentosSelecionados}
          temMarcacoes={temMarcacoes()}
          irParaProximoPonto={irParaProximoPonto}
          irParaPontoAnterior={irParaPontoAnterior}
          marcacoes={marcacoes}
          mostrarSlider={mostrarSlider}
          setMostrarSlider={setMostrarSlider}
        />
      </div>

      {dadosPrimeiraDerivacao && mostrarSlider && (
        <ECGRangeSlider
          ecgData={dadosPrimeiraDerivacao}
          layoutSync={layoutSync}
          onRelayout={handleRangeSliderRelayout}
          marcacoes={marcacoesSelecionadas}
        />
      )}

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
        tiposBatimentosSelecionados={tiposBatimentosSelecionados}
        setTiposBatimentosSelecionados={setTiposBatimentosSelecionados}
      />
    </div>
  );
}
