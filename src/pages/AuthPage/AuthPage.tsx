import { useState, useEffect } from 'react';
import FHIR from 'fhirclient';
import fhirLogo from '/src/assets/pulse-fhir.png';

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
        setError('Falha ao carregar configuração dos servidores FHIR');
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
      setError('Por favor, selecione um servidor FHIR');
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
      setError(error instanceof Error ? error.message : 'Falha na autenticação');
      console.error('FHIR Auth error:', error);
    }
  };


  const pageContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #eef3f9 100%)',
    padding: '40px',
    boxSizing: 'border-box',
  };

  const contentBoxStyle: React.CSSProperties = {
    maxWidth: '500px',
    width: '100%',
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    padding: '32px 40px',
    animation: 'fadeIn 0.6s ease',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
    borderBottom: '2px solid #e0e8f5',
    paddingBottom: '16px',
  };

  const headerTopStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '8px',
  };

  const logoStyle: React.CSSProperties = {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    objectFit: 'cover',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
  };

  const appTitleStyle: React.CSSProperties = {
    fontSize: '1.6rem',
    fontWeight: 700,
    color: '#0a3d91',
    fontFamily: '"Inter", sans-serif',
    letterSpacing: '0.5px',
    margin: 0,
  };

  const platformSubtitleStyle: React.CSSProperties = {
    fontSize: '0.9rem',
    fontWeight: 400,
    color: '#666',
    margin: 0,
    textAlign: 'center',
    lineHeight: '1.4',
  };

  const infoMessageStyle: React.CSSProperties = {
    fontSize: '0.95rem',
    backgroundColor: '#f0f4ff',
    borderLeft: '4px solid #0a3d91',
    borderRadius: '8px',
    margin: '8px 0',
    padding: '10px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#333',
    marginBottom: '20px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 600,
    color: '#333',
    fontSize: '0.95rem',
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    fontSize: '1rem',
    border: '1px solid #cfe0ee',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: '#f8fbfd',
    transition: 'all 0.2s ease',
    outline: 'none',
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    background: '#0a3d91',
    color: 'white',
    border: 'none',
    padding: '14px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 600,
    marginTop: '20px',
    transition: 'all 0.2s ease',
  };

  const errorBoxStyle: React.CSSProperties = {
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '16px',
    color: '#c33',
    fontSize: '0.95rem',
  };

  const loadingTextStyle: React.CSSProperties = {
    fontSize: '1.2rem',
    color: '#0a3d91',
    textAlign: 'center',
  };

  if (authStatus === 'pending') {
    return (
      <div style={pageContainerStyle}>
        <div style={contentBoxStyle}>
          <div style={headerStyle}>
            <div style={headerTopStyle}>
              <img src={fhirLogo} alt="FHIR Logo" style={logoStyle} />
              <h1 style={appTitleStyle}>PULSE-FHIR</h1>
            </div>
            <p style={platformSubtitleStyle}>Plataforma Unificada de Leituras de Sinais ECG em FHIR</p>
          </div>
          <p style={loadingTextStyle}>Autenticando...</p>
        </div>
      </div>
    );
  }

  if (authStatus === 'none') {
    return (
      <div style={pageContainerStyle}>
        <div style={contentBoxStyle}>
          <div style={headerStyle}>
            <div style={headerTopStyle}>
              <img src={fhirLogo} alt="FHIR Logo" style={logoStyle} />
              <h1 style={appTitleStyle}>PULSE-FHIR</h1>
            </div>
            <p style={platformSubtitleStyle}>Plataforma Unificada de Leituras de Sinais ECG em FHIR</p>
          </div>
          
          {servers.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="server" style={labelStyle}>
                Selecione o Servidor FHIR:
              </label>
              <select
                id="server"
                value={selectedServer?.name || ''}
                onChange={(e) => {
                  const server = servers.find(s => s.name === e.target.value);
                  setSelectedServer(server || null);
                }}
                style={selectStyle}
              >
                {servers.map((server) => (
                  <option key={server.name} value={server.name}>
                    {server.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedServer?.requiresAuth && (
            <div style={infoMessageStyle}>
              <strong>ℹ️ Autenticação necessária</strong>
            </div>
          )}
          
          {error && (
            <div style={errorBoxStyle}>
              <strong>Erro:</strong> {error}
            </div>
          )}

          <button 
            onClick={startAuthentication} 
            style={buttonStyle}
            disabled={!selectedServer}
            onMouseOver={(e) => {
              if (selectedServer) {
                e.currentTarget.style.background = '#083066';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(10, 61, 145, 0.3)';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#0a3d91';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageContainerStyle}>
      <div style={contentBoxStyle}>
        <div style={headerStyle}>
          <div style={headerTopStyle}>
            <img src={fhirLogo} alt="FHIR Logo" style={logoStyle} />
            <h1 style={appTitleStyle}>PULSE-FHIR</h1>
          </div>
          <p style={platformSubtitleStyle}>Plataforma Unificada de Leituras de Sinais ECG em FHIR</p>
        </div>
        
        <div style={infoMessageStyle}>
          <strong>⚠️ Erro de Autenticação</strong>
        </div>
        
        <div style={errorBoxStyle}>
          {error}
        </div>
        
        <button 
          onClick={() => {
            setAuthStatus('none');
            setError(null);
          }}
          style={buttonStyle}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#083066';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(10, 61, 145, 0.3)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = '#0a3d91';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Tentar Novamente
        </button>
      </div>
    </div>
  );
}
