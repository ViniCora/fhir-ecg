import './App.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import FetchTestPage from './pages/FetchTestPage/FetchTestPage'
import DashboardEcgPage from './pages/DashboardEcgPage/DashboardEcgPage'

const queryClient = new QueryClient()

function App() {
  return (
    <div style={{ width: '100%' }}>
      <QueryClientProvider client={queryClient}>
        <FetchTestPage/>
        <DashboardEcgPage />
      </QueryClientProvider>
    </div>
  )
}

export default App
