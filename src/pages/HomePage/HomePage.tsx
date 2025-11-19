import { useState, useEffect } from 'react';
import FHIR from 'fhirclient';
import type { Practitioner } from 'fhir/r4';
import type Client from 'fhirclient/lib/Client';
import { fhirService } from '../../services/fhirService';
import fhirLogo from '/src/assets/pulse-fhir.png';

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
      alert('Por favor, insira um caminho de recurso FHIR');
      return;
    }

    try {
      const resourceData = await fhirClient.request(resourcePath);
      
      console.log('FHIR Resource Data:', resourceData);
      
      let message = 'Recurso FHIR recuperado com sucesso!\n\n';
      message += `Tipo de Recurso: ${resourceData.resourceType || 'N/A'}\n`;
      message += `ID: ${resourceData.id || 'N/A'}\n`;
      message += `\nResposta Completa:\n${JSON.stringify(resourceData, null, 2)}`;
      
      alert(message);
      
    } catch (error) {
      console.error('FHIR API test failed:', error);
      alert('Teste de API FHIR falhou: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

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

  const pageContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #eef3f9 100%)',
    padding: '40px 20px',
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
    display: 'flex',
    flexDirection: 'column',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '24px',
    borderBottom: '2px solid #e0e8f5',
    paddingBottom: '10px',
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

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#0a3d91',
    marginBottom: '8px',
    marginTop: 0,
  };

  const serverBoxStyle: React.CSSProperties = {
    marginBottom: '16px',
    backgroundColor: '#f8fbfd',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #e0e8f5',
  };

  const serverInfoStyle: React.CSSProperties = {
    color: '#333',
    fontSize: '0.9rem',
    margin: 0,
  };

  const practitionerBoxStyle: React.CSSProperties = {
    marginBottom: '16px',
    backgroundColor: '#f8fbfd',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #e0e8f5',
  };

  const fieldStyle: React.CSSProperties = {
    fontSize: '0.85rem',
    marginBottom: '6px',
    color: '#333',
  };

  const testServerButtonStyle: React.CSSProperties = {
    width: '100%',
    background: '#6c757d',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 600,
    transition: 'all 0.2s ease',
    marginBottom: '20px',
  };

  const bottomButtonContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '10px',
    marginTop: 'auto',
    paddingTop: '20px',
    borderTop: '1px solid #e0e8f5',
  };

  const buttonStyle: React.CSSProperties = {
    flex: 1,
    background: '#0a3d91',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 600,
    transition: 'all 0.2s ease',
  };

  const dashboardButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: '#0a3d91',
  };

  const logoutButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: '#6c757d',
  };

  const loadingTextStyle: React.CSSProperties = {
    fontSize: '1.2rem',
    color: '#0a3d91',
    textAlign: 'center',
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

  if (loading) {
    return (
      <div style={pageContainerStyle}>
        <div style={contentBoxStyle}>
          <div style={headerStyle}>
            <img src={fhirLogo} alt="FHIR Logo" style={logoStyle} />
            <h1 style={appTitleStyle}>PULSE-FHIR</h1>
          </div>
          <p style={loadingTextStyle}>Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={pageContainerStyle}>
        <div style={contentBoxStyle}>
          <div style={headerStyle}>
            <img src={fhirLogo} alt="FHIR Logo" style={logoStyle} />
            <h1 style={appTitleStyle}>PULSE-FHIR</h1>
          </div>
          <h2 style={sectionTitleStyle}>Erro</h2>
          <div style={errorBoxStyle}>{error}</div>
          <button 
            onClick={() => window.location.href = '/'}
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
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageContainerStyle}>
      <div style={contentBoxStyle}>
        <div style={headerStyle}>
          <img src={fhirLogo} alt="FHIR Logo" style={logoStyle} />
          <h1 style={appTitleStyle}>PULSE-FHIR</h1>
        </div>
        
        <div style={{ flex: 1 }}>
          {selectedServer && (
            <div>
              <h3 style={sectionTitleStyle}>Servidor: {selectedServer.name}</h3>
            </div>
          )}
          
          {practitioner && (
            <div>
              <h3 style={sectionTitleStyle}>Profissional</h3>
              <div style={practitionerBoxStyle}>
                <p style={fieldStyle}><strong>ID:</strong> {practitioner.id || 'N/A'}</p>
                <p style={fieldStyle}><strong>Tipo de Recurso:</strong> {practitioner.resourceType || 'N/A'}</p>
                
                {practitioner.name && practitioner.name.length > 0 && (
                  <p style={fieldStyle}>
                    <strong>Nome:</strong>{' '}
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
                  <p style={fieldStyle}>
                    <strong>Identificadores:</strong>{' '}
                    {practitioner.identifier.map((id, i) => (
                      <span key={i}>
                        {id.system ? `${id.system}: ` : ''}{id.value || 'N/A'}
                        {i < practitioner.identifier!.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </p>
                )}
                
                {practitioner.telecom && practitioner.telecom.length > 0 && (
                  <p style={fieldStyle}>
                    <strong>Contato:</strong>{' '}
                    {practitioner.telecom.map((t, i) => (
                      <span key={i}>
                        {t.system ? `${t.system}: ` : ''}{t.value || 'N/A'}
                        {i < practitioner.telecom!.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </p>
                )}
                
                {practitioner.gender && (
                  <p style={fieldStyle}><strong>Gênero:</strong> {practitioner.gender}</p>
                )}
                
                {practitioner.birthDate && (
                  <p style={fieldStyle}><strong>Data de Nascimento:</strong> {practitioner.birthDate}</p>
                )}
                
                {practitioner.address && practitioner.address.length > 0 && (
                  <p style={fieldStyle}>
                    <strong>Endereço:</strong>{' '}
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
                  <p style={fieldStyle}>
                    <strong>Qualificações:</strong>{' '}
                    {practitioner.qualification.map((q, i) => (
                      <span key={i}>
                        {q.code?.coding?.[0]?.display || q.code?.text || 'N/A'}
                        {i < practitioner.qualification!.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </p>
                )}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <input
              id="resourcePath"
              type="text"
              value={resourcePath}
              onChange={(e) => setResourcePath(e.target.value)}
              placeholder="/Observation/123 ou /Patient/456"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '0.9rem',
                border: '1px solid #cfe0ee',
                borderRadius: '8px',
                backgroundColor: '#f8fbfd',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: '10px',
              }}
            />
            <button 
              onClick={testFhirApi} 
              style={testServerButtonStyle}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#5a6268';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(108, 117, 125, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#6c757d';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Testar Servidor
            </button>
          </div>
        </div>

        <div style={bottomButtonContainerStyle}>
          <button 
            onClick={goToDashboard} 
            style={dashboardButtonStyle}
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
            Dashboard
          </button>
          
          <button 
            onClick={logout} 
            style={logoutButtonStyle}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#5a6268';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(108, 117, 125, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#6c757d';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
