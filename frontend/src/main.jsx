import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import app from './app'; // <-- Minúscula

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <app /> {/* <-- Minúscula aquí también */}
    </BrowserRouter>
  </React.StrictMode>
);