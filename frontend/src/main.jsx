import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import toast, { Toaster } from 'react-hot-toast';
import './index.css';

// Show only one toast at a time: dismiss whatever's on screen before showing the next.
['error', 'success', 'loading', 'custom'].forEach((method) => {
  const original = toast[method];
  toast[method] = (...args) => {
    toast.dismiss();
    return original(...args);
  };
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <AuthProvider>
          <App />
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: '#005c5b',
                color: '#fff',
                fontWeight: 'bold'
              },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
