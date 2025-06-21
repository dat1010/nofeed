import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCookie } from "../utils/cookies";
import Logo from "../components/Logo";

const LandingPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  // Redirect to /home if id_token cookie is present and accessible via JS
  useEffect(() => {
    // Only redirect if we're exactly on the root path
    if (window.location.pathname === "/" || window.location.pathname === "") {
      const token = getCookie("id_token");
      if (token) {
        navigate("/home");
      }
    }
  }, [navigate]);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      window.location.href = "https://api.nofeed.zone/api/login";
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    setIsLoading(true);
    try {
      window.location.href = "https://api.nofeed.zone/api/login";
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
          <p className="subtitle is-4 has-text-light mb-6 tagline-glow">An experimental social network that breaks free from endless feeds.</p>
          
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
          </div>
          
          <div className="mt-6">
            <p className="has-text-light is-size-7 tagline-glow">
              Break free from the algorithm. Connect meaningfully.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingPage;
