import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App'; // Importamos el componente como App (mayúscula)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App /> {/* Aquí lo usamos como App (mayúscula) */}
    </BrowserRouter>
  </React.StrictMode>
);