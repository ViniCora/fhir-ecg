import { useState, useEffect } from 'react';
import FHIR from 'fhirclient';
import axios from 'axios';
import type { Observation } from 'fhir/r4';

export default function HomePage() {
  const [fhirClient, setFhirClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for FHIR authentication on component mount
  useEffect(() => {
    const checkFhirAuth = async () => {
      try {
        const client = await FHIR.oauth2.ready();
        setFhirClient(client);
        setLoading(false);
        console.log('FHIR Client authenticated:', client);
      } catch (error) {
        console.error('No FHIR authentication found:', error);
        // Redirect to login if not authenticated
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
        alert('No access token available for HEALTHGATE API call');
        return;
      }

      // Use a sample observation ID - in a real app, this would come from user input or previous API calls
      const observationId = '6858559c40f1123de0d9cd78'; // Sample ID from the postman collection
      
      // Make request to HEALTHGATE FASS ECG Observation endpoint using axios
      const response = await axios.get<Observation>(
        `https://if4health.charqueadas.ifsul.edu.br/healthgate/api/fassecg/Observation/${observationId}`,
        {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const observationData = response.data;
      
      console.log('HEALTHGATE FASS ECG Observation Data:', observationData);
      
      // Display meaningful information about the ECG observation
      let message = 'HEALTHGATE FASS ECG Observation retrieved successfully!\n\n';
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
      console.error('HEALTHGATE FASS ECG API test failed:', error);
      
      // Handle axios-specific errors
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const statusText = error.response?.statusText;
        const errorMessage = error.response?.data?.message || error.message;
        
        alert(`HEALTHGATE FASS ECG API test failed: HTTP ${status} ${statusText}\n${errorMessage}`);
      } else {
        alert('HEALTHGATE FASS ECG API test failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
      
      <p>Patient ID: {fhirClient?.patient?.id || 'Not available'}</p>

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
