import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bulma/css/bulma.min.css'; // Import Bulma CSS
import './index.css'; // Your custom styles
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
