import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add error handling to help diagnose the white screen issue
window.onerror = function(message, source, lineno, colno, error) {
  console.error('Application error:', { message, source, lineno, colno, error });
  
  // Show error on screen instead of white screen
  const errorElement = document.createElement('div');
  errorElement.style.padding = '20px';
  errorElement.style.maxWidth = '800px';
  errorElement.style.margin = '0 auto';
  errorElement.innerHTML = `
    <h1 style="color: #e53e3e;">Application Error</h1>
    <p><strong>Message:</strong> ${message}</p>
    <p><strong>Source:</strong> ${source}</p>
    <p><strong>Line:</strong> ${lineno}, <strong>Column:</strong> ${colno}</p>
    <pre style="background: #f7fafc; padding: 15px; border-radius: 5px; overflow: auto;">${error?.stack || 'No stack trace available'}</pre>
    <button onclick="localStorage.clear(); sessionStorage.clear(); location.reload();" 
            style="padding: 8px 16px; background: #3182ce; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 20px;">
      Clear Storage & Reload
    </button>
  `;
  
  // Only append if there's no error display yet
  if (!document.querySelector('[data-error-display]')) {
    errorElement.setAttribute('data-error-display', 'true');
    document.body.appendChild(errorElement);
  }
  
  return true; // Prevents the default error handling
};

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)