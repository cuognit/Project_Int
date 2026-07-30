import axiosClient from './axiosClient.js';
import { logoutSession, refreshSession } from '../auth/refreshSession.js';

export const loginApi = (credentials) =>
  axiosClient.post('/auth/login', credentials).then((response) => response.data.data);

export const googleLoginApi = (credential) =>
  axiosClient.post('/auth/google', { credential }).then((response) => response.data.data);


export const registerApi = (userData) =>
  axiosClient.post('/auth/register', userData).then((response) => response.data.data);

export const refreshApi = refreshSession;
export const logoutApi = logoutSession;
