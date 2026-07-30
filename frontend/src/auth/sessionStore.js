let session = {
  user: null,
  accessToken: null,
};

const listeners = new Set();

const notify = () => {
  listeners.forEach((listener) => listener(session));
};

export const getSession = () => session;
export const getAccessToken = () => session.accessToken;

// Lưu phiên đăng nhập mới và thông báo cho các thành phần đang theo dõi.
export const setSession = ({ user, accessToken }) => {
  session = { user, accessToken };
  notify();
};

// Cập nhật thông tin người dùng trong phiên hiện tại.
export const updateUser = (updatedUser) => {
  session = { ...session, user: { ...session.user, ...updatedUser } };
  notify();
};

// Xóa dữ liệu phiên và thông báo trạng thái đăng xuất.
export const clearSession = () => {
  session = { user: null, accessToken: null };
  notify();
};

// Đăng ký theo dõi thay đổi phiên và trả về hàm hủy đăng ký.
export const subscribeSession = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
