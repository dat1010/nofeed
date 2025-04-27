// src/App.tsx

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HealthCheckPage from "./pages/HealthCheckPage";
import LandingPage from "./pages/LandingPage";

const App: React.FC = () => {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* Health check route */}
          <Route path="/healthcheck" element={<HealthCheckPage />} />
          
          {/* Auth0 callback handler - this will receive the callback from your API */}
          <Route path="/callback" element={<Navigate to="/" replace />} />
          
          {/* Landing page */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Redirect any other routes to the home page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;

