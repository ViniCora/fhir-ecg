import './App.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AuthPage from './pages/AuthPage/AuthPage'
import HomePage from './pages/HomePage/HomePage'
import DashboardEcgPage from './pages/DashboardEcgPage/DashboardEcgPage'
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

const queryClient = new QueryClient()

function App() {
  return (
    <div style={{ width: '100%' }}>
      <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Routes>
              {/* SMART on FHIR Authentication */}
              <Route path="/" element={<AuthPage />} />
              <Route path="/auth" element={<AuthPage />} />
              
              {/* TODO: Protect authenticated routes */}
              <Route path="/home" element={<HomePage />} />
              <Route path="/dashboard" element={<DashboardEcgPage />} />
            </Routes>
          </BrowserRouter>
      </QueryClientProvider>
    </div>
  )
}

export default App
