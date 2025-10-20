import { Sidebar } from "primereact/sidebar";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/MultiSelect";
import { FloatLabel } from "primereact/FloatLabel";
import { InputSwitch } from "primereact/InputSwitch";
import type { Paciente } from "../../types/Paciente/Paciente";
import type { ECGData } from "../../types/ECGData/ECGData";
import { tiposBatimentos } from "../../types/TiposBatimentos/TiposBatimentos";
import { coresPorTipo } from "../../types/TiposBatimentos/CoresPorTipo";

interface ConfiguracaoLateralProps {
  visivelEsquerda: boolean;
  setVisivelEsquerda: (value: boolean) => void;

  pacienteSelecionado: Paciente;
  setPacienteSelecionado: (p: Paciente) => void;

  ecgsSelecionados: ECGData[] | null;
  setEcgsSelecionados: (e: ECGData[] | null) => void;

  pacientes: Paciente[] | null;

  mostrarLinha: boolean;
  setMostrarLinha: (v: boolean) => void;

  mostrarLinhaGrafico: boolean;
  setMostrarLinhaGrafico: (v: boolean) => void;

  tiposBatimentosSelecionados: string[];
  setTiposBatimentosSelecionados: (v: string[]) => void;
}

export default function ConfiguracaoLateral({
  visivelEsquerda,
  setVisivelEsquerda,
  pacienteSelecionado,
  setPacienteSelecionado,
  ecgsSelecionados,
  setEcgsSelecionados,
  pacientes,
  mostrarLinha,
  setMostrarLinha,
  mostrarLinhaGrafico,
  setMostrarLinhaGrafico,
  tiposBatimentosSelecionados,
  setTiposBatimentosSelecionados,
}: ConfiguracaoLateralProps) {
  const tiposBatimentosOptions = Object.entries(tiposBatimentos).map(
    ([key, value]) => ({
      label: value,
      value: key,
      cor: coresPorTipo[key],
    })
  );

  const optionTemplate = (option: any) => {
    if (!option) return <span />;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span
          style={{
            width: "12px",
            height: "12px",
            backgroundColor: option.cor,
            borderRadius: "50%",
            display: "inline-block",
          }}
        />
        <span>{option.label}</span>
      </div>
    );
  };
  return (
    <Sidebar
      visible={visivelEsquerda}
      position="left"
      onHide={() => setVisivelEsquerda(false)}
    >
      <h2 style={{ paddingBottom: "20px" }}>Configurações</h2>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "initial",
          gap: "30px",
        }}
      >
        <div>
          <FloatLabel>
            <Dropdown
              inputId="pacienteInput"
              placeholder="Selecione um Paciente"
              value={pacienteSelecionado}
              onChange={(e) => {
                setPacienteSelecionado(e.value);
                setEcgsSelecionados(null);
              }}
              options={pacientes ?? []}
              optionLabel="nome"
              style={{ width: "90%" }}
            />
            <label htmlFor="pacienteInput">Paciente</label>
          </FloatLabel>
        </div>
        <div>
          <FloatLabel>
            <MultiSelect
              value={ecgsSelecionados}
              onChange={(e) => setEcgsSelecionados(e.value)}
              options={pacienteSelecionado?.ecgs ?? []}
              optionLabel="ecgDerivacao"
              maxSelectedLabels={6}
              style={{ width: "90%" }}
            />
            <label htmlFor="ms-cities">Derivações</label>
          </FloatLabel>
        </div>
        <FloatLabel>
          <MultiSelect
            inputId="tipoMarcacao"
            placeholder="Selecione um ou mais Tipos"
            showClear={tiposBatimentosSelecionados.length > 0}
            value={tiposBatimentosSelecionados}
            onChange={(e) => setTiposBatimentosSelecionados(e.value)}
            options={tiposBatimentosOptions ?? []}
            optionLabel="label"
            itemTemplate={optionTemplate}
            filter
            selectedItemTemplate={(value) => {
              if (!value) return null;
              const opt = tiposBatimentosOptions.find((o) => o.value === value);
              if (!opt) return null;

              return (
                <span
                  style={{
                    backgroundColor: opt.cor,
                    color: "#fff",
                    padding: "2px 6px",
                    borderRadius: "6px",
                    fontSize: "0.8rem",
                  }}
                >
                  {opt.label}
                </span>
              );
            }}
            style={{ width: "90%" }}
          />
          <label htmlFor="tipoMarcacao">Tipos Batimentos</label>
        </FloatLabel>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "initial",
          }}
        >
          <label htmlFor="switch1" style={{ paddingRight: "15px" }}>
            Mostrar Linha na Tela?
          </label>
          <InputSwitch
            inputId="switch1"
            checked={mostrarLinha}
            onChange={(e) => setMostrarLinha(e.value)}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "initial",
          }}
        >
          <label htmlFor="switch2" style={{ paddingRight: "15px" }}>
            Mostrar Linha no Gráfico?
          </label>
          <InputSwitch
            inputId="switch2"
            checked={mostrarLinhaGrafico}
            onChange={(e) => setMostrarLinhaGrafico(e.value)}
          />
        </div>
      </div>
    </Sidebar>
  );
}
