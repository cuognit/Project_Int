import { z } from "zod";

const optionalPositiveInteger = z.preprocess(
  (value) => value === "" || value === undefined ? null : value,
  z.coerce.number().int().positive().nullable(),
);

const optionalMoney = z.preprocess(
  (value) => value === "" || value === undefined ? null : value,
  z.coerce.number().nonnegative().nullable(),
);

export const voucherPayloadSchema = z.object({
  code: z.string().trim().min(2).max(50)
    .regex(/^[A-Za-z0-9_-]+$/, "Mã chỉ gồm chữ, số, gạch ngang và gạch dưới")
    .transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(1000).optional().transform((value) => value || null),
  discountType: z.enum(["FIXED", "PERCENTAGE"]),
  discountValue: z.coerce.number().positive(),
  maxDiscountAmount: optionalMoney,
  minOrderAmount: z.coerce.number().nonnegative().default(0),
  scope: z.enum(["ALL", "CATEGORIES"]),
  categoryIds: z.array(z.coerce.number().int().positive()).default([]),
  audience: z.enum(["ALL", "TARGETED"]),
  userIds: z.array(z.coerce.number().int().positive()).default([]),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  isActive: z.boolean().default(true),
  totalUsageLimit: optionalPositiveInteger,
  perUserLimit: optionalPositiveInteger,
}).strict().superRefine((value, context) => {
  if (value.discountType === "PERCENTAGE" && value.discountValue > 100) {
    context.addIssue({ code: "custom", path: ["discountValue"], message: "Phần trăm giảm tối đa là 100" });
  }
  if (value.discountType === "FIXED" && value.maxDiscountAmount !== null) {
    context.addIssue({ code: "custom", path: ["maxDiscountAmount"], message: "Giảm cố định không dùng mức giảm tối đa" });
  }
  if (value.endAt <= value.startAt) {
    context.addIssue({ code: "custom", path: ["endAt"], message: "Thời gian kết thúc phải sau thời gian bắt đầu" });
  }
  if (value.scope === "CATEGORIES" && !value.categoryIds.length) {
    context.addIssue({ code: "custom", path: ["categoryIds"], message: "Vui lòng chọn ít nhất một danh mục" });
  }
  if (value.audience === "TARGETED" && !value.userIds.length) {
    context.addIssue({ code: "custom", path: ["userIds"], message: "Vui lòng chọn ít nhất một người dùng" });
  }
});

export const validateVoucherSchema = z.object({
  code: z.string().trim().min(1).max(50).transform((value) => value.toUpperCase()),
}).strict();
