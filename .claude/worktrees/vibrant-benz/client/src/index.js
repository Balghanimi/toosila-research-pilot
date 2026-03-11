import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { initializeSentry } from './config/sentry';
import ErrorBoundary from './components/ErrorBoundary';

// Initialize Sentry for error tracking
initializeSentry();

// تسجيل Service Worker للـ Push Notifications
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('[SW] Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('[SW] Registration failed:', error);
    }
  } else {
    console.warn('[SW] Push notifications not supported');
  }
};

// استدعاء عند تحميل التطبيق
if (process.env.NODE_ENV === 'production') {
  registerServiceWorker();
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
