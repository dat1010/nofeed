import React, { useState } from "react";

const LandingPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      window.location.href = "/api/login";
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    setIsLoading(true);
    try {
      window.location.href = "/api/login?mode=signup";
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