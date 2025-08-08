import React from 'react';
import AccordionCard from '../../components/AccordionCard/AccordionCard';
import ECGPlot from '../../components/ECGPlot/ECGPlot';

export default function DashboardEcgPage() {
    const minhasAbas = [
        { title: 'ECG 1', content: <ECGPlot /> },
        { title: 'ECG 2', content: <ECGPlot /> },
         { title: 'ECG 3', content: <ECGPlot /> }
    ];

    return (
        <>
        <AccordionCard tabs={minhasAbas}></AccordionCard>
        </>
    );
}