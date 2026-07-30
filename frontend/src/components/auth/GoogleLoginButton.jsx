import { useEffect, useRef, useState } from "react";
import { renderGoogleButton } from "../../utils/googleAuth.js";

export default function GoogleLoginButton({ onSuccess, onError, disabled }) {
  const containerRef = useRef(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState("");
  const [retryVersion, setRetryVersion] = useState(0);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  useEffect(() => {
    let active = true;
    let disposeButton;

    if (!clientId) {
      setConfigError("Chưa cấu hình VITE_GOOGLE_CLIENT_ID phía Frontend.");
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setConfigError("");
    const container = containerRef.current;
    const width = Math.min(
      Math.max(container?.offsetWidth || 380, 200),
      400,
    );

    renderGoogleButton({
      clientId,
      container,
      onCredential: (response) => {
        if (active && response?.credential) {
          onSuccessRef.current(response.credential);
        }
      },
      options: {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "rectangular",
        logo_alignment: "left",
        width,
        locale: "vi",
      },
    })
      .then((dispose) => {
        if (!active) {
          dispose();
          return;
        }
        disposeButton = dispose;
        setLoading(false);
      })
      .catch((error) => {
        if (active) {
          const message =
            error.message || "Không thể tải thư viện Google Sign-In.";
          console.error("Khởi tạo nút Google Sign-In thất bại:", error);
          setConfigError(message);
          setLoading(false);
          onErrorRef.current?.(message);
        }
      });

    return () => {
      active = false;
      disposeButton?.();
    };
  }, [clientId, retryVersion]);

  return (
    <div className="relative flex w-full justify-center">
      {configError && (
      <div className="w-full rounded-xl border border-amber-200 bg-amber-50 p-3 text-center text-xs font-medium text-amber-700">
        <p>{configError}</p>
        {clientId && (
          <button
            type="button"
            onClick={() => setRetryVersion((value) => value + 1)}
            className="mt-2 rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-bold hover:bg-amber-100"
          >
            Thử lại
          </button>
        )}
      </div>
      )}
      {loading && !configError && (
        <div className="flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
          Đang tải Đăng nhập Google...
        </div>
      )}
      <div
        ref={containerRef}
        inert={disabled ? true : undefined}
        aria-disabled={disabled || undefined}
        className={`w-full justify-center ${
          loading || configError ? "hidden" : "flex"
        } ${
          disabled ? "pointer-events-none opacity-50" : ""
        }`}
      />
      {disabled && !loading && !configError && (
        <div className="absolute inset-0 z-10 cursor-not-allowed" aria-hidden="true" />
      )}
    </div>
  );
}
