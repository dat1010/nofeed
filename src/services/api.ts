import axios from "axios";

const api = axios.create({
  baseURL: "/api", // This will be proxied to the external URL in development
})

export default api;

