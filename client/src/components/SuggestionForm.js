import React, { useState } from "react";
import toast from "react-hot-toast";
import { submitSuggestion } from "../utils/api";

export default function SuggestionForm() {
  setForm({ songName: "", singerName: "", suggestedBy: "" });
  const [loading, setLoading] = useState(false);
  const [duplicate, setDuplicate] = useState(null);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setDuplicate(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.songName.trim() || !form.singerName.trim()) {
      toast.error("Song name and singer are required!");
      return;
    }
    setLoading(true);
    setDuplicate(null);
    try {
      await submitSuggestion(form);
      toast.success("🎵 Your suggestion was added!");
      setForm({ songName: "", singerName: "", suggestedBy: "", message: "" });
    } catch (err) {
      if (err.response?.status === 409) {
        setDuplicate(err.response.data.suggestion);
        toast.error("This song was already suggested!");
      } else if (err.response?.status === 429) {
        toast.error(err.response.data.message || "Too many submissions. Please wait.");
      } else {
        toast.error("Failed to submit. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

return (
    <form className="suggestion-form" onSubmit={handleSubmit}>
      <h2 className="form-title">🎶 Request a Song</h2>

      <div className="field-group">
        <input
          className="field"
          name="songName"
          placeholder="Song Name *"
          value={form.songName}
          onChange={handleChange}
          maxLength={150}
          autoComplete="off"
        />
        <input
          className="field"
          name="singerName"
          placeholder="Artist / Singer *"
          value={form.singerName}
          onChange={handleChange}
          maxLength={100}
          autoComplete="off"
        />
      </div>

      <input
        className="field"
        name="suggestedBy"
        placeholder="Your Name (optional)"
        value={form.suggestedBy}
        onChange={handleChange}
        maxLength={80}
      />

      {duplicate && (
        <div className="duplicate-warning">
          ⚠️ <strong>"{duplicate.songName}"</strong> by{" "}
          <strong>{duplicate.singerName}</strong> is already on the list with{" "}
          <strong>{duplicate.votes}</strong> vote{duplicate.votes !== 1 ? "s" : ""}! Go upvote it instead.
        </div>
      )}

      <button className="btn-submit" type="submit" disabled={loading}>
        {loading ? <span className="spinner" /> : "Submit Suggestion"}
      </button>
    </form>
  );
}
