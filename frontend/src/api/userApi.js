import axiosClient from './axiosClient.js';

export const getUsers = () => axiosClient.get('/users').then((response) => response.data.data);
export const getUser = (id) => axiosClient.get(`/users/${id}`).then((response) => response.data.data);
export const getProfile = () => axiosClient.get('/users/profile').then((response) => response.data.data);
export const updateProfile = (data) => axiosClient.put('/users/profile', data).then((response) => response.data);
export const changePassword = (data) => axiosClient.put('/users/change-password', data).then((response) => response.data);
export const adminUpdateUser = (userId, data) => axiosClient.put(`/users/${userId}`, data).then((response) => response.data);
export const updateUserAccess = (userId, data) => axiosClient.patch(`/users/${userId}/access`, data).then((response) => response.data);
