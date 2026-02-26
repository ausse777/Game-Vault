import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from "react-router-dom";

<BrowserRouter basename={import.meta.env.BASE_URL}>
  {/* routes */}
</BrowserRouter>
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { ToastProvider } from './context/ToastContext';
import './styles/app.css';

registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <App />
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);
