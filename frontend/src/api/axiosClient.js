import axios from "axios";
import { refreshSession } from "../auth/refreshSession.js";
import { getAccessToken } from "../auth/sessionStore.js";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  timeout: 15000,
  withCredentials: true,
});

const isAuthEndpoint = (url = "") =>
  ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"].some(
    (path) => url.includes(path),
  );

axiosClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();
  if (accessToken && !isAuthEndpoint(config.url)) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const shouldRefresh =
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._authRetry &&
      !isAuthEndpoint(originalRequest.url);

    if (shouldRefresh) {
      originalRequest._authRetry = true;
      try {
        const { accessToken } = await refreshSession();
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error.response?.data || error);
  },
);

export default axiosClient;
