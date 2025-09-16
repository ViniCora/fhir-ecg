import "./AbasFechadas.css";
import { Button } from "primereact/button";
import type { TabItem } from "../../../types/TabItem/TabItem";
import { coresPorTipo } from "../../../types/TiposBatimentos/CoresPorTipo";
import { useState } from "react";

interface AbasFechadasProps {
  tabs: TabItem[];
  closedTabs: number[];
  toggleTab: (index: number) => void;
  totalHeight: number;
  closedWidth: number;
  setVisivelEsquerda: (visivel: boolean) => void;
  tipoBatimentoSelecionado: string;
  temMarcacoes: boolean;
  irParaProximoPonto: () => void;
  irParaPontoAnterior: () => void;
}

export default function AbasFechadas({
  tabs,
  closedTabs,
  toggleTab,
  totalHeight,
  closedWidth,
  setVisivelEsquerda,
  tipoBatimentoSelecionado,
  temMarcacoes,
  irParaProximoPonto,
  irParaPontoAnterior,
}: AbasFechadasProps) {
  const [mostrarBotoesPontos, setMostrarBotoesPontos] = useState(false);

  return (
    <div
      className="dock-closed"
      style={{ width: closedWidth, height: totalHeight }}
    >
      <Button
        icon="pi pi-bars"
        size="small"
        className="button-dock-closed"
        onClick={() => setVisivelEsquerda(true)}
      />
      <Button
        label={tipoBatimentoSelecionado}
        size="small"
        className="button-dock-closed"
        style={{
          backgroundColor: coresPorTipo[tipoBatimentoSelecionado] || "gray",
          color: "#fff",
          border: "none",
        }}
        onClick={() => setMostrarBotoesPontos(!mostrarBotoesPontos)}
        visible={
          tipoBatimentoSelecionado != "" &&
          tipoBatimentoSelecionado != null &&
          temMarcacoes
        }
      />
      <Button
        icon="pi pi-arrow-right"
        size="small"
        className="button-dock-closed"
        visible={
          tipoBatimentoSelecionado != "" &&
          tipoBatimentoSelecionado != null &&
          mostrarBotoesPontos
        }
        onClick={irParaProximoPonto}
      />
      <Button
        icon="pi pi-arrow-left"
        size="small"
        className="button-dock-closed"
        visible={
          tipoBatimentoSelecionado != "" &&
          tipoBatimentoSelecionado != null &&
          mostrarBotoesPontos
        }
        onClick={irParaPontoAnterior}
      />
      {closedTabs.map((i) => (
        <div key={i} className="dock-closed-tab" onClick={() => toggleTab(i)}>
          <span className="label vertical-upright">{tabs[i].title}</span>
        </div>
      ))}
    </div>
  );
}
