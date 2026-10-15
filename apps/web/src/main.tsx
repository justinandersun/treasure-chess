import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
// Fonts are bundled with the app (no third-party requests).
import '@fontsource-variable/inter';
import '@fontsource-variable/bricolage-grotesque/opsz.css';
import './styles/global.css';

// Offline support (production only, so development always loads fresh files).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
