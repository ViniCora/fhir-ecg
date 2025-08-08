import React from 'react';
import { Accordion, AccordionTab } from 'primereact/accordion';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import './AccordionCard.css'

export default function AccordionCard({ tabs = []}) {

    const headerHeight = 40; // altura estimada de cada header (ajustável)
    const totalHeight = window.innerHeight * 0.9; // 90% da altura da tela
    const contentHeight = (totalHeight - tabs.length * headerHeight) / tabs.length;

    return (
        <div className="accordion-container">
            <Accordion 
                multiple 
                style={{maxHeight: `${contentHeight}`}}
                activeIndex={tabs.map((_, i) => i)}>
                {tabs.map((tab, index) => (
                    <AccordionTab key={index} header={tab.title}>
                        {tab.content}
                    </AccordionTab>
                ))}
            </Accordion>
        </div>
    );
}