import { fhirService } from './fhirService';
import type { Paciente } from '../types/Paciente/Paciente';
import type { ECGRecording } from '../types/ECGRecording/ECGRecording';
import type { ECGData } from '../types/ECGData/ECGData';
import type { Annotations } from '../types/Annotations/Annotations';
import type { Patient, Observation } from 'fhir/r4';

interface FhirResourcesConfig {
  [serverId: string]: {
    patients: Array<{
      id: string;
      name?: string;
      resources: Array<{
        id: string;
        type: string;
        subtype?: string;
        annotationsId?: string;
        filename?: string;
        annotationsFilename?: string;
      }>;
    }>;
  };
}

async function loadLocalObservation(filename: string): Promise<Observation> {
  const response = await fetch(`/resources/${filename}`);
  if (!response.ok) {
    throw new Error(`Failed to load local resource: ${filename}`);
  }
  return await response.json();
}

async function loadLocalPatients(): Promise<Paciente[]> {
  try {
    const response = await fetch('/config/fhir-resources.json');
    const resourcesConfig: FhirResourcesConfig = await response.json();

    const localResources = resourcesConfig['local'];
    if (!localResources || !localResources.patients) {
      console.log('No local resources found');
      return [];
    }

    const localPatients: Paciente[] = [];

    for (const patient of localResources.patients) {
      const recordings: ECGRecording[] = [];

      for (const resource of patient.resources) {
        if (resource.type === 'Observation' && resource.subtype === 'ecg' && resource.filename) {
          try {
            const observation = await loadLocalObservation(resource.filename);
            const leads = convertFhirToECGData(observation);
            
            if (leads.length > 0) {
              let annotations: Annotations | undefined = undefined;

              if (resource.annotationsFilename) {
                try {
                  const annotationObservation = await loadLocalObservation(resource.annotationsFilename);
                  const loadedAnnotations = convertFhirToAnnotations(annotationObservation);
                  if (Object.keys(loadedAnnotations).length > 0) {
                    annotations = loadedAnnotations;
                  }
                } catch (error) {
                  console.error(`Failed to load local annotations ${resource.annotationsFilename}:`, error);
                }
              }

              const date = observation.effectivePeriod?.start || new Date().toISOString();
              
              recordings.push({
                id: resource.id,
                date: date,
                leads: leads,
                annotations: annotations,
              });
            }
          } catch (error) {
            console.error(`Failed to load local resource ${resource.filename}:`, error);
          }
        }
      }

      if (recordings.length > 0) {
        recordings.sort((a, b) => b.date.localeCompare(a.date));
        
        localPatients.push({
          nome: patient.name || `Local Patient ${patient.id}`,
          recordings: recordings,
        });
      }
    }

    return localPatients;
  } catch (error) {
    console.error('Failed to load local patients:', error);
    return [];
  }
}

async function loadRemotePatients(): Promise<Paciente[]> {
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
      const recordings: ECGRecording[] = [];

      for (const resource of patient.resources) {
        if (resource.type === 'Observation' && resource.subtype === 'ecg') {
          try {
            const observation = await fhirService.getObservation(resource.id);
            const leads = convertFhirToECGData(observation);
            
            if (leads.length > 0) {
              let annotations: Annotations | undefined = undefined;

              if (resource.annotationsId) {
                try {
                  const loadedAnnotations = await getAnnotations(resource.annotationsId);
                  if (Object.keys(loadedAnnotations).length > 0) {
                    annotations = loadedAnnotations;
                  }
                } catch (error) {
                  console.error(`Failed to load annotations ${resource.annotationsId}:`, error);
                }
              }

              const date = observation.effectivePeriod?.start || new Date().toISOString();
              
              recordings.push({
                id: resource.id,
                date: date,
                leads: leads,
                annotations: annotations,
              });
            }
          } catch (error) {
            console.error(`Failed to load resource ${resource.id}:`, error);
          }
        }
      }

      if (recordings.length > 0) {
        recordings.sort((a, b) => b.date.localeCompare(a.date));
        
        let patientName = `Patient ${patient.id}`;
        
        try {
          const fhirPatient = await fhirService.getPatient(patient.id);
          patientName = extractPatientName(fhirPatient, patient.id);
        } catch (error) {
          console.error(`Failed to load patient ${patient.id}:`, error);
        }

        configPatients.push({
          nome: patientName,
          recordings: recordings,
        });
      }
    }

    return configPatients;
  } catch (error) {
    console.error('Failed to load patients from config:', error);
    return [];
  }
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

function convertFhirToAnnotations(observation: Observation): Annotations {
  if (!observation.component) return {};

  const annotations: Annotations = {};

  observation.component.forEach((comp) => {
    const coding = comp.code?.coding?.[0];
    const annotationType = coding?.code || 'N';
    const sampledData = comp.valueSampledData;
    
    if (sampledData?.data) {
      const sampleNumbers = sampledData.data
        .trim()
        .split(' ')
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n))
        .sort((a, b) => a - b);
      
      annotations[annotationType] = sampleNumbers;
    }
  });

  return annotations;
}

async function getAnnotations(observationId: string): Promise<Annotations> {
  try {
    const observation = await fhirService.getObservation(observationId);
    const annotations = convertFhirToAnnotations(observation);
    
    if (Object.keys(annotations).length === 0) {
      throw new Error(`No annotations found in observation ${observationId}`);
    }
    
    return annotations;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to load annotations for observation ${observationId}:`, error);
    throw new Error(`Failed to fetch annotations: ${errorMsg}`);
  }
}

async function loadAllPatients(): Promise<Paciente[]> {
  const localPatients = await loadLocalPatients();
  const remotePatients = await loadRemotePatients();

  return [...localPatients, ...remotePatients];
}

export const patientService = {
  loadLocalPatients,
  loadRemotePatients,
  loadAllPatients,
  extractPatientName,
  getECGData,
  getAnnotations,
};
