import type { ECGRecording } from "../ECGRecording/ECGRecording";

export interface Paciente {
  nome: string;
  recordings: ECGRecording[];
}
