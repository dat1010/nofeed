import React from "react";
import Navbar from "../components/Navbar";

const HomePage: React.FC = () => {
  return (
    <>
      <Navbar />
      <div className="container mt-5">
        <h1 className="title is-2">Welcome to NoFeed Home</h1>
        <p className="subtitle">A place to explore</p>
        
        {/* Add your home page content here */}
      </div>
    </>
  );
};

export default HomePage;
