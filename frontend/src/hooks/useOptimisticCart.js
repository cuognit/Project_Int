import { useCallback, useEffect, useRef, useState } from "react";
import {
  addCartItem,
  getCart,
  removeCartItem,
  updateCartItem,
} from "../api/cartApi.js";

const DEBOUNCE_MS = 500;

// Quản lý giỏ hàng optimistic và đồng bộ thay đổi tuần tự với backend.
export default function useOptimisticCart({ user, isAuthInitializing }) {
  const [cart, setCart] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState("");
  const [cartSyncing, setCartSyncing] = useState(false);

  const cartRef = useRef([]);
  const pendingRef = useRef(new Map());
  const generationRef = useRef(0);

  const replaceCart = useCallback((items) => {
    cartRef.current = items;
    setCart(items);
  }, []);

  const updateSyncing = useCallback(() => {
    setCartSyncing(pendingRef.current.size > 0);
  }, []);

  // Gộp dữ liệu server với các thay đổi cục bộ chưa đồng bộ xong.
  const mergePending = useCallback((serverItems) => {
    const merged = new Map(
      serverItems.map((item) => [item.product.id, { ...item }]),
    );

    pendingRef.current.forEach((entry, productId) => {
      if (entry.desiredQuantity <= 0) {
        merged.delete(productId);
        return;
      }
      const serverItem = merged.get(productId);
      merged.set(productId, {
        id: serverItem?.id ?? null,
        quantity: entry.desiredQuantity,
        product: serverItem?.product || entry.product,
      });
    });

    replaceCart(Array.from(merged.values()));
  }, [replaceCart]);

  // Tải lại giỏ hàng chuẩn từ server khi đồng bộ thất bại.
  const recoverFromServer = useCallback(async () => {
    try {
      const data = await getCart();
      mergePending(data.items);
    } catch (error) {
      setCartError(error?.message || "Không thể tải lại giỏ hàng");
    }
  }, [mergePending]);

  const syncProductRef = useRef(null);

  // Đồng bộ số lượng mong muốn của một sản phẩm theo thứ tự.
  const syncProduct = useCallback((productId) => {
    const entry = pendingRef.current.get(productId);
    if (!entry) return Promise.resolve();

    if (entry.inFlight) {
      entry.syncRequested = true;
      return entry.inFlight;
    }

    if (entry.timer) {
      window.clearTimeout(entry.timer);
      entry.timer = null;
    }

    const requestVersion = entry.version;
    const requestGeneration = generationRef.current;
    const desiredQuantity = entry.desiredQuantity;
    const request = desiredQuantity <= 0
      ? entry.persisted
        ? removeCartItem(productId)
        : Promise.resolve({ items: cartRef.current })
      : entry.persisted
        ? updateCartItem(productId, desiredQuantity)
        : addCartItem(productId, desiredQuantity);

    entry.inFlight = request
      .then((data) => {
        if (requestGeneration !== generationRef.current) return;
        const current = pendingRef.current.get(productId);
        if (!current) return;

        const serverItem = data.items.find(
          (item) => item.product.id === productId,
        );
        current.persisted = Boolean(serverItem);

        if (current.version === requestVersion) {
          pendingRef.current.delete(productId);
        }
        mergePending(data.items);
      })
      .catch(async (error) => {
        if (requestGeneration !== generationRef.current) return;
        const current = pendingRef.current.get(productId);
        if (current?.timer) window.clearTimeout(current.timer);
        pendingRef.current.delete(productId);
        setCartError(error?.message || "Không thể đồng bộ giỏ hàng");
        await recoverFromServer();
      })
      .finally(() => {
        if (requestGeneration !== generationRef.current) return;
        const current = pendingRef.current.get(productId);
        if (current) {
          current.inFlight = null;
          if (current.syncRequested) {
            current.syncRequested = false;
            syncProductRef.current(productId);
          }
        }
        updateSyncing();
      });

    return entry.inFlight;
  }, [mergePending, recoverFromServer, updateSyncing]);

  syncProductRef.current = syncProduct;

  // Ghi nhận số lượng mới và xếp lịch đồng bộ sau khoảng debounce.
  const queueQuantity = useCallback((
    product,
    desiredQuantity,
    persisted,
    delay = DEBOUNCE_MS,
  ) => {
    const productId = product.id;
    const current = pendingRef.current.get(productId);
    if (current?.timer) window.clearTimeout(current.timer);

    const entry = current || {
      version: 0,
      inFlight: null,
      syncRequested: false,
    };
    entry.version += 1;
    entry.product = product;
    entry.desiredQuantity = desiredQuantity;
    entry.persisted = entry.persisted || persisted;
    entry.timer = window.setTimeout(
      () => syncProductRef.current(productId),
      delay,
    );
    pendingRef.current.set(productId, entry);
    updateSyncing();
  }, [updateSyncing]);

  useEffect(() => {
    const generation = ++generationRef.current;
    pendingRef.current.forEach((entry) => {
      if (entry.timer) window.clearTimeout(entry.timer);
    });
    pendingRef.current.clear();
    updateSyncing();

    if (isAuthInitializing) return;
    if (!user) {
      replaceCart([]);
      setCartLoading(false);
      setCartError("");
      return;
    }

    setCartLoading(true);
    setCartError("");
    getCart()
      .then((data) => {
        if (generation === generationRef.current) replaceCart(data.items);
      })
      .catch((error) => {
        if (generation === generationRef.current) {
          setCartError(error?.message || "Không thể tải giỏ hàng");
        }
      })
      .finally(() => {
        if (generation === generationRef.current) setCartLoading(false);
      });
  }, [user?.id, isAuthInitializing, replaceCart, updateSyncing]);

  // Thêm sản phẩm ngay trên giao diện rồi xếp lịch đồng bộ.
  const addToCart = useCallback((product, quantity = 1) => {
    if (cartLoading) throw new Error("Giỏ hàng đang được tải");
    const current = cartRef.current.find(
      (item) => item.product.id === product.id,
    );
    const desiredQuantity = (current?.quantity || 0) + quantity;
    if (!product.isActive) throw new Error("Sản phẩm đã ngừng kinh doanh");
    if (desiredQuantity > product.stock) {
      throw new Error(`Chỉ còn ${product.stock} sản phẩm trong kho`);
    }

    const nextItems = current
      ? cartRef.current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: desiredQuantity }
            : item,
        )
      : [...cartRef.current, { id: null, product, quantity: desiredQuantity }];
    replaceCart(nextItems);
    setCartError("");
    queueQuantity(product, desiredQuantity, Boolean(current?.id));
    return Promise.resolve({ queued: true });
  }, [cartLoading, queueQuantity, replaceCart]);

  // Đặt số lượng tuyệt đối cho sản phẩm trong giỏ hàng.
  const setCartQuantity = useCallback((productId, quantity) => {
    const current = cartRef.current.find(
      (item) => item.product.id === productId,
    );
    if (!current) return Promise.resolve(null);
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error("Số lượng phải là số nguyên lớn hơn 0");
    }
    if (quantity > current.product.stock) {
      throw new Error(`Chỉ còn ${current.product.stock} sản phẩm trong kho`);
    }

    replaceCart(cartRef.current.map((item) =>
      item.product.id === productId ? { ...item, quantity } : item
    ));
    setCartError("");
    queueQuantity(current.product, quantity, Boolean(current.id));
    return Promise.resolve({ queued: true });
  }, [queueQuantity, replaceCart]);

  // Tăng hoặc giảm số lượng sản phẩm theo một khoảng cho trước.
  const updateCartQuantity = useCallback((productId, delta) => {
    const current = cartRef.current.find(
      (item) => item.product.id === productId,
    );
    if (!current) return Promise.resolve(null);
    const quantity = current.quantity + delta;
    if (quantity <= 0) {
      return removeFromCartRef.current(productId);
    }
    return setCartQuantity(productId, quantity);
  }, [setCartQuantity]);

  const removeFromCartRef = useRef(null);
  // Xóa sản phẩm cục bộ và xếp lịch xóa trên backend.
  const removeFromCart = useCallback((productId) => {
    const current = cartRef.current.find(
      (item) => item.product.id === productId,
    );
    if (!current) return Promise.resolve(null);
    replaceCart(
      cartRef.current.filter((item) => item.product.id !== productId),
    );
    setCartError("");
    queueQuantity(current.product, 0, Boolean(current.id), 0);
    return Promise.resolve({ queued: true });
  }, [queueQuantity, replaceCart]);
  removeFromCartRef.current = removeFromCart;

  // Gửi ngay mọi thay đổi đang chờ trước khi rời trang hoặc thanh toán.
  const flushCartChanges = useCallback(async () => {
    let passes = 0;
    while (pendingRef.current.size && passes < 20) {
      passes += 1;
      const requests = Array.from(pendingRef.current.entries()).map(
        ([productId, entry]) => {
          if (entry.timer) {
            window.clearTimeout(entry.timer);
            entry.timer = null;
          }
          if (entry.inFlight) {
            entry.syncRequested = true;
            return entry.inFlight;
          }
          return syncProductRef.current(productId);
        },
      );
      await Promise.allSettled(requests);
    }
  }, []);

  useEffect(() => {
    const flushWhenHidden = () => {
      if (document.visibilityState === "hidden") flushCartChanges();
    };
    window.addEventListener("pagehide", flushCartChanges);
    document.addEventListener("visibilitychange", flushWhenHidden);
    return () => {
      window.removeEventListener("pagehide", flushCartChanges);
      document.removeEventListener("visibilitychange", flushWhenHidden);
    };
  }, [flushCartChanges]);

  // Hủy các tác vụ chờ và đưa hook về trạng thái giỏ hàng ban đầu.
  const resetCart = useCallback(() => {
    generationRef.current += 1;
    pendingRef.current.forEach((entry) => {
      if (entry.timer) window.clearTimeout(entry.timer);
    });
    pendingRef.current.clear();
    replaceCart([]);
    setCartError("");
    updateSyncing();
  }, [replaceCart, updateSyncing]);

  const clearCartError = useCallback(() => setCartError(""), []);
  const clearCart = useCallback(() => replaceCart([]), [replaceCart]);

  return {
    cart,
    cartLoading,
    cartError,
    cartSyncing,
    addToCart,
    setCartQuantity,
    updateCartQuantity,
    removeFromCart,
    flushCartChanges,
    resetCart,
    clearCartError,
    clearCart,
  };
}
