
import React, { useState, useEffect, type ReactElement } from 'react';
import { Accordion, AccordionTab } from 'primereact/accordion';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import './AccordionCard.css';

interface Tab {
  title: string;
  content: ReactElement;
}

interface AccordionCardProps {
  tabs?: Tab[];
}

export default function AccordionCard({ tabs = [] }: AccordionCardProps) {
  const headerHeight = 40;
  const totalHeight = window.innerHeight * 0.9;

  function calcHeight(quantidadeDeAbas: number) {
    return (totalHeight - quantidadeDeAbas * headerHeight) / quantidadeDeAbas;
  }

  const [activeIndices, setActiveIndices] = useState<number[]>([]);
  const [contentHeight, setContentHeight] = useState<number>(calcHeight(tabs.length));

  useEffect(() => {
    const allIndices = tabs.map((_, i) => i);
    setActiveIndices(allIndices);
  }, [tabs]);

  useEffect(() => {
    if (activeIndices.length > 0) {
      setContentHeight(calcHeight(activeIndices.length));
    }
  }, [activeIndices]);

  return (
    <div className="accordion-container" style={{ maxHeight: `${totalHeight}px` }}>
      <Accordion
        multiple
        activeIndex={activeIndices}
        onTabChange={(e) => setActiveIndices(e.index as number[])}
      >
        {tabs.map((tab, index) => (
          <AccordionTab key={index} header={tab.title}>
            {React.cloneElement(tab.content, { maxHeight: contentHeight } as any)}
          </AccordionTab>
        ))}
      </Accordion>
    </div>
  );
}
