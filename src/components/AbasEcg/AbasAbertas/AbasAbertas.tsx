import React from "react";
import "./AbasAbertas.css";
import type { TabItem } from "../../../types/TabItem/TabItem";

interface AbasAbertasProps {
  tabs: TabItem[];
  openTabs: number[];
  toggleTab: (index: number) => void;
  openHeight: number;
}

export default function AbasAbertas({
  tabs,
  openTabs,
  toggleTab,
  openHeight,
}: AbasAbertasProps) {
  if (tabs.length === 0) {
    return (
      <div className="dock-open dock-empty">
        <div className="dock-empty-content">
          <div className="dock-empty-header">
            <img
              src="./src/assets/fhir.webp"
              alt="Pulse-Fhir logo"
              className="dock-empty-logo"
            />
            <h1 className="dock-empty-app-title">Pulse-Fhir</h1>
          </div>

          <h2 className="dock-empty-title">
            📊 Visualização de Eletrocardiograma
          </h2>

          <p className="dock-empty-text">
            Para iniciar a análise dos sinais de ECG:
          </p>
          <ul className="dock-empty-steps">
            <li>👤 Selecione um paciente no menu lateral esquerdo.</li>
            <li>
              💓 Escolha as derivações do ECG que deseja visualizar (ex: DI,
              DII, V1...).
            </li>
            <li>
              📈 Os gráficos aparecerão automaticamente nesta área conforme as
              derivações forem ativadas.
            </li>
          </ul>
          <p className="dock-empty-note">
            Dica: você pode abrir várias derivações simultaneamente para
            comparar os sinais.
          </p>
        </div>
      </div>
    );
  }

  if (openTabs.length === 0) {
    return (
      <div className="dock-open dock-empty">
        <div className="dock-empty-content">
          <h2 className="dock-empty-title">📁 Nenhuma derivação aberta</h2>
          <p className="dock-empty-text">
            Você já possui derivações carregadas, mas todas estão fechadas no
            painel lateral.
          </p>
          <ul className="dock-empty-steps">
            <li>
              👉 Clique em uma das abas laterais para abrir a derivação
              desejada.
            </li>
            <li>
              📉 Os sinais do ECG aparecerão nesta área após abrir uma aba.
            </li>
          </ul>
          <p className="dock-empty-note">
            Dica: abra múltiplas derivações para comparar batimentos em
            diferentes regiões.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dock-open">
      {openTabs
        .filter((i) => i >= 0 && i < tabs.length)
        .map((i) => (
          <div key={i} className="dock-open-tab" style={{ height: openHeight }}>
            <div className="dock-open-header" onClick={() => toggleTab(i)}>
              <span className="label vertical-upright">{tabs[i].title}</span>
            </div>
            <div className="dock-open-content">
              {tabs[i].content &&
                React.cloneElement(tabs[i].content, {
                  maxHeight: openHeight,
                } as any)}
            </div>
          </div>
        ))}
    </div>
  );
}
