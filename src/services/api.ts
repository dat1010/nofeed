import axios from "axios";
import { redirectToLogin, refreshSession } from "../utils/auth";

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

let isRedirecting = false;
let refreshPromise: Promise<boolean> | null = null;

const attemptRefresh = async () => {
  if (!refreshPromise) {
    refreshPromise = refreshSession().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";
    if (
      status === 401 &&
      !url.includes("/login") &&
      !url.includes("/logout") &&
      !url.includes("/refresh") &&
      !(error?.config as any)?._retry
    ) {
      (error.config as any)._retry = true;
      const refreshed = await attemptRefresh();
      if (refreshed) {
        return api(error.config);
      }
      if (!isRedirecting) {
        isRedirecting = true;
        redirectToLogin();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
