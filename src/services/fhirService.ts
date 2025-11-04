import FHIR from 'fhirclient';
import type { Observation, Bundle, Resource, Patient } from 'fhir/r4';
import type Client from 'fhirclient/lib/Client';

export class FhirService {
  private client: Client | null = null;

  setClient(client: Client) {
    this.client = client;
    console.log('FHIR client set in fhirService:', client);
  }

  private async getFhirClient() {
    if (this.client) {
      return this.client;
    }
    
    const client = await FHIR.oauth2.ready();
    this.client = client;
    return client;
  }

  async getResource<T extends Resource>(
    resourceType: string, 
    resourceId: string
  ): Promise<T> {
    try {
      const client = await this.getFhirClient();
      const resource = await client.request<T>(`/${resourceType}/${resourceId}`);
      return resource;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to fetch ${resourceType}/${resourceId}:`, error);
      throw new Error(`Failed to fetch ${resourceType}/${resourceId}: ${errorMsg}`);
    }
  }
  
  async getPatient(patientId: string): Promise<Patient> {
    return this.getResource<Patient>('Patient', patientId);
  }

  async getObservation(observationId: string): Promise<Observation> {
    return this.getResource<Observation>('Observation', observationId);
  }
}

// Export singleton instance
export const fhirService = new FhirService();

// Export types for convenience
export type { Observation, Bundle, Resource };
