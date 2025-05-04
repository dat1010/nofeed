import React from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const Navbar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.get('/logout');
      document.cookie = "id_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "id_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      document.cookie = "id_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "id_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      navigate("/");
    }
  };

  return (
    <nav className="navbar is-primary" role="navigation" aria-label="main navigation">
      <div className="container">
        <div className="navbar-brand">
          <span className="navbar-item has-text-weight-bold is-size-4">NoFeed</span>
        </div>

        <div className="navbar-menu">
          <div className="navbar-start">
            <a className="navbar-item" href="/home">
              Home
            </a>
            {/* Add more navigation items here as needed */}
          </div>

          <div className="navbar-end">
            <div className="navbar-item">
              <div className="buttons">
                <button className="button is-light" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 