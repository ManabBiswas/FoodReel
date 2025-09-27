import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// FORCE LIGHT THEME - Remove any dark mode classes
document.documentElement.classList.remove('dark')
document.body.classList.remove('dark')

// Clear localStorage and force light theme
try {
  localStorage.removeItem('theme') // Remove any existing theme
  localStorage.setItem('theme', 'light')
} catch {
  console.debug('localStorage not available')
}

// // Set light theme colors on body
// document.body.style.backgroundColor = '#ffffff'
// document.body.style.color = '#374151'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
