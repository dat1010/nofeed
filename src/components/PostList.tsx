import React, { useEffect, useState } from "react";
import api from "../services/api";

interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
}

const PostList: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async () => {
    try {
      const response = await api.get("/posts");
      setPosts(response.data);
      setError(null);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setError("Failed to load posts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  if (isLoading) {
    return (
      <div className="has-text-centered">
        <div className="button is-loading is-large"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="notification is-danger">
        {error}
      </div>
    );
  }

  return (
    <div className="posts">
      {posts.map((post) => (
        <div key={post.id} className="box">
          <div className="content">
            <p>{post.content}</p>
            <small className="has-text-grey">
              Posted on {new Date(post.created_at).toLocaleString()}
            </small>
          </div>
        </div>
      ))}
      {posts.length === 0 && (
        <div className="has-text-centered has-text-grey">
          No posts yet. Be the first to post something!
        </div>
      )}
    </div>
  );
};

export default PostList; 