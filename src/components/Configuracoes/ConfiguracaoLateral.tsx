import { Sidebar } from "primereact/sidebar";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/MultiSelect";
import { FloatLabel } from "primereact/FloatLabel";
import { InputSwitch } from "primereact/InputSwitch";
import React, { useMemo } from "react";
import type { Paciente } from "../../types/Paciente/Paciente";
import type { ECGRecording } from "../../types/ECGRecording/ECGRecording";
import type { ECGData } from "../../types/ECGData/ECGData";
import { tiposBatimentos } from "../../types/TiposBatimentos/TiposBatimentos";
import { coresPorTipo } from "../../types/TiposBatimentos/CoresPorTipo";

interface ConfiguracaoLateralProps {
  visivelEsquerda: boolean;
  setVisivelEsquerda: (value: boolean) => void;

  pacienteSelecionado: Paciente | null;
  setPacienteSelecionado: (p: Paciente | null) => void;

  recordingSelecionado: ECGRecording | null;
  setRecordingSelecionado: (r: ECGRecording | null) => void;

  ecgsSelecionados: ECGData[] | null;
  setEcgsSelecionados: (e: ECGData[] | null) => void;

  pacientes: Paciente[] | null;

  mostrarLinha: boolean;
  setMostrarLinha: (v: boolean) => void;

  mostrarLinhaGrafico: boolean;
  setMostrarLinhaGrafico: (v: boolean) => void;

  tiposBatimentosSelecionados: string[];
  setTiposBatimentosSelecionados: (v: string[]) => void;

  maxMinutoECG: number;
  onMinutoChange: (minuto: number) => void;
  minutoAtual: number;

  verGraficoInteiro: boolean;
  onVerGraficoInteiroChange: (v: boolean) => void;
}

const ConteudoSidebar = React.memo(
  ({
    pacienteSelecionado,
    setPacienteSelecionado,
    recordingSelecionado,
    setRecordingSelecionado,
    ecgsSelecionados,
    setEcgsSelecionados,
    pacientes,
    mostrarLinha,
    setMostrarLinha,
    mostrarLinhaGrafico,
    setMostrarLinhaGrafico,
    tiposBatimentosSelecionados,
    setTiposBatimentosSelecionados,
    maxMinutoECG,
    onMinutoChange,
    minutoAtual,
    verGraficoInteiro,
    onVerGraficoInteiroChange,
  }: Omit<
    ConfiguracaoLateralProps,
    "visivelEsquerda" | "setVisivelEsquerda"
  >) => {
    const recordingOptions = useMemo(() => {
      if (!pacienteSelecionado) return [];
      
      return pacienteSelecionado.recordings.map((recording) => {
        const date = new Date(recording.date);
        const formattedDate = date.toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        return {
          label: `Exame - ${formattedDate}`,
          value: recording,
        };
      });
    }, [pacienteSelecionado]);

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

    const minutoOptions = useMemo(() => {
      return Array.from({ length: maxMinutoECG }, (_, i) => ({
        label: `${i}m → ${i + 1}m`,
        value: i,
      }));
    }, [maxMinutoECG]);

    return (
      <>
        <h2 style={{ paddingBottom: "20px" }}>Configurações</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          <FloatLabel>
            <Dropdown
              inputId="pacienteInput"
              placeholder="Selecione um Paciente"
              value={pacienteSelecionado}
              onChange={(e) => {
                setPacienteSelecionado(e.value);
                setRecordingSelecionado(null);
                setEcgsSelecionados(null);
              }}
              options={pacientes ?? []}
              optionLabel="nome"
              style={{ width: "90%" }}
            />
            <label htmlFor="pacienteInput">Paciente</label>
          </FloatLabel>

          <FloatLabel>
            <Dropdown
              inputId="exameInput"
              placeholder="Selecione um Exame"
              value={recordingSelecionado}
              onChange={(e) => {
                setRecordingSelecionado(e.value);
                setEcgsSelecionados(null);
              }}
              options={recordingOptions}
              optionLabel="label"
              style={{ width: "90%" }}
            />
            <label htmlFor="exameInput">Exame</label>
          </FloatLabel>

          <FloatLabel>
            <MultiSelect
              value={ecgsSelecionados}
              onChange={(e) => setEcgsSelecionados(e.value)}
              options={recordingSelecionado?.leads ?? []}
              optionLabel="ecgDerivacao"
              maxSelectedLabels={6}
              style={{ width: "90%" }}
            />
            <label htmlFor="ms-cities">Derivações</label>
          </FloatLabel>

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
                const opt = tiposBatimentosOptions.find(
                  (o) => o.value === value
                );
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

          <div style={{ display: "flex", alignItems: "center" }}>
            <label htmlFor="switchVerGrafico" style={{ paddingRight: "15px" }}>
              Ver gráfico inteiro
            </label>
            <InputSwitch
              inputId="switchVerGrafico"
              checked={verGraficoInteiro}
              onChange={(e) => onVerGraficoInteiroChange(e.value)}
            />
          </div>

          {!verGraficoInteiro && (
            <FloatLabel>
              <Dropdown
                inputId="minutoInput"
                placeholder="Selecione o minuto"
                value={minutoAtual}
                onChange={(e) => onMinutoChange(e.value)}
                options={minutoOptions}
                style={{ width: "90%" }}
              />
              <label htmlFor="minutoInput">Faixa de 1 minuto</label>
            </FloatLabel>
          )}

          <div style={{ display: "flex", alignItems: "center" }}>
            <label htmlFor="switch1" style={{ paddingRight: "15px" }}>
              Mostrar Linha na Tela?
            </label>
            <InputSwitch
              inputId="switch1"
              checked={mostrarLinha}
              onChange={(e) => setMostrarLinha(e.value)}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center" }}>
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
      </>
    );
  }
);

export default function ConfiguracaoLateral({
  visivelEsquerda,
  setVisivelEsquerda,
  ...rest
}: ConfiguracaoLateralProps) {
  return (
    <Sidebar
      visible={visivelEsquerda}
      position="left"
      onHide={() => setVisivelEsquerda(false)}
    >
      <ConteudoSidebar {...rest} />
    </Sidebar>
  );
}
