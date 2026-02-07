const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === "development") {
    return "/api";
  }
  return "https://api.nofeed.zone/api";
};

export const redirectToLogin = () => {
  window.location.href = `${getApiBaseUrl()}/login`;
};

export const redirectToLogout = () => {
  window.location.href = `${getApiBaseUrl()}/logout`;
};

export const refreshSession = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/refresh`, {
      method: "POST",
      credentials: "include",
    });
    return res.ok;
  } catch (error) {
    console.error("Refresh error:", error);
    return false;
  }
};
