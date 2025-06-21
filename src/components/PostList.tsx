import React, { useEffect, useState } from "react";
import api from "../services/api";
import { jwtDecode } from "jwt-decode";
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

interface JwtPayload {
  sub: string;
  iss?: string;
  aud?: string;
  exp?: number;
  iat?: number;
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

    console.log("Raw token:", raw ? "Token exists" : "No token found");

    // 2. Decode it
    let auth0UserId = null;
    if (raw) {
      try {
        const decoded = jwtDecode<JwtPayload>(raw);
        console.log("Full JWT payload:", decoded);
        auth0UserId = decoded.sub;
      } catch (decodeError) {
        console.error("Error decoding JWT:", decodeError);
      }
    }

    console.log("Decoded auth0UserId:", auth0UserId);

    // 3. Build params
    const params: Record<string, string> = {};
    if (auth0UserId) {
      params.author = auth0UserId;
      console.log("Using author param:", auth0UserId);
    } else {
      console.log("No auth0UserId found, fetching all posts");
    }

    // 4. Fetch with ?author=<userId>
    console.log("Making request to /posts with params:", params);
    const response = await api.get<Post[]>("/posts", { params });
    const postsData = response.data || [];

    console.log("Response data:", postsData);
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
        <div key={post.id} className="card mb-5">
          <div className="card-content">
            <p className="has-text-grey-light is-size-7 mb-2">
              {post.created_at && new Date(post.created_at).toLocaleDateString()}
            </p>
            <p className="is-5 has-text-weight-normal mb-1" style={{ wordBreak: 'break-word' }}>{post.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PostList; 
