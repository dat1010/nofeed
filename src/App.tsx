// src/App.tsx

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HealthCheckPage from "./pages/HealthCheckPage";

const App: React.FC = () => {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* Health check route */}
          <Route path="/healthcheck" element={<HealthCheckPage />} />
          
          {/* Placeholder for the landing page - will be created later */}
          <Route path="/" element={<div>Landing page coming soon</div>} />
          
          {/* Redirect any other routes to the home page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;

