import { buildReturnRedirect, handleVnpayIpn } from "../services/vnpay.service.js";
import * as paymentAdminService from "../services/paymentAdmin.service.js";
import {
  adminPaymentsQuerySchema,
  paymentIdSchema,
  refundPaymentSchema,
} from "../validators/payment.validator.js";

const validationError = (res, message = "Dữ liệu thanh toán không hợp lệ") =>
  res.status(400).json({ success: false, message });

const handleError = (error, res, next) => error.statusCode
  ? res.status(error.statusCode).json({ success: false, message: error.message })
  : next(error);

export const vnpayIpn = async (req, res) => {
  try {
    return res.json(await handleVnpayIpn(req.query));
  } catch {
    return res.json({ RspCode: "99", Message: "Unknown error" });
  }
};

export const vnpayReturn = async (req, res, next) => {
  try {
    return res.redirect(await buildReturnRedirect(req.query));
  } catch (error) {
    return next(error);
  }
};

export const listAdminPayments = async (req, res, next) => {
  const validation = adminPaymentsQuerySchema.safeParse(req.query);
  if (!validation.success) return validationError(res);
  try {
    return res.json({ success: true, data: await paymentAdminService.listAdminPayments(validation.data) });
  } catch (error) {
    return next(error);
  }
};

export const getAdminPayment = async (req, res, next) => {
  const id = paymentIdSchema.safeParse(req.params.paymentId);
  if (!id.success) return validationError(res, "ID giao dịch không hợp lệ");
  try {
    return res.json({ success: true, data: await paymentAdminService.getAdminPayment(id.data) });
  } catch (error) {
    return handleError(error, res, next);
  }
};

export const reconcileAdminPayment = async (req, res, next) => {
  const id = paymentIdSchema.safeParse(req.params.paymentId);
  if (!id.success) return validationError(res, "ID giao dịch không hợp lệ");
  try {
    const data = await paymentAdminService.reconcilePayment(
      id.data,
      req.user.id,
      req.ip || req.socket.remoteAddress,
    );
    return res.json({ success: true, message: "Đối soát hoàn tất", data });
  } catch (error) {
    return handleError(error, res, next);
  }
};

export const refundAdminPayment = async (req, res, next) => {
  const id = paymentIdSchema.safeParse(req.params.paymentId);
  const body = refundPaymentSchema.safeParse(req.body);
  if (!id.success || !body.success) return validationError(res, "Lý do hoàn tiền phải có 10–500 ký tự");
  try {
    const data = await paymentAdminService.refundPayment(
      id.data,
      req.user.id,
      req.ip || req.socket.remoteAddress,
      body.data.reason,
    );
    return res.json({ success: true, message: "Hoàn tiền thành công", data });
  } catch (error) {
    return handleError(error, res, next);
  }
};
