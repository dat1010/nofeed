import React from "react";
import Navbar from "./Navbar";

type AdminLayoutProps = {
  title?: string;
  children: React.ReactNode;
};

const AdminLayout: React.FC<AdminLayoutProps> = ({ title, children }) => {
  return (
    <>
      <Navbar />
      <div className="container mt-5">
        <div className="columns">
          <div className="column is-one-quarter">
            <aside className="menu">
              <p className="menu-label">Admin</p>
              <ul className="menu-list">
                <li>
                  <a href="/admin">User Roles</a>
                </li>
                <li>
                  <a href="/admin/my-events">My Events</a>
                </li>
                <li>
                  <a href="/admin/create-event">Create Scheduled Event</a>
                </li>
              </ul>
            </aside>
          </div>
          <div className="column">
            {title && <h1 className="title">{title}</h1>}
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminLayout;
