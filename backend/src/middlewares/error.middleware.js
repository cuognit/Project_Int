export const errorHandler = (error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({ message: error.message || 'Lỗi máy chủ nội bộ' });
};
