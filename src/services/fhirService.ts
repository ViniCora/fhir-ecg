import axios, { type AxiosResponse } from 'axios';
import FHIR from 'fhirclient';
import type { Observation, Bundle, Resource } from 'fhir/r4';
import type { ECGData } from '../types/ECGData/ECGData';

// FHIR Service configuration
const FHIR_BASE_URL = 'http://hapi.fhir.org/baseR4';

// Create axios instance with default configuration
const fhirClient = axios.create({
  baseURL: FHIR_BASE_URL,
  timeout: 10000,
  headers: {
    'Accept': 'application/fhir+json',
    'Content-Type': 'application/fhir+json',
  },
});

// Response interceptor for error handling
fhirClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('FHIR API Error:', error.response.status, error.response.data);
      throw new Error(`FHIR API Error: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error:', error.request);
      throw new Error('Network Error: Unable to reach FHIR server');
    } else {
      // Something else happened
      console.error('Request Error:', error.message);
      throw new Error(`Request Error: ${error.message}`);
    }
  }
);

export class FhirService {
  /**
   * Fetch a FHIR Observation by ID
   * @param observationId - The ID of the observation to fetch
   * @returns Promise<Observation>
   */
  async getObservation(observationId: string): Promise<Observation> {
    try {
      const response = await fhirClient.get<Observation>(`/Observation/${observationId}`);
      
      // Validate that we received an Observation resource
      if (response.data.resourceType !== 'Observation') {
        throw new Error(`Expected Observation resource, got ${response.data.resourceType}`);
      }
      
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch observation ${observationId}:`, error);
      throw error;
    }
  }

  /**
   * Search for Observations with optional parameters
   * @param params - Search parameters (patient, code, date, etc.)
   * @returns Promise<Bundle>
   */
  async searchObservations(params: Record<string, string> = {}): Promise<Bundle> {
    try {
      const response = await fhirClient.get<Bundle>('/Observation', { params });
      
      if (response.data.resourceType !== 'Bundle') {
        throw new Error(`Expected Bundle resource, got ${response.data.resourceType}`);
      }
      
      return response.data;
    } catch (error) {
      console.error('Failed to search observations:', error);
      throw error;
    }
  }

  /**
   * Fetch any FHIR resource by type and ID
   * @param resourceType - The type of FHIR resource
   * @param resourceId - The ID of the resource
   * @returns Promise<Resource>
   */
  async getResource<T extends Resource>(
    resourceType: string, 
    resourceId: string
  ): Promise<T> {
    try {
      const response = await fhirClient.get<T>(`/${resourceType}/${resourceId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch ${resourceType} ${resourceId}:`, error);
      throw error;
    }
  }

  async getECGData(observationId: string): Promise<ECGData[]> {
    try {
      const client = await FHIR.oauth2.ready();
      console.log('FHIR Client authenticated for ECG data:', client);
      
      const observationData = await client.request<Observation>(`/Observation/${observationId}`);
      console.log('FHIR ECG Observation Data:', observationData);
      
      const ecgData = this.convertFhirToECGData(observationData);
      
      if (ecgData.length === 0) {
        throw new Error('No ECG components found in FHIR observation');
      }
      
      return ecgData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown FHIR error';
      console.error('Failed to load FHIR ECG data:', error);
      throw new Error(`Failed to fetch ECG data: ${errorMessage}`);
    }
  }

  private convertFhirToECGData(observation: Observation): ECGData[] {
    if (!observation.component) return [];

    return observation.component.map((comp) => {
      const coding = comp.code?.coding?.[0];
      const sampledData = comp.valueSampledData;
      
      const dataPoints = sampledData?.data ? 
        sampledData.data.trim().split(' ').map(s => s.trim()).map(Number).filter(n => !isNaN(n)) : [];
      
      const periodMs = sampledData?.period || 8;
      const samplingRate = Math.round(1000 / periodMs);
      
      // const factor = sampledData?.factor || 1; TODO use and remove hardcoded factor from Plot
      const factor = 1;
      const scaledData = dataPoints.map(value => value * factor);
      
      return {
        ecgDerivacao: coding?.display || coding?.code || `Component ${comp.code?.coding?.[0]?.code || 'Unknown'}`,
        samplingRate: samplingRate,
        valores: scaledData,
      };
    });
  }
}

// Export singleton instance
export const fhirService = new FhirService();

// Export types for convenience
export type { Observation, Bundle, Resource };
