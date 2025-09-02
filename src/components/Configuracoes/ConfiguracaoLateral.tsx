import React from "react";
import { Sidebar } from "primereact/sidebar";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/MultiSelect";
import { FloatLabel } from "primereact/FloatLabel";
import { InputSwitch } from "primereact/InputSwitch";
import type { Paciente } from "../../types/Paciente/Paciente";
import type { ECGData } from "../../types/ECGData/ECGData";

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
}: ConfiguracaoLateralProps) {
    
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