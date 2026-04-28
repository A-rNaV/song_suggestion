import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { SocketProvider } from "./context/SocketContext";
import { AuthProvider } from "./context/AuthContext";
import HomePage from "./pages/HomePage";
import AdminPage from "./pages/AdminPage";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: "#1a1a2e", color: "#e2e8f0", border: "1px solid #334155" },
              duration: 3500,
            }}
          />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
          <footer className="site-footer">
            <Link to="/admin" className="admin-link">Admin</Link>
          </footer>
        </AuthProvider>
      </SocketProvider>
    </BrowserRouter>
  );
}
