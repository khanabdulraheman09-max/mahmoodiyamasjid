import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { PrayerProvider } from './context/PrayerContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <PrayerProvider>
        <App />
      </PrayerProvider>
    </AuthProvider>
  </React.StrictMode>
);
