
import { useState, useEffect } from 'react';
import AccordionCard from '../../components/AccordionCard/AccordionCard';
import ECGPlot from '../../components/ECGPlot/ECGPlot';
import teste1 from '../../test/teste1.txt';
import teste2 from '../../test/teste2.txt';
import teste3 from '../../test/teste3.txt';

interface ECGData {
  samplingRate: number;
  valores: number[];
}

export default function DashboardEcgPage() {
  const [dados, setDados] = useState<ECGData[]>([]);

  useEffect(() => {
    async function carregarArquivos() {
      const arquivos = [teste1, teste2, teste3];
      const todos: ECGData[] = [];

      for (const arquivo of arquivos) {
        const resp = await fetch(arquivo);
        const texto = await resp.text();

        const linhas = texto.split(/\r?\n/).map(l => l.trim()).filter(l => l !== '');

        const rateLine = linhas.find(l => l.startsWith('# Sampling Rate'));
        const samplingRate = rateLine ? parseFloat(rateLine.split(':=')[1]) : 360;

        const valores = linhas
          .filter(l => !l.startsWith('#'))
          .map(l => parseFloat(l))
          .filter(num => !isNaN(num));

        todos.push({ samplingRate, valores });
      }

      setDados(todos);
    }

    carregarArquivos();
  }, []);

  const minhasAbas = dados.map((dado, i) => ({
    title: `ECG ${i + 1}`,
    content: <ECGPlot data={dado.valores} samplingRate={dado.samplingRate} />
  }));

  return <AccordionCard tabs={minhasAbas} />;
}
