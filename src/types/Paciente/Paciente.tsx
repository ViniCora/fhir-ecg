import type { ECGData } from "../ECGData/ECGData";
import type { Marcacoes } from "../Marcacoes/Marcacoes";

export interface Paciente {
  nome: string;
  ecgs: ECGData[];
  marcacoes?: Marcacoes[];
}
