import { useState, useEffect } from 'react';
import FHIR from 'fhirclient';
import axios from 'axios';
import type { Observation, Practitioner } from 'fhir/r4';
import type Client from 'fhirclient/lib/Client';

export default function HomePage() {
  const [fhirClient, setFhirClient] = useState<Client | null>(null);
  const [practitioner, setPractitioner] = useState<Practitioner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for FHIR authentication on component mount
  useEffect(() => {
    const checkFhirAuth = async () => {
      try {
        const client = await FHIR.oauth2.ready();
        setFhirClient(client);
        console.log('FHIR Client authenticated:', client);
        
        // Try to fetch practitioner data, but don't fail if it's not available
        try {
          const practitionerData = await client.user.read();
          setPractitioner(practitionerData as Practitioner);
          console.log('Practitioner data:', practitionerData);
        } catch (practitionerError) {
          console.warn('Could not fetch practitioner data:', practitionerError);
          // Continue anyway - authentication is still valid
        }
        
        setLoading(false);
      } catch (error) {
        console.error('No FHIR authentication found:', error);
        window.location.href = '/';
      }
    };

    checkFhirAuth();
  }, []);

  // Test HEALTHGATE FASS ECG Observation API
  const testFhirApi = async () => {
    if (!fhirClient) return;

    try {
      // Get the access token from the FHIR client
      const accessToken = fhirClient.state.tokenResponse?.access_token;
      
      if (!accessToken) {
        alert('No access token available for API call');
        return;
      }

      // Use a sample observation ID - in a real app, this would come from user input or previous API calls
      const observationId = '68e2b8588f0a1bdd34808a93'; // Sample ID from the postman collection
      
      const observationData = await fhirClient.request<Observation>(`/Observation/${observationId}`)
      
      console.log('FASS ECG Observation Data:', observationData);
      
      // Display meaningful information about the ECG observation
      let message = 'FASS ECG Observation retrieved successfully!\n\n';
      message += `Observation ID: ${observationData.id || 'N/A'}\n`;
      message += `Status: ${observationData.status || 'N/A'}\n`;
      message += `Device: ${observationData.device?.display || 'N/A'}\n`;
      
      if (observationData.component && observationData.component.length > 0) {
        message += `\nECG Components (${observationData.component.length}):\n`;
        observationData.component.forEach((comp: any, index: number) => {
          const leadName = comp.code?.coding?.[0]?.display || `Component ${index + 1}`;
          const period = comp.valueSampledData?.period || 'N/A';
          const dataPoints = comp.valueSampledData?.data ? comp.valueSampledData.data.split(' ').length : 0;
          message += `- ${leadName}: ${dataPoints} data points (period: ${period}ms)\n`;
        });
      }
      
      alert(message);
      
    } catch (error) {
      console.error('FASS ECG API test failed:', error);
      
      // Handle axios-specific errors
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const statusText = error.response?.statusText;
        const errorMessage = error.response?.data?.message || error.message;
        
        alert(`FASS ECG API test failed: HTTP ${status} ${statusText}\n${errorMessage}`);
      } else {
        alert('FASS ECG API test failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
  };

  // Navigate to dashboard
  const goToDashboard = () => {
    window.location.href = '/dashboard';
  };

  // Logout with proper smartKey handling
  const logout = () => {
    // Clear FHIR client state
    setFhirClient(null);
    setError(null);

    // Handle SMART_KEY with trimming
    const smartKey = sessionStorage.getItem('SMART_KEY');
    if (smartKey) {
      // Remove first and last characters (likely quotes or brackets)
      const cleanKey = smartKey.slice(1, -1);
      sessionStorage.removeItem(cleanKey);
      sessionStorage.removeItem('SMART_KEY');
    }

    // Clear any other FHIR-related storage
    Object.keys(localStorage).forEach(key => {
      if (key.includes('FHIR') || key.includes('oauth')) {
        localStorage.removeItem(key);
      }
    });

    Object.keys(sessionStorage).forEach(key => {
      if (key.includes('FHIR') || key.includes('oauth')) {
        sessionStorage.removeItem(key);
      }
    });

    // Redirect to login page
    window.location.href = '/';
  };

  const buttonStyle = {
    background: '#007bff',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    margin: '10px'
  };

  const containerStyle = {
    padding: '40px',
    textAlign: 'center' as const,
    maxWidth: '500px',
    margin: '0 auto',
    marginTop: '100px'
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <h1>Loading...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <h1>Error</h1>
        <p style={{ color: 'red' }}>{error}</p>
        <button 
          onClick={() => window.location.href = '/'}
          style={buttonStyle}
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h1>Welcome!</h1>
      
      {practitioner && (
        <div style={{ marginBottom: '20px', textAlign: 'left' }}>
          <h3>Practitioner Details</h3>
          <p><strong>ID:</strong> {practitioner.id || 'N/A'}</p>
          <p><strong>Resource Type:</strong> {practitioner.resourceType || 'N/A'}</p>
          
          {practitioner.name && practitioner.name.length > 0 && (
            <p>
              <strong>Name:</strong>{' '}
              {practitioner.name.map((n, i) => {
                const parts = [
                  ...(n.prefix || []),
                  ...(n.given || []),
                  n.family,
                  ...(n.suffix || [])
                ].filter(Boolean);
                return <span key={i}>{parts.join(' ')}</span>;
              })}
            </p>
          )}
          
          {practitioner.identifier && practitioner.identifier.length > 0 && (
            <p>
              <strong>Identifiers:</strong>{' '}
              {practitioner.identifier.map((id, i) => (
                <span key={i}>
                  {id.system ? `${id.system}: ` : ''}{id.value || 'N/A'}
                  {i < practitioner.identifier!.length - 1 ? ', ' : ''}
                </span>
              ))}
            </p>
          )}
          
          {practitioner.telecom && practitioner.telecom.length > 0 && (
            <p>
              <strong>Contact:</strong>{' '}
              {practitioner.telecom.map((t, i) => (
                <span key={i}>
                  {t.system ? `${t.system}: ` : ''}{t.value || 'N/A'}
                  {i < practitioner.telecom!.length - 1 ? ', ' : ''}
                </span>
              ))}
            </p>
          )}
          
          {practitioner.gender && (
            <p><strong>Gender:</strong> {practitioner.gender}</p>
          )}
          
          {practitioner.birthDate && (
            <p><strong>Birth Date:</strong> {practitioner.birthDate}</p>
          )}
          
          {practitioner.address && practitioner.address.length > 0 && (
            <p>
              <strong>Address:</strong>{' '}
              {practitioner.address.map((addr, i) => {
                const parts = [
                  ...(addr.line || []),
                  addr.city,
                  addr.state,
                  addr.postalCode,
                  addr.country
                ].filter(Boolean);
                return <span key={i}>{parts.join(', ')}</span>;
              })}
            </p>
          )}
          
          {practitioner.qualification && practitioner.qualification.length > 0 && (
            <p>
              <strong>Qualifications:</strong>{' '}
              {practitioner.qualification.map((q, i) => (
                <span key={i}>
                  {q.code?.coding?.[0]?.display || q.code?.text || 'N/A'}
                  {i < practitioner.qualification!.length - 1 ? ', ' : ''}
                </span>
              ))}
            </p>
          )}
        </div>
      )}

      <div>
        <button 
          onClick={goToDashboard} 
          style={{...buttonStyle, background: '#28a745'}}
        >
          Dashboard
        </button>
        
        <button 
          onClick={testFhirApi} 
          style={{...buttonStyle, background: '#17a2b8'}}
        >
          Test API
        </button>
        
        <button 
          onClick={logout} 
          style={{...buttonStyle, background: '#dc3545'}}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
