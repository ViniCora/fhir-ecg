export interface ECGData {
  ecgDerivacao: string;
  valores: number[];
  periodSec: number;
  tempo?: number[];
  tempoInicial: number;
}
