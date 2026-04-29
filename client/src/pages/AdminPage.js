import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { getAllSuggestions, updateStatus, deleteSuggestion, clearAll } from "../utils/api";
import { useSocket } from "../context/SocketContext";

const STATUS_OPTIONS = ["pending", "approved", "played", "rejected"];
const STATUS_COLORS = {
  pending: "#f59e0b",
  approved: "#10b981",
  played: "#6366f1",
  rejected: "#ef4444",
};

export default function AdminPage() {
  const { isAdmin, login, logout } = useAuth();
  const { socket } = useSocket();
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== "all" ? { status: filter } : {};
      const res = await getAllSuggestions(params);
      setSuggestions(res.data);
    } catch {
      toast.error("Failed to load suggestions");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (isAdmin) fetchAll();
  }, [isAdmin, fetchAll]);

  // Real-time updates for admin panel too
  useEffect(() => {
  if (!socket || !isAdmin) return;
  socket.on("newSuggestion", (s) => {
    setSuggestions((prev) => [s, ...prev]);
  });
  socket.on("voteUpdate", ({ _id, votes }) => {
    setSuggestions((prev) =>
      prev.map((s) => (s._id === _id ? { ...s, votes } : s))
    );
  });
  socket.on("clearAll", () => setSuggestions([]));
  return () => { 
    socket.off("newSuggestion"); 
    socket.off("voteUpdate"); 
    socket.off("clearAll"); 
  };
}, [socket, isAdmin]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      await login(password);
      toast.success("Welcome, Admin 👑");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid password");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateStatus(id, status);
      setSuggestions((prev) =>
        filter === "all"
          ? prev.map((s) => (s._id === id ? { ...s, status } : s))
          : prev.filter((s) => s._id !== id)
      );
      toast.success(`Marked as ${status}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this suggestion?")) return;
    try {
      await deleteSuggestion(id);
      setSuggestions((prev) => prev.filter((s) => s._id !== id));
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleClearAll = async () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    try {
      await clearAll();
      setSuggestions([]);
      setConfirmClear(false);
      toast.success("All suggestions cleared");
    } catch {
      toast.error("Failed to clear");
    }
  };

  if (!isAdmin) {
    return (
      <div className="admin-login-wrap">
        <form className="admin-login-form" onSubmit={handleLogin}>
          <div className="admin-lock-icon">🔐</div>
          <h2>Admin Access</h2>
          <p>Enter the admin password to manage suggestions</p>
          <input
            className="field"
            type="password"
            placeholder="Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <button className="btn-submit" type="submit" disabled={loginLoading}>
            {loginLoading ? <span className="spinner" /> : "Login"}
          </button>
        </form>
      </div>
    );
  }

  const filtered = suggestions
  .filter((s) => filter === "all" || s.status === filter)
  .sort((a, b) => {
    if (b.votes !== a.votes) {
      return b.votes - a.votes; 
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>👑 Admin Panel</h2>
        <div className="admin-actions">
          <button
            className={`btn-danger ${confirmClear ? "confirm" : ""}`}
            onClick={handleClearAll}
            onMouseLeave={() => setConfirmClear(false)}
          >
            {confirmClear ? "⚠️ Confirm Clear All?" : "Clear All"}
          </button>
          <button className="btn-secondary" onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="filter-bar">
        {["all", ...STATUS_OPTIONS].map((f) => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== "all" && (
              <span className="filter-count">
                {suggestions.filter((s) => s.status === f).length}
              </span>
            )}
          </button>
        ))}
        <button className="btn-secondary small" onClick={fetchAll}>↺ Refresh</button>
      </div>

      {loading ? (
        <div className="loading-state">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">No suggestions in this category</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Song</th>
                <th>Artist</th>
                <th>By</th>
                <th>Message</th>
                <th>Votes</th>
                <th>Status</th>
                <th>Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s._id} className={`row-${s.status}`}>
                  <td className="td-num">{i + 1}</td>
                  <td className="td-song">{s.songName}</td>
                  <td>{s.singerName}</td>
                  <td>{s.suggestedBy}</td>
                  <td className="td-msg">{s.message || "—"}</td>
                  <td className="td-votes">{s.votes}</td>
                  <td>
                    <select
                      className="status-select"
                      value={s.status}
                      style={{ borderColor: STATUS_COLORS[s.status] }}
                      onChange={(e) => handleStatusChange(s._id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                  <td className="td-time">
                    {new Date(s.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td>
                    <button className="btn-delete" onClick={() => handleDelete(s._id)} title="Delete">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
