// src/App.tsx

import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import CreateEventPage from "./pages/CreateEventPage";
import UserEventsPage from "./pages/UserEventsPage";
import HealthCheckPage from "./pages/HealthCheckPage";
import CommunityPage from "./pages/CommunityPage";
import { getValidToken, redirectToLogin } from "./utils/auth";
import "./styles/logo.css";

// Protected route component to check authentication
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = getValidToken();
  
  if (!token) {
    redirectToLogin();
    return null;
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
          path="/community" 
          element={
            <ProtectedRoute>
              <CommunityPage />
            </ProtectedRoute>
          } 
        />
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
