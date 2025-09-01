import React, {useState} from "react";
import "./AbasFechadas.css";
import { Button } from 'primereact/button';             
import type { TabItem } from "../../../types/TabItem/TabItem";

interface AbasFechadasProps {
  tabs: TabItem[];
  closedTabs: number[];
  toggleTab: (index: number) => void;
  totalHeight: number;
  closedWidth: number;
  setVisivelEsquerda: (visivel: boolean) => void;
  setVisivelTopo: (visivel: boolean) => void;
}

export default function AbasFechadas({
  tabs,
  closedTabs,
  toggleTab,
  totalHeight,
  closedWidth,
  setVisivelEsquerda,
  setVisivelTopo
}: AbasFechadasProps) {

  return (
    <div
      className="dock-closed"
      style={{ width: closedWidth, height: totalHeight }}
    >
        <Button icon="pi pi-arrow-right" size="small" onClick={() => setVisivelEsquerda(true)} />
        <Button icon="pi pi-arrow-down" size="small" onClick={() => setVisivelTopo(true)} />
      {closedTabs.map((i) => (
        <div
          key={i}
          className="dock-closed-tab"
          onClick={() => toggleTab(i)}
        >
          <span className="label vertical-upright">{tabs[i].title}</span>
        </div>
      ))}
    </div>
  );
}
