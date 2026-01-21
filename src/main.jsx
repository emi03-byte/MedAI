import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

try {
  const root = ReactDOM.createRoot(document.getElementById('root'))
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
} catch (error) {
  console.error('Error rendering app:', error)
  document.getElementById('root').innerHTML = `
    <div style="padding: 20px; color: red;">
      <h1>Eroare la încărcarea aplicației</h1>
      <p>${error.message}</p>
      <pre>${error.stack}</pre>
    </div>
  `
}

// Unregister service worker if previously registered
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
    }
  });
}