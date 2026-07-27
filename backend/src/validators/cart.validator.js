import { z } from "zod";

export const addCartItemSchema = z
  .object({
    productId: z.coerce.number().int().positive("ID sản phẩm không hợp lệ"),
    quantity: z.coerce.number().int().positive("Số lượng phải lớn hơn 0"),
  })
  .strict("Dữ liệu chứa trường không được hỗ trợ");

export const updateCartItemSchema = z
  .object({
    quantity: z.coerce.number().int().positive("Số lượng phải lớn hơn 0"),
  })
  .strict("Dữ liệu chứa trường không được hỗ trợ");

export const productIdSchema = z.coerce
  .number()
  .int()
  .positive("ID sản phẩm không hợp lệ");
