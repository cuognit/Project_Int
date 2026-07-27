import { z } from "zod";

export const notificationIdSchema = z.string().uuid("ID thông báo không hợp lệ");

export const notificationListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(10),
}).strict();
