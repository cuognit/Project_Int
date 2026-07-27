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
