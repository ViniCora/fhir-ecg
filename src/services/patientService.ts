import { fhirService } from './fhirService';
import type { Paciente } from '../types/Paciente/Paciente';
import type { ECGData } from '../types/ECGData/ECGData';
import type { Patient, Observation } from 'fhir/r4';

interface FhirResourcesConfig {
  [serverId: string]: {
    patients: Array<{
      id: string;
      resources: Array<{
        id: string;
        type: string;
        subtype?: string;
        annotationsId?: string;
      }>;
    }>;
  };
}

async function loadPatientsFromConfig(): Promise<Paciente[]> {
  try {
    const serverData = sessionStorage.getItem('selectedFhirServer');
    if (!serverData) {
      console.log('No server selected, skipping config patients');
      return [];
    }

    const server = JSON.parse(serverData);
    const serverId = server.id;

    const response = await fetch('/config/fhir-resources.json');
    const resourcesConfig: FhirResourcesConfig = await response.json();

    const serverResources = resourcesConfig[serverId];
    if (!serverResources || !serverResources.patients) {
      console.log(`No resources found for server: ${serverId}`);
      return [];
    }

    const configPatients: Paciente[] = [];

    for (const patient of serverResources.patients) {
      const patientEcgs: ECGData[] = [];

      for (const resource of patient.resources) {
        if (resource.type === 'Observation' && resource.subtype === 'ecg') {
          try {
            const ecgData = await getECGData(resource.id);
            if (ecgData) {
              patientEcgs.push(...ecgData);
            }
          } catch (error) {
            console.error(`Failed to load resource ${resource.id}:`, error);
          }
        }
      }

      if (patientEcgs.length > 0) {
        let patientName = `Patient ${patient.id}`;
        
        try {
          const fhirPatient = await fhirService.getPatient(patient.id);
          patientName = extractPatientName(fhirPatient, patient.id);
        } catch (error) {
          console.error(`Failed to load patient ${patient.id}:`, error);
        }

        configPatients.push({
          nome: patientName,
          ecgs: patientEcgs,
        });
      }
    }

    return configPatients;
  } catch (error) {
    console.error('Failed to load patients from config:', error);
    return [];
  }
}

function buildBasePatients(
  leads: string[],
  valuesByLead: Record<string, number[]>,
  fhirEcgData: ECGData[] | null = null
): Paciente[] {
  const csvEcgs: ECGData[] = [];

  for (const leadName of leads) {
    const scaledValues = valuesByLead[leadName].map(
      (value) => value * 0.005
    );
    csvEcgs.push({
      ecgDerivacao: leadName,
      periodSec: 1 / 360,
      valores: scaledValues,
    });
  }

  return [
    { nome: "Adriano Paulichi", ecgs: csvEcgs },
    { nome: "Fábio Itturriet", ecgs: csvEcgs },
    { nome: "Vinicius Coradassi", ecgs: fhirEcgData || csvEcgs },
  ];
}

function extractPatientName(fhirPatient: Patient, patientId: string): string {
  if (fhirPatient.name && fhirPatient.name.length > 0) {
    const name = fhirPatient.name[0];
    const givenNames = (name.given || []).join(' ');
    const familyName = name.family || '';
    const fullName = `${givenNames} ${familyName}`.trim();
    
    if (fullName) {
      return fullName;
    }
  }
  
  return `Patient ${patientId}`;
}

function convertFhirToECGData(observation: Observation): ECGData[] {
  if (!observation.component) return [];

  return observation.component.map((comp) => {
    const coding = comp.code?.coding?.[0];
    const sampledData = comp.valueSampledData;
    
    const dataPoints = sampledData?.data ? 
      sampledData.data.trim().split(' ').map(s => s.trim()).map(Number).filter(n => !isNaN(n)) : [];
    
    const periodMs = sampledData?.period || 8;
    const periodSec = periodMs / 1000;
    
    const factor = sampledData?.factor || 1;
    const scaledValues = dataPoints.map(value => value * factor);
    
    return {
      ecgDerivacao: coding?.display || coding?.code || `Component ${comp.code?.coding?.[0]?.code || 'Unknown'}`,
      periodSec: periodSec,
      valores: scaledValues,
    };
  });
}

async function getECGData(observationId: string): Promise<ECGData[]> {
  try {
    const observation = await fhirService.getObservation(observationId);
    const ecgData = convertFhirToECGData(observation);
    
    if (ecgData.length === 0) {
      throw new Error(`No ECG components found in observation ${observationId}`);
    }
    
    return ecgData;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to load ECG data for observation ${observationId}:`, error);
    throw new Error(`Failed to fetch ECG data: ${errorMsg}`);
  }
}

async function loadAllPatients(
  leads: string[],
  valuesByLead: Record<string, number[]>,
  fhirEcgData: ECGData[] | null = null
): Promise<Paciente[]> {
  const basePatients = buildBasePatients(
    leads,
    valuesByLead,
    fhirEcgData
  );

  const additionalPatients = await loadPatientsFromConfig();

  return [...basePatients, ...additionalPatients];
}

export const patientService = {
  loadPatientsFromConfig,
  buildBasePatients,
  loadAllPatients,
  extractPatientName,
  getECGData,
};
