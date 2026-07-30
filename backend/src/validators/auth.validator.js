import { z } from "zod";

const optionalText = (fieldName, maxLength) =>
  z.preprocess(
    (value) => {
      if (value === undefined || value === null) return undefined;
      if (typeof value === "string" && value.trim() === "") return undefined;
      return value;
    },
    z
      .string({ error: `${fieldName} phải là chuỗi` })
      .trim()
      .max(maxLength, `${fieldName} tối đa ${maxLength} ký tự`)
      .optional(),
  );

export const registerSchema = z
  .object({
    fullName: z
      .string({ error: "Họ tên không được để trống" })
      .trim()
      .min(2, "Họ tên phải có ít nhất 2 ký tự")
      .max(100, "Họ tên tối đa 100 ký tự"),
    email: z
      .string({ error: "Email không được để trống" })
      .trim()
      .min(1, "Email không được để trống")
      .max(150, "Email tối đa 150 ký tự")
      .email("Email không đúng định dạng")
      .transform((value) => value.toLowerCase()),
    password: z
      .string({ error: "Mật khẩu không được để trống" })
      .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
      .regex(/\p{L}/u, "Mật khẩu phải chứa ít nhất một chữ cái")
      .regex(/\p{N}/u, "Mật khẩu phải chứa ít nhất một chữ số")
      .refine(
        (value) => Buffer.byteLength(value, "utf8") <= 72,
        "Mật khẩu không được vượt quá 72 byte",
      ),
    phone: optionalText("Số điện thoại", 20),
    address: optionalText("Địa chỉ", 255),
  })
  .strict("Dữ liệu đăng ký chứa trường không được hỗ trợ");

export const loginSchema = z
  .object({
    email: z
      .string({ error: "Email không được để trống" })
      .trim()
      .min(1, "Email không được để trống")
      .max(150, "Email tối đa 150 ký tự")
      .email("Email không đúng định dạng")
      .transform((value) => value.toLowerCase()),
    password: z
      .string({ error: "Mật khẩu không được để trống" })
      .min(1, "Mật khẩu không được để trống")
      .refine(
        (value) => Buffer.byteLength(value, "utf8") <= 72,
        "Mật khẩu không được vượt quá 72 byte",
      ),
  })
  .strict("Dữ liệu đăng nhập chứa trường không được hỗ trợ");

export const googleLoginSchema = z
  .object({
    credential: z
      .string({ error: "Google credential không được để trống" })
      .trim()
      .min(1, "Google credential không được để trống")
      .max(4096, "Google credential có độ dài không hợp lệ"),
  })
  .strict("Dữ liệu đăng nhập Google chứa trường không được hỗ trợ");


export const formatValidationErrors = (issues) =>
  issues.reduce((errors, issue) => {
    const field = issue.path[0] || "body";
    if (!errors[field]) errors[field] = issue.message;
    return errors;
  }, {});
