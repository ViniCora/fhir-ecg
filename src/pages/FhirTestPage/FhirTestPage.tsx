import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { ProgressSpinner } from 'primereact/progressspinner';
import FHIR from 'fhirclient';
import { fhirService } from '../../services/fhirService';
import FhirObservationViewer from '../../components/FhirObservationViewer/FhirObservationViewer';

const FhirTestPage: React.FC = () => {
  const [observationId, setObservationId] = useState('');
  const [currentId, setCurrentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [serverEndpoint, setServerEndpoint] = useState('');

  useEffect(() => {
    const initializeClient = async () => {
      try {
        const serverData = sessionStorage.getItem('selectedFhirServer');
        if (!serverData) {
          console.error('No server selected, redirecting to auth');
          window.location.href = '/';
          return;
        }

        const server = JSON.parse(serverData);
        setServerEndpoint(server.endpoint);
        
        if (server.requiresAuth) {
          const client = await FHIR.oauth2.ready();
          fhirService.setClient(client);
        } else {
          const client = FHIR.client(server.endpoint);
          fhirService.setClient(client);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('FHIR client initialization failed:', error);
        window.location.href = '/';
      }
    };

    initializeClient();
  }, []);

  const handleLoadObservation = () => {
    setCurrentId(observationId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLoadObservation();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <ProgressSpinner />
        <span className="ml-2">Initializing FHIR client...</span>
      </div>
    );
  }

  return (
    <div className="fhir-test-page p-4">
      <Card title="FHIR Observation Viewer Test" className="mb-4">
        <div className="p-fluid">
          <div className="field">
            <label htmlFor="observationId" className="font-semibold">
              Observation ID:
            </label>
            <div className="p-inputgroup mt-2">
              <InputText
                id="observationId"
                value={observationId}
                onChange={(e) => setObservationId(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Enter FHIR Observation ID"
              />
              <Button 
                label="Load" 
                icon="pi pi-search"
                onClick={handleLoadObservation}
                disabled={!observationId.trim()}
              />
            </div>
          </div>
          
          {serverEndpoint && observationId && (
            <div className="field mt-3">
              <small className="text-600">
                <strong>Request URL:</strong> {serverEndpoint}/Observation/{observationId}
              </small>
            </div>
          )}
          
          <div className="field">
            <small className="text-600">
              This component demonstrates fetching and displaying FHIR R4 Observation data 
              using TypeScript and React Query. The ECG data includes multiple leads 
              with sampled data points.
            </small>
          </div>
        </div>
      </Card>

      <Divider />

      {currentId && (
        <FhirObservationViewer observationId={currentId} />
      )}
    </div>
  );
};

export default FhirTestPage;
