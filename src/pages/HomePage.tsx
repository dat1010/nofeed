import React, { useState } from "react";
import Navbar from "../components/Navbar";
import CreatePost from "../components/CreatePost";
import PostList from "../components/PostList";
import ScheduledEventButton from "../components/ScheduledEventButton";

const HomePage: React.FC = () => {
  const [refreshPosts, setRefreshPosts] = useState(false);

  const handlePostCreated = () => {
    setRefreshPosts(!refreshPosts); // Toggle to trigger refresh
  };

  return (
    <>
      <Navbar />
      <div className="container mt-5">
        <div className="columns is-centered">
          <div className="column is-half">
            <div className="mb-5">
              <ScheduledEventButton />
            </div>
            <CreatePost onPostCreated={handlePostCreated} />
            <div className="mt-5">
              <PostList key={refreshPosts.toString()} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomePage;
