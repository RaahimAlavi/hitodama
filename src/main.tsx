import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

// Lock transparent background before React's first paint to prevent white/grey window flash in Electron
if (typeof window !== 'undefined' && (window as any).hitodamaAPI) {
  document.documentElement.style.background = 'transparent';
  document.body.style.background = 'transparent';
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <App />
);