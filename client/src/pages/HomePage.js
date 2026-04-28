import React from "react";
import SuggestionForm from "../components/SuggestionForm";
import SuggestionList from "../components/SuggestionList";
import { useSocket } from "../context/SocketContext";

export default function HomePage() {
  const { userCount, isConnected } = useSocket();

  return (
    <div className="home-page">
      <header className="site-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon"><img src="octaves_logo.png" alt="Octaves Logo" /></span>
            <span className="logo-text">SongDrop</span>
          </div>
          <div className="live-badge">
            <span className={`dot ${isConnected ? "connected" : "disconnected"}`} />
            <span>{isConnected ? `${userCount} live` : "Reconnecting..."}</span>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="hero-text">
          <h1>Request a song. Let the crowd vote.</h1>
          <p>Drop your suggestion below — real-time updates for everyone in the room.</p>
        </div>
        <div className="two-col">
          <SuggestionForm />
          <SuggestionList />
        </div>
      </main>
    </div>
  );
}
