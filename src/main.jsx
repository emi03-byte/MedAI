import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

try {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/cf22f2ee-2fc6-4f7d-a6e7-95c0aad9a0ae',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:6',message:'Starting app render',data:{rootExists:!!document.getElementById('root')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const root = ReactDOM.createRoot(document.getElementById('root'))
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/cf22f2ee-2fc6-4f7d-a6e7-95c0aad9a0ae',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:9',message:'Root created, calling render',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/cf22f2ee-2fc6-4f7d-a6e7-95c0aad9a0ae',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:13',message:'Render call completed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
} catch (error) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/cf22f2ee-2fc6-4f7d-a6e7-95c0aad9a0ae',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:15',message:'Error in main.jsx',data:{errorMessage:error.message,errorStack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
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