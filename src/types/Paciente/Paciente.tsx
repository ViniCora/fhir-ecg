import type { ECGData } from "../ECGData/ECGData";

export interface Paciente {
  nome: string;
  ecgs: ECGData[];
}