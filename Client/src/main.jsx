import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// The app ships light-only. Keep the preference under a versioned key so a
// future theme can migrate without guessing what an old key meant.
const THEME_KEY = 'foodreel:theme:v1'
const LEGACY_THEME_KEY = 'theme'

document.documentElement.classList.remove('dark')
document.body.classList.remove('dark')

try {
  const legacyTheme = localStorage.getItem(LEGACY_THEME_KEY)
  if (legacyTheme !== null) localStorage.removeItem(LEGACY_THEME_KEY)

  if (!localStorage.getItem(THEME_KEY)) {
    localStorage.setItem(THEME_KEY, 'light')
  } else if (localStorage.getItem(THEME_KEY) !== 'light') {
    // Light is the only supported theme for now, including migrated values.
    localStorage.setItem(THEME_KEY, 'light')
  }
} catch {
  console.debug('localStorage not available')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
