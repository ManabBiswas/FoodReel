import './App.css'
import AppRoutes from './routes/AppRoutes'
import { AuthProvider } from './Contexts/AuthContext'
import { CartProvider } from './Contexts/CartContext'
import { PartnerDataProvider } from './Contexts/PartnerDataContext'
import { Toaster } from 'react-hot-toast'

function App() {

  return (
    <AuthProvider>
      <CartProvider>
        <PartnerDataProvider>
          <AppRoutes />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1f2937',
                color: '#f9fafb',
              },
            }}
          />
        </PartnerDataProvider>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
