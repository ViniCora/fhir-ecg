import type { ReactElement } from "react";

export interface ECGData {
  ecgDerivacao: string;
  samplingRate: number;
  valores: number[];
}