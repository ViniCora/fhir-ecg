import { useState, useEffect } from 'react';
import FHIR from 'fhirclient';
import type { Practitioner } from 'fhir/r4';
import type Client from 'fhirclient/lib/Client';
import { fhirService } from '../../services/fhirService';

interface FhirServer {
  id: string;
  name: string;
  endpoint: string;
  requiresAuth: boolean;
  clientId?: string;
  scope?: string;
}

export default function HomePage() {
  const [fhirClient, setFhirClient] = useState<Client | null>(null);
  const [practitioner, setPractitioner] = useState<Practitioner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resourcePath, setResourcePath] = useState<string>('/Observation/68e2b8588f0a1bdd34808a93');
  const [selectedServer, setSelectedServer] = useState<FhirServer | null>(null);

  useEffect(() => {
    const initializeFhirClient = async () => {
      try {
        const serverData = sessionStorage.getItem('selectedFhirServer');
        if (!serverData) {
          console.error('No server selected');
          window.location.href = '/';
          return;
        }

        const server: FhirServer = JSON.parse(serverData);
        setSelectedServer(server);

        if (server.requiresAuth) {
          const client = await FHIR.oauth2.ready();
          setFhirClient(client);
          fhirService.setClient(client);
          console.log('FHIR Client authenticated:', client);
          
          try {
            const practitionerData = await client.user.read();
            setPractitioner(practitionerData as Practitioner);
            console.log('Practitioner data:', practitionerData);
          } catch (practitionerError) {
            console.warn('Could not fetch practitioner data:', practitionerError);
          }
        } else {
          const client = FHIR.client(server.endpoint);
          setFhirClient(client);
          fhirService.setClient(client);
          console.log('FHIR Client initialized (no auth):', client);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('FHIR initialization failed:', error);
        window.location.href = '/';
      }
    };

    initializeFhirClient();
  }, []);

  const testFhirApi = async () => {
    if (!fhirClient) return;

    if (!resourcePath.trim()) {
      alert('Please enter a FHIR resource path');
      return;
    }

    try {
      const resourceData = await fhirClient.request(resourcePath);
      
      console.log('FHIR Resource Data:', resourceData);
      
      let message = 'FHIR Resource retrieved successfully!\n\n';
      message += `Resource Type: ${resourceData.resourceType || 'N/A'}\n`;
      message += `ID: ${resourceData.id || 'N/A'}\n`;
      message += `\nFull Response:\n${JSON.stringify(resourceData, null, 2)}`;
      
      alert(message);
      
    } catch (error) {
      console.error('FHIR API test failed:', error);
      alert('FHIR API test failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Navigate to dashboard
  const goToDashboard = () => {
    window.location.href = '/dashboard';
  };

  const logout = () => {
    setFhirClient(null);
    setError(null);

    const smartKey = sessionStorage.getItem('SMART_KEY');
    if (smartKey) {
      const cleanKey = smartKey.slice(1, -1);
      sessionStorage.removeItem(cleanKey);
      sessionStorage.removeItem('SMART_KEY');
    }

    Object.keys(localStorage).forEach(key => {
      if (key.includes('FHIR') || key.includes('oauth')) {
        localStorage.removeItem(key);
      }
    });

    Object.keys(sessionStorage).forEach(key => {
      if (key.includes('FHIR') || key.includes('oauth') || key === 'selectedFhirServer') {
        sessionStorage.removeItem(key);
      }
    });

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
      
      {selectedServer && (
        <p style={{ marginBottom: '20px', color: '#666' }}>
          Connected to: <strong>{selectedServer.name}</strong>
        </p>
      )}
      
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
          onClick={logout} 
          style={{...buttonStyle, background: '#dc3545'}}
        >
          Logout
        </button>

        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            id="resourcePath"
            type="text"
            value={resourcePath}
            onChange={(e) => setResourcePath(e.target.value)}
            placeholder="/Observation/123 or /Patient/456"
            style={{
              flex: 1,
              padding: '10px',
              fontSize: '14px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />
          <button 
            onClick={testFhirApi} 
            style={{...buttonStyle, background: '#17a2b8', margin: '0'}}
          >
            Test API
          </button>
        </div>
      </div>
    </div>
  );
}
