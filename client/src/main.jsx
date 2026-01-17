import { BrowserRouter } from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
