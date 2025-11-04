import { useState, useEffect } from 'react';
import FHIR from 'fhirclient';

interface FhirServer {
  id: string;
  name: string;
  endpoint: string;
  requiresAuth: boolean;
  clientId?: string;
  scope?: string;
}

export default function AuthPage() {
  const [authStatus, setAuthStatus] = useState<'none' | 'pending' | 'error'>('none');
  const [error, setError] = useState<string | null>(null);
  const [servers, setServers] = useState<FhirServer[]>([]);
  const [selectedServer, setSelectedServer] = useState<FhirServer | null>(null);

  useEffect(() => {
    const loadServers = async () => {
      try {
        const response = await fetch('/config/fhir-servers.json');
        const data = await response.json();
        setServers(data.endpoints);
        setSelectedServer(data.endpoints[0]);
      } catch (error) {
        console.error('Failed to load servers:', error);
        setError('Failed to load FHIR servers configuration');
      }
    };

    loadServers();
  }, []);

  useEffect(() => {
    const checkFhirAuth = async () => {
      try {
        setAuthStatus('pending');
        const client = await FHIR.oauth2.ready();
        console.log('FHIR Client authenticated:', client);
        window.location.href = window.location.origin + '/home';
      } catch (error) {
        setAuthStatus('none');
        console.log('No FHIR authentication found, ready to start auth flow');
      }
    };

    checkFhirAuth();
  }, []);

  const startAuthentication = async () => {
    if (!selectedServer) {
      setError('Please select a FHIR server');
      return;
    }

    try {
      setAuthStatus('pending');
      setError(null);

      sessionStorage.setItem('selectedFhirServer', JSON.stringify(selectedServer));

      if (!selectedServer.requiresAuth) {
        console.log('No authentication required, redirecting to home');
        window.location.href = window.location.origin + '/home';
        return;
      }

      await FHIR.oauth2.authorize({
        clientId: selectedServer.clientId || '',
        scope: selectedServer.scope || '',
        redirectUri: window.location.origin + '/home',
        iss: selectedServer.endpoint,
        completeInTarget: true
      });
    } catch (error) {
      setAuthStatus('error');
      setError(error instanceof Error ? error.message : 'Authentication failed');
      console.error('FHIR Auth error:', error);
    }
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

  if (authStatus === 'pending') {
    return (
      <div style={containerStyle}>
        <h1>Authenticating...</h1>
      </div>
    );
  }

  if (authStatus === 'none') {
    return (
      <div style={containerStyle}>
        <h1>FHIR ECG <br/> Practioner Authentication</h1>
        
        {error && (
          <div style={{ color: 'red', marginBottom: '20px' }}>
            Error: {error}
          </div>
        )}

        {servers.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="server" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Select FHIR Server:
            </label>
            <select
              id="server"
              value={selectedServer?.name || ''}
              onChange={(e) => {
                const server = servers.find(s => s.name === e.target.value);
                setSelectedServer(server || null);
              }}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {servers.map((server) => (
                <option key={server.name} value={server.name}>
                  {server.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button onClick={startAuthentication} style={buttonStyle} disabled={!selectedServer}>
          Login
        </button>
      </div>
    );
  }


  // Error state
  return (
    <div style={containerStyle}>
      <h1>Authentication Error</h1>
      <p style={{ color: 'red' }}>{error}</p>
      
      <button 
        onClick={() => {
          setAuthStatus('none');
          setError(null);
        }}
        style={buttonStyle}
      >
        Try Again
      </button>
    </div>
  );
}
