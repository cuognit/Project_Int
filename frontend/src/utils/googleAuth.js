const SCRIPT_ID = "google-gsi-client";
const SCRIPT_URL = "https://accounts.google.com/gsi/client";

let loadPromise = null;
let initializedClientId = null;
let credentialHandler = null;

const removeBrokenScript = () => {
  const script = document.getElementById(SCRIPT_ID);
  if (script && !window.google?.accounts?.id) {
    script.remove();
  }
};

// Tải Google Identity script một lần và cho phép thử lại khi tải lỗi.
export const loadGoogleScript = () => {
  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google);
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    let script = document.getElementById(SCRIPT_ID);

    if (script) {
      const handleLoad = () => {
        if (window.google?.accounts?.id) {
          resolve(window.google);
        } else {
          reject(new Error("Google Identity script đã tải nhưng không khả dụng"));
        }
      };
      const handleError = () => reject(new Error("Không thể tải Google Identity script"));

      script.addEventListener("load", handleLoad, { once: true });
      script.addEventListener("error", handleError, { once: true });
      return;
    }

    script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_URL;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google?.accounts?.id) {
        resolve(window.google);
      } else {
        reject(new Error("Google Identity script đã tải nhưng không khởi tạo được API"));
      }
    };
    script.onerror = () => reject(new Error("Không thể kết nối đến máy chủ Google. Vui lòng kiểm tra lại mạng"));

    document.head.appendChild(script);
  }).catch((error) => {
    loadPromise = null;
    removeBrokenScript();
    throw error;
  });

  return loadPromise;
};

const initializeGoogleIdentity = async (clientId) => {
  const google = await loadGoogleScript();

  if (initializedClientId && initializedClientId !== clientId) {
    throw new Error("Google Identity đã được khởi tạo với Client ID khác");
  }

  if (!initializedClientId) {
    google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => credentialHandler?.(response),
      auto_select: false,
    });
    initializedClientId = clientId;
  }

  return google;
};

// Khởi tạo Google Identity và render nút với callback mới nhất.
export const renderGoogleButton = async ({
  clientId,
  container,
  onCredential,
  options,
}) => {
  const google = await initializeGoogleIdentity(clientId);
  credentialHandler = onCredential;
  container.innerHTML = "";
  google.accounts.id.renderButton(container, options);

  return () => {
    if (credentialHandler !== onCredential) return;
    credentialHandler = null;
    container.innerHTML = "";
  };
};
