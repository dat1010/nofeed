import React, { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/feed.css";

interface Post {
  id: string;
  title: string;
  content: string;
  body?: string;
  author?: string;
  auth0_user_id?: string;
  created_at?: string;
  published?: boolean;
  slug?: string;
  updated_at?: string;
}

const fetchPosts = async (
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  authorId: string | null
) => {
  setIsLoading(true);

  try {
    const params: Record<string, string> = {};
    if (authorId) {
      params.author = authorId;
    }

    const response = await api.get<Post[]>("/posts", { params });
    const postsData = response.data || [];

    setPosts(Array.isArray(postsData) ? postsData : []);
    setError(null);
  } catch (err: any) {
    console.error("Error fetching posts:", err);
    setError("Failed to load posts");
    setPosts([]);
  } finally {
    setIsLoading(false);
  }
};

const PostList: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      let userId: string | null = null;
      try {
        const me = await api.get("/me");
        userId = me.data?.user_id || me.data?.auth0_user_id || me.data?.sub || null;
      } catch {
        userId = null;
      }
      setCurrentUserId(userId);
      fetchPosts(setPosts, setError, setIsLoading, userId);
    };
    load();
  }, []);

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      await api.delete(`/posts/${postId}`);

      // Remove the deleted post from the latest state
      setPosts((prev) => prev.filter((post) => post.id !== postId));
    } catch (err: any) {
      console.error("Error deleting post:", err);
      if (err.response?.status === 401) {
        alert("You can only delete your own posts.");
        return;
      }
      alert("Failed to delete post. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="has-text-centered py-6">
        <div className="button is-loading is-large is-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="notification is-danger is-light">
        <button className="delete" onClick={() => setError(null)}></button>
        {error}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="empty-state">
        <h3 className="title is-4">No feed. On purpose.</h3>
        <p>
          This space only wakes up when you share something real. Drop a thought,
          a question, or a small spark to get things flowing.
        </p>
        <p className="is-size-7 has-text-grey-light">
          Tip: your first post sets the tone for your corner of NoFeed.
        </p>
      </div>
    );
  }

  return (
    <div className="feed">
      {posts.map((post) => (
        <div key={post.id} className="card post-card mb-5">
          <div className="card-content">
            <div className="is-flex is-justify-content-space-between is-align-items-flex-start">
              <div className="is-flex-grow-1">
                <div className="post-meta">
                  <div className="post-avatar">
                    {currentUserId && post.auth0_user_id === currentUserId ? "Y" : "N"}
                  </div>
                  <div>
                    <div className="post-author">
                      {currentUserId && post.auth0_user_id === currentUserId ? "You" : "NoFeed"}
                      {currentUserId && post.auth0_user_id === currentUserId && (
                        <span className="post-badge">Creator</span>
                      )}
                    </div>
                    <div className="post-time">
                      {post.created_at && new Date(post.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <p className="is-5 has-text-weight-normal mb-1" style={{ wordBreak: 'break-word' }}>
                  {post.content}
                </p>
              </div>
              {currentUserId && post.auth0_user_id === currentUserId && (
                <button
                  className="button is-small is-danger is-light ml-2 post-delete"
                  onClick={() => handleDeletePost(post.id)}
                  title="Delete post"
                >
                  <span className="icon is-small">
                    <i className="fas fa-trash"></i>
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PostList; 
