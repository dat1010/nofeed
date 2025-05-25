import React, { useEffect, useState } from "react";
import api from "../services/api";
import { jwtDecode } from "jwt-decode";
import "../styles/feed.css";

interface Post {
  id: string;
  title: string;
  body: string;
  author: string;
  created_at?: string;
}

interface JwtPayload {
  sub: string;
}

const fetchPosts = async (
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setIsLoading(true);

  try {
    // 1. Get the raw token
    const raw = localStorage.getItem("token") ||
      (api.defaults.headers.common["Authorization"] as string)?.split(" ")[1];

    // 2. Decode it
    const { sub: auth0UserId } = raw
      ? jwtDecode<JwtPayload>(raw)
      : { sub: null };

    // 3. Build params
    const params: Record<string, string> = {};
    if (auth0UserId) params.author = auth0UserId;

    // 4. Fetch with ?author=<userId>
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

  useEffect(() => {
    fetchPosts(setPosts, setError, setIsLoading);
  }, []);

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
      <div className="notification is-info is-light">
        No posts yet. Be the first to post something!
      </div>
    );
  }

  // Debug: log posts to console
  console.log('Posts:', posts);

  return (
    <div className="feed">
      {posts.map((post) => (
        <article key={post.id} className="media">
          <div className="media-content">
            <div className="content">
              <p>
                <strong className="has-text-weight-semibold">{post.author}</strong>
                <span className="has-text-grey-light is-size-7 ml-2">
                  {post.created_at && new Date(post.created_at).toLocaleDateString()}
                </span>
                <br />
                <span className="has-text-weight-normal">{post.body}</span>
              </p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
};

export default PostList; 
