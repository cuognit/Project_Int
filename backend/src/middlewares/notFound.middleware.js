// Trả về lỗi 404 cho mọi endpoint không tồn tại.
export const notFound = (req, res) => res.status(404).json({ message: `Không tìm thấy ${req.method} ${req.originalUrl}` });
