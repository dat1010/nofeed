import React, { useEffect, useState } from "react";
import api from "../services/api";
import { jwtDecode } from "jwt-decode";
import { getCookie } from "../utils/cookies";
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
    const raw = getCookie("id_token") ||
      (api.defaults.headers.common["Authorization"] as string)?.split(" ")[1];

    // 2. Decode it
    let auth0UserId = null;
    if (raw) {
      try {
        const decoded = jwtDecode<JwtPayload>(raw);
        auth0UserId = decoded.sub;
      } catch (decodeError) {
        console.error("Error decoding JWT:", decodeError);
      }
    }

    // 3. Build params
    const params: Record<string, string> = {};
    if (auth0UserId) {
      params.author = auth0UserId;
    }

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
