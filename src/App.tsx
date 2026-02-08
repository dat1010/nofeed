// src/App.tsx

import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import CreateEventPage from "./pages/CreateEventPage";
import UserEventsPage from "./pages/UserEventsPage";
import HealthCheckPage from "./pages/HealthCheckPage";
import CommunityPage from "./pages/CommunityPage";
import AdminPage from "./pages/AdminPage";
import { redirectToLogin, refreshSession } from "./utils/auth";
import "./styles/logo.css";

const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === "development") {
    return "/api";
  }
  return "https://api.nofeed.zone/api";
};

// Protected route component to check authentication
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    const checkAuth = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/me`, {
          credentials: "include",
        });
        if (!active) {
          return;
        }
        if (res.ok) {
          setIsAuthed(true);
          return;
        }
        const refreshed = await refreshSession();
        if (!active) {
          return;
        }
        if (refreshed) {
          const res2 = await fetch(`${getApiBaseUrl()}/me`, {
            credentials: "include",
          });
          setIsAuthed(res2.ok);
        } else {
          setIsAuthed(false);
        }
      } catch {
        if (!active) {
          return;
        }
        setIsAuthed(false);
      }
    };
    checkAuth();
    return () => {
      active = false;
    };
  }, []);

  if (isAuthed === null) {
    return null;
  }

  if (!isAuthed) {
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
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          } 
        />
        {/* Add other routes as needed */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
