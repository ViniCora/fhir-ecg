import React, { useState, useEffect } from 'react';
import { Accordion, AccordionTab } from 'primereact/accordion';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import './AccordionCard.css'

export default function AccordionCard({ tabs = [] }) {

  const headerHeight = 40;
  const totalHeight = window.innerHeight * 0.9;

  function calcHeight(quantidadeDeAbas){
    return (totalHeight - quantidadeDeAbas * headerHeight) / quantidadeDeAbas;
  }

  const [activeIndices, setActiveIndices] = useState([]);
  const [contentHeight, setContentHeight] = useState(calcHeight(tabs.length));

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
    <div className="accordion-container" style={{ maxHeight: `${totalHeight}px`}}>
      <Accordion
        multiple
        activeIndex={activeIndices}
        onTabChange={(e) => setActiveIndices(e.index)}
      >
        {tabs.map((tab, index) => (
          <AccordionTab key={index} header={tab.title}>
            {React.cloneElement(tab.content, { maxHeight: contentHeight })}
          </AccordionTab>
        ))}
      </Accordion>
    </div>
  );
}
