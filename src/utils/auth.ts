import { jwtDecode } from "jwt-decode";
import { getCookie } from "./cookies";

interface JwtPayload {
  exp?: number;
}

const getLoginUrl = () => {
  if (process.env.NODE_ENV === "development") {
    return "/api/login";
  }
  return "https://api.nofeed.zone/api/login";
};

export const clearAuthCookies = () => {
  document.cookie = "id_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "id_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
};

export const getValidToken = (): string | null => {
  const token = getCookie("id_token");
  if (!token) {
    return null;
  }

  try {
    const decoded = jwtDecode<JwtPayload>(token);
    if (decoded?.exp && Date.now() >= decoded.exp * 1000) {
      clearAuthCookies();
      return null;
    }
  } catch (error) {
    console.error("Error decoding JWT:", error);
    clearAuthCookies();
    return null;
  }

  return token;
};

export const redirectToLogin = () => {
  window.location.href = getLoginUrl();
};
