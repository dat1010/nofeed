import React, { useState } from "react";
import api from "../services/api";

interface CreatePostProps {
  onPostCreated: () => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated }) => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const charCount = content.trim().length;

  const generateTitle = (text: string): string => {
    const words = text.trim().split(/\s+/);
    return words.slice(0, 3).join(" ");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const title = generateTitle(content);
      await api.post("/posts", {
        title,
        content
      });
      setContent("");
      onPostCreated(); // Notify parent that a new post was created
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="composer-card">
      <form onSubmit={handleSubmit}>
        <div className="field">
          <div className="control">
            <label className="label has-text-light">Share a thought</label>
            <textarea
              className="textarea composer-textarea"
              placeholder="What's sparking right now?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <div className="composer-footer">
          <span>{charCount} chars</span>
          <button
            className={`button is-primary ${isSubmitting ? "is-loading" : ""}`}
            type="submit"
            disabled={!content.trim() || isSubmitting}
          >
            Post
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost; 
