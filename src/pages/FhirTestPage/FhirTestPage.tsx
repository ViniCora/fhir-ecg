import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import FhirObservationViewer from '../../components/FhirObservationViewer/FhirObservationViewer';

const FhirTestPage: React.FC = () => {
  const [observationId, setObservationId] = useState('49148908'); // Default to the provided ID
  const [currentId, setCurrentId] = useState('49148908');

  const handleLoadObservation = () => {
    setCurrentId(observationId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLoadObservation();
    }
  };

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
                onKeyPress={handleKeyPress}
                placeholder="Enter FHIR Observation ID (e.g., 49148908)"
              />
              <Button 
                label="Load" 
                icon="pi pi-search"
                onClick={handleLoadObservation}
                disabled={!observationId.trim()}
              />
            </div>
          </div>
          
          <div className="field mt-3">
            <small className="text-600">
              <strong>Test URL:</strong> http://hapi.fhir.org/baseR4/Observation/49148908
            </small>
          </div>
          
          <div className="field">
            <small className="text-600">
              This component demonstrates fetching and displaying FHIR R4 Observation data 
              using TypeScript, Axios, and React Query. The ECG data includes multiple leads 
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
