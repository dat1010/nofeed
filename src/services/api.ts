import axios from "axios";
import { clearAuthCookies, getValidToken, redirectToLogin } from "../utils/auth";

// Use proxy in development, full URL in production
const getBaseUrl = () => {
  if (process.env.NODE_ENV === "development") {
    return "/api/";
  }
  return "https://api.nofeed.zone/api/";
};

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = getValidToken();
  if (token) {
    config.headers = config.headers || {};
    if (!config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";
    if (status === 401 && !url.includes("/login") && !url.includes("/logout")) {
      clearAuthCookies();
      redirectToLogin();
    }
    return Promise.reject(error);
  }
);

export default api;
