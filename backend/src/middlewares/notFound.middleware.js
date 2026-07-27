export const notFound = (req, res) => res.status(404).json({ message: `Không tìm thấy ${req.method} ${req.originalUrl}` });
