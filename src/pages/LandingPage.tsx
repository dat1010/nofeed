import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { redirectToLogin, refreshSession } from "../utils/auth";
import Logo from "../components/Logo";

const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === "development") {
    return "/api";
  }
  return "https://api.nofeed.zone/api";
};

const LandingPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  // Redirect to /home if access_token cookie is valid (server-checked)
  useEffect(() => {
    // Only redirect if we're exactly on the root path
    if (window.location.pathname === "/" || window.location.pathname === "") {
      const checkAuth = async () => {
        try {
          const res = await fetch(`${getApiBaseUrl()}/me`, {
            credentials: "include",
          });
          if (res.ok) {
            navigate("/home");
            return;
          }
          const refreshed = await refreshSession();
          if (refreshed) {
            const res2 = await fetch(`${getApiBaseUrl()}/me`, {
              credentials: "include",
            });
            if (res2.ok) {
              navigate("/home");
            }
          }
        } catch {
          // no-op, stay on landing
        }
      };
      checkAuth();
    }
  }, [navigate]);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      redirectToLogin();
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    setIsLoading(true);
    try {
      redirectToLogin();
    } catch (error) {
      console.error("Signup error:", error);
      setIsLoading(false);
    }
  };

  return (
    <section className="hero is-fullheight landing-hero">
      <div className="hero-body">
        <div className="container has-text-centered">
          {/* Logo */}
          <div className="mb-6" style={{ display: 'flex', justifyContent: 'center' }}>
            <Logo size={120} showText={false} animated={true} />
          </div>
          
          <h1 className="title is-1 has-text-white mb-4">Welcome to NoFeed</h1>
          <p className="subtitle is-4 has-text-light mb-6 tagline-glow">An experimental social network. Where you have no feeed, but you search for content.</p>
          
          <div className="buttons is-centered mt-5">
            <button 
              onClick={handleLogin} 
              className={`button is-primary is-medium nofeed-button ${isLoading ? 'is-loading' : ''}`}
              disabled={isLoading}
            >
              <span className="icon">
                <i className="fas fa-sign-in-alt"></i>
              </span>
              <span>Log In</span>
            </button>
            <button 
              onClick={handleSignup} 
              className={`button is-light is-medium ${isLoading ? 'is-loading' : ''}`}
              disabled={isLoading}
            >
              <span className="icon">
                <i className="fas fa-user-plus"></i>
              </span>
              <span>Sign Up</span>
            </button>
            <a
              href="https://discourse.nofeed.zone/?utm_source=app&utm_medium=landing&utm_campaign=community"
              target="_blank"
              rel="noopener noreferrer"
              className="button is-link is-medium"
            >
              <span className="icon">
                <i className="fas fa-comments"></i>
              </span>
              <span>Community Forum</span>
            </a>
          </div>
          
          <div className="mt-6">
            <p className="has-text-light is-size-7 tagline-glow">
              You are the algorithm.
            </p>
          </div>
          <div className="mt-3">
            <a
              href="https://discourse.nofeed.zone/?utm_source=app&utm_medium=landing_footer&utm_campaign=community"
              target="_blank"
              rel="noopener noreferrer"
              className="is-size-7 has-text-info"
            >
              Have questions? Join the Community Forum
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingPage;
