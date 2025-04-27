import React, { useState } from "react";

const LandingPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // Call your API's login endpoint
      window.location.href = "/api/login";
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    setIsLoading(true);
    try {
      // You might want to add a signup parameter to differentiate from login
      window.location.href = "/api/login?mode=signup";
    } catch (error) {
      console.error("Signup error:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="landing-page">
      <h1>Welcome to NoFeed</h1>
      <p>A distraction-free zone for focused productivity and mindful browsing.</p>
      
      <div className="auth-buttons">
        <button 
          onClick={handleLogin} 
          className="login-button"
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Log In"}
        </button>
        <button 
          onClick={handleSignup} 
          className="signup-button"
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Sign Up"}
        </button>
      </div>
    </div>
  );
};

export default LandingPage;