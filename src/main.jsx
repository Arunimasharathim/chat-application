import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import AppContextProvider from './context/AppContext.jsx'

// ✅ Detect password reset link from Firebase
const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get("mode");
const oobCode = urlParams.get("oobCode");

if (mode === "resetPassword" && oobCode) {
  // 🔁 Redirect to a clean route to handle password reset
  window.location.href = `/reset-password?oobCode=${oobCode}`;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AppContextProvider>
      <App />
    </AppContextProvider>
  </BrowserRouter>
)
