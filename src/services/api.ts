import axios from "axios";

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

export default api;

