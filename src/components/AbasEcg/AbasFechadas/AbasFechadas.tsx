import "./AbasFechadas.css";
import { Button } from "primereact/button";
import type { TabItem } from "../../../types/TabItem/TabItem";
import { useState } from "react";
import ChartsDialog from "../../ChartsDialog/ChartsDialog";
import type { Annotations } from "../../../types/Annotations/Annotations";

interface AbasFechadasProps {
  tabs: TabItem[];
  closedTabs: number[];
  toggleTab: (index: number) => void;
  totalHeight: number;
  closedWidth: number;
  setVisivelEsquerda: (visivel: boolean) => void;
  tiposBatimentosSelecionados: string[];
  temMarcacoes: boolean;
  irParaProximoPonto: () => void;
  irParaPontoAnterior: () => void;
  marcacoes: Annotations;
  mostrarSlider: boolean;
  setMostrarSlider: (mostrar: boolean) => void;
}

export default function AbasFechadas({
  tabs,
  closedTabs,
  toggleTab,
  totalHeight,
  closedWidth,
  setVisivelEsquerda,
  tiposBatimentosSelecionados,
  temMarcacoes,
  irParaProximoPonto,
  irParaPontoAnterior,
  marcacoes,
  mostrarSlider,
  setMostrarSlider,
}: AbasFechadasProps) {
  const [mostrarDialog, setMostrarDialog] = useState(false);

  return (
    <div
      className="dock-closed"
      style={{ width: closedWidth, height: totalHeight }}
    >
      <div className="dock-closed-actions">
        <Button
          icon="pi pi-bars"
          rounded
          outlined
          tooltip="Abrir menu lateral"
          className="button-dock-closed"
          onClick={() => setVisivelEsquerda(true)}
        />
        <Button
          icon="pi pi-chart-bar"
          rounded
          outlined
          tooltip="Informações do exame"
          className="button-dock-closed"
          visible={Object.keys(marcacoes).length > 0}
          onClick={() => setMostrarDialog(true)}
        />
        <Button
          icon="pi pi-sliders-h"
          rounded
          outlined
          tooltip="Selecionar tempo do gráfico"
          className="button-dock-closed"
          visible={tabs.length > 0}
          onClick={() => setMostrarSlider(!mostrarSlider)}
        />
        <Button
          icon="pi pi-arrow-left"
          rounded
          outlined
          tooltip="Ponto anterior"
          className="button-dock-closed"
          visible={tiposBatimentosSelecionados.length > 0 && temMarcacoes}
          onClick={irParaPontoAnterior}
        />
        <Button
          icon="pi pi-arrow-right"
          rounded
          outlined
          tooltip="Próximo ponto"
          className="button-dock-closed"
          visible={tiposBatimentosSelecionados.length > 0 && temMarcacoes}
          onClick={irParaProximoPonto}
        />
      </div>

      <div className="dock-closed-tabs">
        {closedTabs.map((i) => (
          <div key={i} className="dock-closed-tab" onClick={() => toggleTab(i)}>
            <span className="label vertical-upright">{tabs[i].title}</span>
          </div>
        ))}
      </div>

      <ChartsDialog
        mostrarModal={mostrarDialog}
        setMostrarModal={setMostrarDialog}
        marcacoes={marcacoes}
      />
    </div>
  );
}
