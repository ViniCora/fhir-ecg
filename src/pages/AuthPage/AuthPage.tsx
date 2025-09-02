import { useState, useEffect } from 'react';
import FHIR from 'fhirclient';

export default function AuthPage() {
  const [authStatus, setAuthStatus] = useState<'none' | 'pending' | 'error'>('none');
  const [error, setError] = useState<string | null>(null);

  // Check for FHIR authentication callback on component mount
  useEffect(() => {
    const checkFhirAuth = async () => {
      try {
        setAuthStatus('pending');
        const client = await FHIR.oauth2.ready();
        console.log('FHIR Client authenticated:', client);
        // Redirect to home page after successful authentication
        window.location.href = '/home';
      } catch (error) {
        setAuthStatus('none');
        console.log('No FHIR authentication found, ready to start auth flow');
      }
    };

    checkFhirAuth();
  }, []);

  // Start FHIR OAuth2 authentication flow
  const startAuthentication = async () => {
    try {
      setAuthStatus('pending');
      setError(null);

      await FHIR.oauth2.authorize({
        clientId: 'adriano-utfpr',
        scope: 'patient/*.rs',
        redirectUri: window.location.origin + '/auth',
        iss: 'https://if4health.charqueadas.ifsul.edu.br/biosignalinfhir',
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
        <h1>FHIR ECG Authentication</h1>
        
        {error && (
          <div style={{ color: 'red', marginBottom: '20px' }}>
            Error: {error}
          </div>
        )}

        <button onClick={startAuthentication} style={buttonStyle}>
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
