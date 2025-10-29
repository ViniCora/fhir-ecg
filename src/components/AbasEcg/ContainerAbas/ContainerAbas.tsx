import { useState, useEffect } from "react";
import "../AbasEcg.css";
import AbasFechadas from "../AbasFechadas/AbasFechadas";
import AbasAbertas from "../AbasAbertas/AbasAbertas";
import type { TabItem } from "../../../types/TabItem/TabItem";
import type { Marcacoes } from "../../../types/Marcacoes/Marcacoes";

interface SideAccordionDockProps {
  tabs?: TabItem[];
  setVisivelEsquerda: (visivel: boolean) => void;
  tiposBatimentosSelecionados: string[];
  temMarcacoes: boolean;
  irParaProximoPonto: () => void;
  irParaPontoAnterior: () => void;
  marcacoes: Marcacoes[];
  mostrarSlider: boolean;
  setMostrarSlider: (mostrar: boolean) => void;
}

export default function SideAccordionDock({
  tabs = [],
  setVisivelEsquerda,
  tiposBatimentosSelecionados,
  temMarcacoes,
  irParaProximoPonto,
  irParaPontoAnterior,
  marcacoes,
  mostrarSlider,
  setMostrarSlider,
}: SideAccordionDockProps) {
  const totalHeight =
    tabs.length == 0 || !mostrarSlider
      ? window.innerHeight
      : window.innerHeight * 0.85;
  const closedWidth = 60;

  const [openTabs, setOpenTabs] = useState<number[]>([]);
  const [closedTabs, setClosedTabs] = useState<number[]>([]);

  useEffect(() => {
    const maxIndex = tabs.length - 1;

    const aindaAbertos = openTabs.filter((i) => i <= maxIndex);
    const aindaFechados = closedTabs.filter((i) => i <= maxIndex);

    const novos = tabs
      .map((_, i) => i)
      .filter((i) => !aindaAbertos.includes(i) && !aindaFechados.includes(i));

    setOpenTabs([...aindaAbertos, ...novos]);
    setClosedTabs(aindaFechados);
  }, [tabs]);

  function toggleTab(index: number) {
    if (openTabs.includes(index)) {
      setOpenTabs(openTabs.filter((i) => i !== index));
      setClosedTabs([...closedTabs, index]);
    } else {
      setClosedTabs(closedTabs.filter((i) => i !== index));
      setOpenTabs([...openTabs, index]);
    }
  }

  const openHeight =
    openTabs.length > 0 ? totalHeight / openTabs.length : totalHeight;

  return (
    <div className="dock-container" style={{ height: totalHeight }}>
      <AbasFechadas
        tabs={tabs}
        closedTabs={closedTabs}
        toggleTab={toggleTab}
        totalHeight={totalHeight}
        closedWidth={closedWidth}
        setVisivelEsquerda={setVisivelEsquerda}
        tiposBatimentosSelecionados={tiposBatimentosSelecionados}
        temMarcacoes={temMarcacoes}
        irParaProximoPonto={irParaProximoPonto}
        irParaPontoAnterior={irParaPontoAnterior}
        marcacoes={marcacoes}
        mostrarSlider={mostrarSlider}
        setMostrarSlider={setMostrarSlider}
      />
      <AbasAbertas
        tabs={tabs}
        openTabs={openTabs}
        toggleTab={toggleTab}
        openHeight={openHeight}
      />
    </div>
  );
}
