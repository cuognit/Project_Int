import { z } from "zod";

export const adminPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["ALL", "PENDING", "PAID", "FAILED", "REFUNDING", "REFUNDED", "REFUND_FAILED"]).default("ALL"),
  search: z.string().trim().max(100).default(""),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).strict();

export const paymentIdSchema = z.coerce.number().int().positive();

export const refundPaymentSchema = z.object({
  reason: z.string().trim().min(10).max(500),
}).strict();
