import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from 'primereact/card';
import { Panel } from 'primereact/panel';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { fhirService } from '../../services/fhirService';
import type { Observation } from 'fhir/r4';

interface FhirObservationViewerProps {
  observationId: string;
}

interface ECGComponent {
  leadName: string;
  code: string;
  origin: number;
  period: number;
  factor: number;
  unit: string;
  dataPoints: number[];
  sampleCount: number;
}

const FhirObservationViewer: React.FC<FhirObservationViewerProps> = ({ observationId }) => {
  const { 
    data: observation, 
    isLoading, 
    error,
    isError 
  } = useQuery({
    queryKey: ['fhir-observation', observationId],
    queryFn: () => fhirService.getObservation(observationId),
    enabled: !!observationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  // Parse ECG components from observation
  const parseECGComponents = (obs: Observation): ECGComponent[] => {
    if (!obs.component) return [];

    return obs.component.map((comp, index) => {
      const coding = comp.code?.coding?.[0];
      const sampledData = comp.valueSampledData;
      
      return {
        leadName: coding?.display || `Component ${index + 1}`,
        code: coding?.code || 'Unknown',
        origin: sampledData?.origin?.value || 0,
        period: sampledData?.period || 0,
        factor: sampledData?.factor || 1,
        unit: sampledData?.origin?.unit || 'mV',
        dataPoints: sampledData?.data ? 
          sampledData.data.split(' ').map(Number).filter(n => !isNaN(n)) : [],
        sampleCount: sampledData?.data ? 
          sampledData.data.split(' ').length : 0
      };
    });
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Get status severity for Tag component
  const getStatusSeverity = (status?: string) => {
    switch (status) {
      case 'final': return 'success';
      case 'preliminary': return 'warning';
      case 'cancelled': return 'danger';
      default: return 'info';
    }
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
          <ProgressSpinner />
          <span className="ml-2">Loading FHIR Observation...</span>
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-4">
        <Message 
          severity="error" 
          text={`Error loading observation: ${error?.message || 'Unknown error'}`}
          className="w-full"
        />
      </Card>
    );
  }

  if (!observation) {
    return (
      <Card className="p-4">
        <Message 
          severity="warn" 
          text="No observation data found"
          className="w-full"
        />
      </Card>
    );
  }

  const ecgComponents = parseECGComponents(observation);

  return (
    <div className="fhir-observation-viewer">
      {/* Header Card */}
      <Card 
        title={`FHIR Observation: ${observation.id}`}
        className="mb-4"
      >
        <div className="grid">
          <div className="col-12 md:col-6">
            <div className="field">
              <label className="font-semibold">Status:</label>
              <div className="mt-1">
                <Tag 
                  value={observation.status || 'Unknown'} 
                  severity={getStatusSeverity(observation.status)}
                />
              </div>
            </div>
          </div>
          <div className="col-12 md:col-6">
            <div className="field">
              <label className="font-semibold">Resource Type:</label>
              <div className="mt-1">{observation.resourceType}</div>
            </div>
          </div>
          <div className="col-12 md:col-6">
            <div className="field">
              <label className="font-semibold">Subject:</label>
              <div className="mt-1">{observation.subject?.reference || 'N/A'}</div>
            </div>
          </div>
          <div className="col-12 md:col-6">
            <div className="field">
              <label className="font-semibold">Effective Period:</label>
              <div className="mt-1">
                {observation.effectivePeriod ? (
                  <div>
                    <div>Start: {formatDate(observation.effectivePeriod.start)}</div>
                    <div>End: {formatDate(observation.effectivePeriod.end)}</div>
                  </div>
                ) : (
                  formatDate(observation.effectiveDateTime)
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Observation Code */}
      {observation.code && (
        <Card title="Observation Code" className="mb-4">
          <div className="grid">
            {observation.code.coding?.map((coding, index) => (
              <div key={index} className="col-12 md:col-6">
                <div className="field">
                  <label className="font-semibold">Code:</label>
                  <div className="mt-1">{coding.code}</div>
                </div>
                <div className="field">
                  <label className="font-semibold">Display:</label>
                  <div className="mt-1">{coding.display}</div>
                </div>
                <div className="field">
                  <label className="font-semibold">System:</label>
                  <div className="mt-1">{coding.system}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ECG Components */}
      {ecgComponents.length > 0 && (
        <Card title="ECG Components" className="mb-4">
          <DataTable 
            value={ecgComponents} 
            responsiveLayout="scroll"
            className="p-datatable-sm"
          >
            <Column field="leadName" header="Lead Name" />
            <Column field="code" header="Code" />
            <Column 
              field="origin" 
              header="Origin" 
              body={(rowData) => `${rowData.origin} ${rowData.unit}`}
            />
            <Column field="period" header="Period (ms)" />
            <Column field="factor" header="Factor" />
            <Column field="sampleCount" header="Sample Count" />
          </DataTable>
        </Card>
      )}

      {/* ECG Data Details */}
      {ecgComponents.map((component, index) => (
        <Panel 
          key={index}
          header={`${component.leadName} - Data Details`}
          toggleable
          collapsed
          className="mb-3"
        >
          <div className="grid">
            <div className="col-12 md:col-4">
              <div className="field">
                <label className="font-semibold">Origin:</label>
                <div className="mt-1">{component.origin} {component.unit}</div>
              </div>
            </div>
            <div className="col-12 md:col-4">
              <div className="field">
                <label className="font-semibold">Sampling Period:</label>
                <div className="mt-1">{component.period} ms</div>
              </div>
            </div>
            <div className="col-12 md:col-4">
              <div className="field">
                <label className="font-semibold">Scale Factor:</label>
                <div className="mt-1">{component.factor}</div>
              </div>
            </div>
            <div className="col-12">
              <div className="field">
                <label className="font-semibold">Sample Data (first 20 points):</label>
                <div className="mt-1 p-2 border-1 border-300 border-round bg-gray-50">
                  <code>
                    {component.dataPoints.slice(0, 20).join(', ')}
                    {component.dataPoints.length > 20 ? '...' : ''}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      ))}

      {/* Raw JSON Panel */}
      <Panel 
        header="Raw FHIR JSON" 
        toggleable 
        collapsed 
        className="mb-3"
      >
        <pre className="bg-gray-50 p-3 border-round overflow-auto">
          {JSON.stringify(observation, null, 2)}
        </pre>
      </Panel>
    </div>
  );
};

export default FhirObservationViewer;
