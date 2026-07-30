import * as voucherService from "../services/voucher.service.js";
import {
  validateVoucherSchema,
  voucherPayloadSchema,
} from "../validators/voucher.validator.js";
import { formatValidationErrors } from "../validators/auth.validator.js";

const handleError = (error, res, next) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  return next(error);
};

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// Lấy các voucher mà giỏ hàng hiện tại có thể sử dụng.
export const availableVouchers = async (req, res, next) => {
  try {
    return res.json({
      success: true,
      data: await voucherService.getAvailableVouchers(req.user.id),
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

// Kiểm tra và xem trước mức giảm của voucher cho giỏ hàng.
export const validateVoucher = async (req, res, next) => {
  const validation = validateVoucherSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, message: "Mã voucher không hợp lệ" });
  }
  try {
    const result = await voucherService.validateVoucherForCart(
      req.user.id,
      validation.data.code,
    );
    return res.json({ success: true, data: voucherService.toPreview(result) });
  } catch (error) {
    return handleError(error, res, next);
  }
};

// Lấy danh sách voucher phân trang cho quản trị viên.
export const listAdminVouchers = async (req, res, next) => {
  try {
    return res.json({
      success: true,
      data: await voucherService.listAdminVouchers(req.query),
    });
  } catch (error) {
    return next(error);
  }
};

const parsePayload = (req, res) => {
  const validation = voucherPayloadSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Dữ liệu voucher không hợp lệ",
      errors: formatValidationErrors(validation.error.issues),
    });
    return null;
  }
  return validation.data;
};

// Tạo voucher mới cùng các điều kiện áp dụng.
export const createVoucher = async (req, res, next) => {
  const payload = parsePayload(req, res);
  if (!payload) return;
  try {
    return res.status(201).json({
      success: true,
      data: await voucherService.createVoucher(payload),
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

// Cập nhật thông tin và phạm vi áp dụng của voucher.
export const updateVoucher = async (req, res, next) => {
  const id = parseId(req.params.voucherId);
  if (!id) return res.status(400).json({ success: false, message: "ID voucher không hợp lệ" });
  const payload = parsePayload(req, res);
  if (!payload) return;
  try {
    return res.json({
      success: true,
      data: await voucherService.updateVoucher(id, payload),
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

// Bật hoặc tắt khả năng sử dụng của voucher.
export const updateVoucherStatus = async (req, res, next) => {
  const id = parseId(req.params.voucherId);
  if (!id || typeof req.body.isActive !== "boolean") {
    return res.status(400).json({ success: false, message: "Trạng thái voucher không hợp lệ" });
  }
  try {
    return res.json({
      success: true,
      data: await voucherService.setVoucherStatus(id, req.body.isActive),
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};
