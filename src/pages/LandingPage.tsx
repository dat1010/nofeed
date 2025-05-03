import React, { useState, useEffect } from "react";

// Helper to get a cookie value by name - moved outside component
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

const LandingPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  // Removed unused state variable: idToken

  // Redirect to /home if id_token cookie is present and accessible via JS
  useEffect(() => {
    // Only redirect if we're on the landing page, not already on /home
    if (window.location.pathname !== "/home") {
      const token = getCookie("id_token");
      if (token) {
        // Removed setting unused state
        window.location.href = "/home";
      }
    }
  }, []);

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
    <section className="hero is-fullheight">
      <div className="hero-body">
        <div className="container has-text-centered">
          <h1 className="title is-2">Welcome to NoFeed</h1>
          <p className="subtitle">A distraction-free zone for focused productivity and mindful browsing.</p>
          
          <div className="buttons is-centered mt-5">
            <button 
              onClick={handleLogin} 
              className={`button is-primary ${isLoading ? 'is-loading' : ''}`}
              disabled={isLoading}
            >
              Log In
            </button>
            <button 
              onClick={handleSignup} 
              className={`button is-light ${isLoading ? 'is-loading' : ''}`}
              disabled={isLoading}
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingPage;