import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { getSuggestions, voteSuggestion } from "../utils/api";
import { useSocket } from "../context/SocketContext";

const STATUS_LABEL = {
  pending: { label: "Pending", cls: "badge-pending" },
  approved: { label: "Approved", cls: "badge-approved" },
  played: { label: "Played ✓", cls: "badge-played" },
  rejected: { label: "Rejected", cls: "badge-rejected" },
};

export default function SuggestionList() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("votes");
  const [votedIds, setVotedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem("votedIds") || "[]"); } catch { return []; }
  });
  const { socket } = useSocket();

  const fetchSuggestions = useCallback(async () => {
    try {
      const res = await getSuggestions({ sort }); 
      setSuggestions(res.data);
    } catch {
      toast.error("Failed to load suggestions");
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useEffect(() => { fetchSuggestions(); }, [fetchSuggestions]);

  useEffect(() => {
    if (!socket) return;

    socket.on("newSuggestion", (s) => {
      setSuggestions((prev) => {
        const exists = prev.find((x) => x._id === s._id);
        if (exists) return prev;
        return [s, ...prev];
      });
    });

    socket.on("voteUpdate", ({ _id, votes }) => {
      setSuggestions((prev) =>
        prev.map((s) => (s._id === _id ? { ...s, votes } : s))
      );
    });

    socket.on("statusUpdate", ({ _id, status }) => {
      setSuggestions((prev) =>
        prev.map((s) => (s._id === _id ? { ...s, status } : s))
      );
    });

    socket.on("deleteSuggestion", ({ _id }) => {
      setSuggestions((prev) => prev.filter((s) => s._id !== _id));
    });

    socket.on("clearAll", () => setSuggestions([]));

    return () => {
      socket.off("newSuggestion");
      socket.off("voteUpdate");
      socket.off("statusUpdate");
      socket.off("deleteSuggestion");
      socket.off("clearAll");
    };
  }, [socket, sort]);

  const handleVote = async (id) => {
    if (votedIds.includes(id)) { toast.error("Already voted!"); return; }
    try {
      await voteSuggestion(id);
      const updated = [...votedIds, id];
      setVotedIds(updated);
      localStorage.setItem("votedIds", JSON.stringify(updated));
      toast.success("Vote counted! 🎵");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not vote");
    }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  // CLEAN SORT: Suggestions stay in place based on votes/time regardless of status
  const displaySuggestions = [...suggestions].sort((a, b) => {
    if (sort === "votes") {
      if (b.votes !== a.votes) return b.votes - a.votes;
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <div className="suggestion-list">
      <div className="list-header">
        <h2>🎵 Song Requests ({suggestions.length})</h2>
        <div className="sort-controls">
          <button className={`sort-btn ${sort === "votes" ? "active" : ""}`} onClick={() => setSort("votes")}>
            Top Voted
          </button>
          <button className={`sort-btn ${sort === "newest" ? "active" : ""}`} onClick={() => setSort("newest")}>
            Newest
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading suggestions...</div>
      ) : displaySuggestions.length === 0 ? (
        <div className="empty-state">No suggestions yet. Be the first! 🎤</div>
      ) : (
        <ul className="cards">
          {displaySuggestions.map((s, i) => (
            <li key={s._id} className={`card ${s.status === 'played' ? 'card-played' : ''}`} style={{ animationDelay: `${i * 0.04}s` }}>
              <div className="card-rank">#{i + 1}</div>
              <div className="card-body">
                <div className="card-song">{s.songName}</div>
                <div className="card-artist">by {s.singerName}</div>
                <div className="card-meta">
                  <span>{s.suggestedBy || "Anonymous"}</span>
                  <span>{timeAgo(s.createdAt)}</span>
                  <span className={`badge ${STATUS_LABEL[s.status]?.cls}`}>
                    {STATUS_LABEL[s.status]?.label}
                  </span>
                </div>
              </div>
              <button
                className={`vote-btn ${votedIds.includes(s._id) ? "voted" : ""}`}
                onClick={() => handleVote(s._id)}
                disabled={votedIds.includes(s._id) || s.status === 'played'}
                title={s.status === 'played' ? "Song already played" : votedIds.includes(s._id) ? "Already voted" : "Upvote"}
              >
                <span className="vote-arrow">▲</span>
                <span className="vote-count">{s.votes}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
