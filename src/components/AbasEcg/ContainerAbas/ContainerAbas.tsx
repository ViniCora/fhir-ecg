import React, { useState, useEffect, type ReactElement } from "react";
import "../AbasEcg.css";
import AbasFechadas from "../AbasFechadas/AbasFechadas";
import AbasAbertas from "../AbasAbertas/AbasAbertas";
import type { TabItem } from "../../../types/TabItem/TabItem";


interface SideAccordionDockProps {
  tabs?: TabItem[];
  setVisivelEsquerda: (visivel: boolean) => void;
  setVisivelTopo: (visivel: boolean) => void;
}

export default function SideAccordionDock({ tabs = [], setVisivelEsquerda, setVisivelTopo }: SideAccordionDockProps) {
  const totalHeight = window.innerHeight * 0.995;
  const closedWidth = 45;

  const [openTabs, setOpenTabs] = useState<number[]>([]);
  const [closedTabs, setClosedTabs] = useState<number[]>([]);

  useEffect(() => {
    const maxIndex = tabs.length - 1;

    // mantém só índices válidos
    const aindaAbertos = openTabs.filter(i => i <= maxIndex);
    const aindaFechados = closedTabs.filter(i => i <= maxIndex);

    // abre automaticamente os novos que não existiam
    const novos = tabs.map((_, i) => i).filter(i => !aindaAbertos.includes(i) && !aindaFechados.includes(i));

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
        setVisivelTopo={setVisivelTopo}
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
