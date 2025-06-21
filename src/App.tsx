// src/App.tsx

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import CreateEventPage from "./pages/CreateEventPage";
import UserEventsPage from "./pages/UserEventsPage";
import HealthCheckPage from "./pages/HealthCheckPage";
import { getCookie } from "./utils/cookies";
import "./styles/logo.css";

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
        <Route path="/healthcheck" element={<HealthCheckPage />} />
        <Route 
          path="/home" 
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/create-event" 
          element={
            <ProtectedRoute>
              <CreateEventPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-events" 
          element={
            <ProtectedRoute>
              <UserEventsPage />
            </ProtectedRoute>
          } 
        />
        {/* Add other routes as needed */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;

