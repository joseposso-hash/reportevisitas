import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import app from './app'; // <-- Verifica que sea 'app' en minúscula

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <app /> {/* <-- Verifica que sea 'app' en minúscula */}
    </BrowserRouter>
  </React.StrictMode>
);