import axios from "axios";
import { clearSession, getSession, setSession } from "./sessionStore.js";

const authHttp = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  timeout: 15000,
  withCredentials: true,
});

let refreshPromise = null;
let refreshGeneration = 0;

export const invalidatePendingRefresh = () => {
  refreshGeneration += 1;
  refreshPromise = null;
};

export const refreshSession = () => {
  if (!refreshPromise) {
    const generation = refreshGeneration;
    const request = authHttp
      .post("/auth/refresh")
      .then((response) => {
        const data = response.data.data;
        if (generation !== refreshGeneration) return getSession();
        setSession(data);
        return data;
      })
      .catch((error) => {
        if (generation === refreshGeneration) clearSession();
        throw error.response?.data || error;
      })
      .finally(() => {
        if (refreshPromise === request) refreshPromise = null;
      });
    refreshPromise = request;
  }

  return refreshPromise;
};

export const logoutSession = async () => {
  invalidatePendingRefresh();
  try {
    await authHttp.post("/auth/logout");
  } finally {
    clearSession();
  }
};
