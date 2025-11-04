import type { ECGData } from "../ECGData/ECGData";
import type { Annotations } from "../Annotations/Annotations";

export interface ECGRecording {
  id: string;
  date: string;
  leads: ECGData[];
  annotations?: Annotations;
}
