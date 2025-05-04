import React from "react";
import { useNavigate } from "react-router-dom";

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Remove the id_token cookie by setting its expiry to the past
    document.cookie = "id_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    navigate("/");
  };

  return (
    <>
      <nav className="navbar is-light" role="navigation" aria-label="main navigation">
        <div className="navbar-brand">
          <span className="navbar-item has-text-weight-bold">NoFeed</span>
        </div>
        <div className="navbar-menu">
          <div className="navbar-end">
            <div className="navbar-item">
              <button className="button is-danger" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <div className="container mt-5">
        <h1 className="title is-2">Welcome to NoFeed Home</h1>
        <p className="subtitle">Your distraction-free zone</p>
        
        {/* Add your home page content here */}
      </div>
    </>
  );
};

export default HomePage;
