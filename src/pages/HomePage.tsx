import React from "react";

const HomePage: React.FC = () => {
  return (
    <section className="hero is-fullheight is-primary">
      <div className="hero-body">
        <div className="container has-text-centered">
          <h1 className="title is-2">Welcome Home!</h1>
          <p className="subtitle">You are now logged in to NoFeed.</p>
        </div>
      </div>
    </section>
  );
};

export default HomePage;
