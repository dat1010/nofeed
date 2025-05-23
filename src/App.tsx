// src/App.tsx

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import { getCookie } from "./utils/cookies";

// Protected route component to check authentication
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = getCookie("id_token");
  
  if (!token) {
    // Redirect to landing page if not authenticated
    return <Navigate to="/" />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route 
          path="/home" 
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } 
        />
        {/* Add other routes as needed */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;

