import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Panel } from 'primereact/panel';
import FhirObservationViewer from '../../components/FhirObservationViewer/FhirObservationViewer';
import { fhirService, type IFCloudScriptResponse } from '../../services/fhirService';

const FhirTestPage: React.FC = () => {
  const [observationId, setObservationId] = useState('49148908'); // Default to the provided ID
  const [currentId, setCurrentId] = useState('49148908');
  
  // IFCloud state
  const [ifcloudObservationId, setIfcloudObservationId] = useState('68ab71f5a31251143021c84c');
  const [currentIfcloudId, setCurrentIfcloudId] = useState('');

  const handleLoadObservation = () => {
    setCurrentId(observationId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLoadObservation();
    }
  };

  const handleRunIFCloudScript = () => {
    setCurrentIfcloudId(ifcloudObservationId);
  };

  const handleIfcloudKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRunIFCloudScript();
    }
  };

  // IFCloud query
  const { 
    data: ifcloudData, 
    isLoading: ifcloudLoading, 
    error: ifcloudError,
    isError: ifcloudIsError 
  } = useQuery({
    queryKey: ['ifcloud-script', currentIfcloudId],
    queryFn: () => fhirService.callIFCloudScript(currentIfcloudId),
    enabled: !!currentIfcloudId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

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

      <Divider />

      {/* IFCloud Script Tester */}
      <Card title="IFCloud Script Tester" className="mb-4">
        <div className="p-fluid">
          <div className="field">
            <label htmlFor="ifcloudObservationId" className="font-semibold">
              Observation ID for IFCloud Processing:
            </label>
            <div className="p-inputgroup mt-2">
              <InputText
                id="ifcloudObservationId"
                value={ifcloudObservationId}
                onChange={(e) => setIfcloudObservationId(e.target.value)}
                onKeyPress={handleIfcloudKeyPress}
                placeholder="Enter Observation ID (e.g., 68ab71f5a31251143021c84c)"
              />
              <Button 
                label="Run Script" 
                icon="pi pi-play"
                onClick={handleRunIFCloudScript}
                disabled={!ifcloudObservationId.trim() || ifcloudLoading}
                loading={ifcloudLoading}
              />
            </div>
          </div>
          
          <div className="field mt-3">
            <small className="text-600">
              <strong>IFCloud URL:</strong> https://if4health.charqueadas.ifsul.edu.br/ifcloud/run_script/operation
            </small>
          </div>
          
          <div className="field">
            <small className="text-600">
              This component calls the IFCloud API to run scripts on ECG data.
              The script processes FHIR Observation data and returns processed ECG components.
            </small>
          </div>
        </div>
      </Card>

      {/* IFCloud Results */}
      {currentIfcloudId && (
        <Card title="IFCloud Script Results" className="mb-4">
          {ifcloudLoading && (
            <div className="flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
              <ProgressSpinner />
              <span className="ml-2">Running IFCloud script...</span>
            </div>
          )}

          {ifcloudIsError && (
            <Message 
              severity="error" 
              text={`Error running IFCloud script: ${ifcloudError?.message || 'Unknown error'}`}
              className="w-full mb-3"
            />
          )}

          {ifcloudData && !ifcloudLoading && (
            <div>
              <div className="mb-3">
                <strong>Script executed successfully!</strong> Found {ifcloudData.length} processed component(s).
              </div>
              
              <DataTable 
                value={ifcloudData} 
                responsiveLayout="scroll"
                className="p-datatable-sm mb-4"
              >
                <Column 
                  field="origin.value" 
                  header="Origin" 
                  body={(rowData: IFCloudScriptResponse) => rowData.origin.value}
                />
                <Column field="period" header="Period (ms)" />
                <Column field="factor" header="Factor" />
                <Column field="lowerLimit" header="Lower Limit" />
                <Column field="upperLimit" header="Upper Limit" />
                <Column field="dimensions" header="Dimensions" />
                <Column 
                  header="Data Points" 
                  body={(rowData: IFCloudScriptResponse) => {
                    const dataPoints = rowData.data.split(' ').length;
                    return `${dataPoints} points`;
                  }}
                />
              </DataTable>

              {/* Detailed view for each component */}
              {ifcloudData.map((component, index) => (
                <Panel 
                  key={index}
                  header={`Component ${index + 1} - Detailed Data`}
                  toggleable
                  collapsed
                  className="mb-3"
                >
                  <div className="grid">
                    <div className="col-12 md:col-3">
                      <div className="field">
                        <label className="font-semibold">Origin Value:</label>
                        <div className="mt-1">{component.origin.value}</div>
                      </div>
                    </div>
                    <div className="col-12 md:col-3">
                      <div className="field">
                        <label className="font-semibold">Period:</label>
                        <div className="mt-1">{component.period} ms</div>
                      </div>
                    </div>
                    <div className="col-12 md:col-3">
                      <div className="field">
                        <label className="font-semibold">Factor:</label>
                        <div className="mt-1">{component.factor}</div>
                      </div>
                    </div>
                    <div className="col-12 md:col-3">
                      <div className="field">
                        <label className="font-semibold">Dimensions:</label>
                        <div className="mt-1">{component.dimensions}</div>
                      </div>
                    </div>
                    <div className="col-12 md:col-6">
                      <div className="field">
                        <label className="font-semibold">Limits:</label>
                        <div className="mt-1">{component.lowerLimit} to {component.upperLimit}</div>
                      </div>
                    </div>
                    <div className="col-12 md:col-6">
                      <div className="field">
                        <label className="font-semibold">Total Data Points:</label>
                        <div className="mt-1">{component.data.split(' ').length}</div>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="field">
                        <label className="font-semibold">Sample Data (first 20 points):</label>
                        <div className="mt-1 p-2 border-1 border-300 border-round bg-gray-50">
                          <code>
                            {component.data.split(' ').slice(0, 20).join(', ')}
                            {component.data.split(' ').length > 20 ? '...' : ''}
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>
                </Panel>
              ))}

              {/* Raw JSON Panel */}
              <Panel 
                header="Raw IFCloud Response JSON" 
                toggleable 
                collapsed 
                className="mb-3"
              >
                <pre className="bg-gray-50 p-3 border-round overflow-auto">
                  {JSON.stringify(ifcloudData, null, 2)}
                </pre>
              </Panel>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default FhirTestPage;
