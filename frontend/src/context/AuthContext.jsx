import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { logoutApi, refreshApi } from "../api/authApi.js";
import { invalidatePendingRefresh } from "../auth/refreshSession.js";
import {
  clearSession,
  getSession,
  setSession,
  subscribeSession,
  updateUser,
} from "../auth/sessionStore.js";
import useOptimisticCart from "../hooks/useOptimisticCart.js";

const AuthContext = createContext();
const REFRESH_EARLY_MS = 30_000;

const getTokenExpiry = (token) => {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return Number(JSON.parse(window.atob(payload)).exp) * 1000;
  } catch {
    return 0;
  }
};

// Quản lý phiên đăng nhập, tự làm mới token và cung cấp trạng thái xác thực.
export function AuthProvider({ children }) {
  const initialSession = getSession();
  const [user, setUser] = useState(initialSession.user);
  const [accessToken, setAccessToken] = useState(initialSession.accessToken);
  const [isAuthInitializing, setIsAuthInitializing] = useState(true);
  const cartState = useOptimisticCart({ user, isAuthInitializing });

  useEffect(
    () =>
      subscribeSession((nextSession) => {
        setUser(nextSession.user);
        setAccessToken(nextSession.accessToken);
      }),
    [],
  );

  useEffect(() => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("cart");

    let active = true;
    refreshApi()
      .catch(() => {})
      .finally(() => {
        if (active) setIsAuthInitializing(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!accessToken || isAuthInitializing) return undefined;
    const delay = Math.max(
      0,
      getTokenExpiry(accessToken) - Date.now() - REFRESH_EARLY_MS,
    );
    const timerId = window.setTimeout(() => {
      refreshApi().catch(() => {});
    }, delay);
    return () => window.clearTimeout(timerId);
  }, [accessToken, isAuthInitializing]);

  // Lưu thông tin phiên sau khi đăng nhập thành công.
  const login = (userData, token) => {
    invalidatePendingRefresh();
    setSession({ user: userData, accessToken: token });
  };

  // Kết thúc phiên và đưa người dùng về trạng thái chưa đăng nhập.
  const logout = async () => {
    await cartState.flushCartChanges();
    clearSession();
    cartState.resetCart();
    try {
      await logoutApi();
    } catch {
      // Client state is already cleared; server session will expire naturally.
    }
  };

  const cartCount = cartState.cart.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const cartTotal = cartState.cart.reduce(
    (sum, item) =>
      sum + Number(item.product.price || 0) * item.quantity,
    0,
  );

  // Đồng bộ hồ sơ mới vào context và kho phiên dùng chung.
  const updateUserProfile = (updatedUser) => {
    updateUser(updatedUser);
  };

  const value = useMemo(
    () => ({
      user,
      accessToken,
      token: accessToken,
      isAuthInitializing,
      isAuthenticated: Boolean(user && accessToken),
      isAdmin: user?.role === "admin",
      login,
      logout,
      updateUserProfile,
      cart: cartState.cart,
      cartLoading: cartState.cartLoading,
      cartError: cartState.cartError,
      cartSyncing: cartState.cartSyncing,
      addToCart: cartState.addToCart,
      setCartQuantity: cartState.setCartQuantity,
      updateCartQuantity: cartState.updateCartQuantity,
      removeFromCart: cartState.removeFromCart,
      flushCartChanges: cartState.flushCartChanges,
      clearCart: cartState.clearCart,
      cartCount,
      cartTotal,
    }),
    [
      user,
      accessToken,
      isAuthInitializing,
      cartState.cart,
      cartState.cartLoading,
      cartState.cartError,
      cartState.cartSyncing,
      cartState.addToCart,
      cartState.setCartQuantity,
      cartState.updateCartQuantity,
      cartState.removeFromCart,
      cartState.flushCartChanges,
      cartState.clearCart,
      cartCount,
      cartTotal,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Truy cập AuthContext và phát hiện trường hợp dùng ngoài provider.
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
