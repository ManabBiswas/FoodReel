import './App.css'
import AppRoutes from './routes/AppRoutes'
import { AuthProvider } from './Contexts/AuthContext'

function App() {

  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
