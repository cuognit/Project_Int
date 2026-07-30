// Chuẩn hóa chỉ số slide để carousel lặp vòng ở hai đầu.
export const wrapCarouselIndex = (index, total) =>
  ((index % total) + total) % total;

// Xác định hướng vuốt khi khoảng kéo vượt ngưỡng tối thiểu.
export const getSwipeDirection = (startX, endX, threshold = 50) => {
  const distance = endX - startX;
  if (Math.abs(distance) < threshold) return 0;
  return distance < 0 ? 1 : -1;
};
