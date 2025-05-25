import React, { useEffect, useState } from "react";
import api from "../services/api";
import jwtDecode from "jwt-decode";

interface Post {
  id: string;
  title: string;
  body: string;
  author: string;
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
      api.defaults.headers.common["Authorization"]?.split(" ")[1];

    // 2. Decode it
    const { sub: auth0UserId } = raw
      ? (jwtDecode<JwtPayload>(raw))
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

export default function PostList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchPosts(setPosts, setError, setIsLoading);
  }, []);

  if (isLoading) return <div>Loading…</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <ul>
      {posts.map((p) => (
        <li key={p.id}>
          <strong>{p.title}</strong> (by {p.author})
        </li>
      ))}
    </ul>
  );
}

export default PostList; 
