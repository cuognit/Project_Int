import { z } from "zod";

const cleanText = (label, min, max) =>
  z.string()
    .trim()
    .min(min, `${label} phải có ít nhất ${min} ký tự`)
    .max(max, `${label} không được vượt quá ${max} ký tự`);

export const createOrderSchema = z.object({
  shippingName: cleanText("Họ tên người nhận", 2, 100),
  shippingPhone: z.string()
    .trim()
    .regex(/^(?:\+84|0)\d{9,10}$/, "Số điện thoại không hợp lệ"),
  shippingAddress: cleanText("Địa chỉ giao hàng", 5, 255),
  note: z.string().trim().max(1000, "Ghi chú không được vượt quá 1000 ký tự").optional()
    .transform((value) => value || null),
}).strict();

export const orderIdSchema = z.coerce.number().int().positive();

export const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"]),
}).strict();

export const myOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(20).default(5),
  status: z.enum([
    "ALL",
    "PENDING",
    "CONFIRMED",
    "SHIPPING",
    "COMPLETED",
    "CANCELLED",
  ]).default("ALL"),
  search: z.string().trim().max(100).default(""),
}).strict();
