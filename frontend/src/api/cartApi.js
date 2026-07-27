import axiosClient from "./axiosClient.js";

const unwrap = (request) => request.then((response) => response.data.data);

export const getCart = () => unwrap(axiosClient.get("/cart"));
export const addCartItem = (productId, quantity) =>
  unwrap(axiosClient.post("/cart/items", { productId, quantity }));
export const updateCartItem = (productId, quantity) =>
  unwrap(axiosClient.patch(`/cart/items/${productId}`, { quantity }));
export const removeCartItem = (productId) =>
  unwrap(axiosClient.delete(`/cart/items/${productId}`));
