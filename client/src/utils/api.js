import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api",
  timeout: 10000,
});

// Attach admin token to requests automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("adminToken");
      window.location.href = "/admin";
    }
    return Promise.reject(err);
  }
);

export const submitSuggestion = (data) => API.post("/suggestions", data);
export const getSuggestions = (params) => API.get("/suggestions", { params });
export const voteSuggestion = (id) => API.patch(`/suggestions/${id}/vote`);

// Admin
export const adminLogin = (password) => API.post("/auth/admin-login", { password });
export const getAllSuggestions = (params) => API.get("/suggestions/admin/all", { params });
export const updateStatus = (id, status) => API.patch(`/suggestions/admin/${id}/status`, { status });
export const deleteSuggestion = (id) => API.delete(`/suggestions/admin/${id}`);
export const clearAll = () => API.delete("/suggestions/admin/clear/all");

export default API;
