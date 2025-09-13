import React from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import ScheduledEventButton from "./ScheduledEventButton";
import Logo from "./Logo";

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
    <nav className="navbar is-primary navbar-enhanced" role="navigation" aria-label="main navigation">
      <div className="container">
        <div className="navbar-brand">
          <div className="navbar-item">
            <Logo size={32} showText={true} />
          </div>
        </div>

        <div className="navbar-menu">
          <div className="navbar-start">
            <a className="navbar-item has-text-white navbar-icon" href="/home">
              <span className="icon">
                <i className="fas fa-home"></i>
              </span>
              <span>Home</span>
            </a>
            <a className="navbar-item has-text-white navbar-icon" href="/my-events">
              <span className="icon">
                <i className="fas fa-calendar-alt"></i>
              </span>
              <span>My Events</span>
            </a>
            <a className="navbar-item has-text-white navbar-icon" href="https://discourse.nofeed.zone/" target="_blank" rel="noopener noreferrer">
              <span className="icon">
                <i className="fas fa-comments"></i>
              </span>
              <span>Community</span>
            </a>
            {/* Add more navigation items here as needed */}
          </div>

          <div className="navbar-end">
            <div className="navbar-item">
              <ScheduledEventButton />
            </div>
            <div className="navbar-item">
              <div className="buttons">
                <button className="button is-light" onClick={handleLogout}>
                  <span className="icon">
                    <i className="fas fa-sign-out-alt"></i>
                  </span>
                  <span>Logout</span>
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