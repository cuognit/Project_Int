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

export const setSession = ({ user, accessToken }) => {
  session = { user, accessToken };
  notify();
};

export const updateUser = (updatedUser) => {
  session = { ...session, user: { ...session.user, ...updatedUser } };
  notify();
};

export const clearSession = () => {
  session = { user: null, accessToken: null };
  notify();
};

export const subscribeSession = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
