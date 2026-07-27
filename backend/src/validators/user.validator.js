import { z } from "zod";

export const updateUserAccessSchema = z.object({
  role: z.enum(["customer", "admin"]),
  isActive: z.boolean(),
}).strict();
