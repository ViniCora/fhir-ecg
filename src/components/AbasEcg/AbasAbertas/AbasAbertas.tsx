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
  return (
    <div className="dock-open">
      {openTabs
        .filter((i) => i >= 0 && i < tabs.length)
        .map((i) => (
        <div
          key={i}
          className="dock-open-tab"
          style={{ height: openHeight }}
        >
          <div className="dock-open-header" onClick={() => toggleTab(i)}>
            <span className="label vertical-upright">{tabs[i].title}</span>
          </div>
          <div className="dock-open-content">
            {tabs[i].content && React.cloneElement(tabs[i].content, {
              maxHeight: openHeight,
            } as any)}
          </div>
        </div>
      ))}
    </div>
  );
}
