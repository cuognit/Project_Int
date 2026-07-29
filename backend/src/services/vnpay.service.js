import crypto from "node:crypto";
import { Op } from "sequelize";
import sequelize from "../config/database.js";
import { Order, Payment } from "../models/index.js";
import { createNotifications } from "./notification.service.js";
import { cancelLockedOrder } from "./orderCancellation.service.js";

const VERSION = "2.1.0";
const PAYMENT_MINUTES = Number(process.env.VNPAY_PAYMENT_EXPIRE_MINUTES || 15);

const serviceError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const config = () => {
  const values = {
    tmnCode: process.env.VNPAY_TMN_CODE,
    secret: process.env.VNPAY_HASH_SECRET,
    paymentUrl: process.env.VNPAY_PAYMENT_URL,
    apiUrl: process.env.VNPAY_API_URL,
    returnUrl: process.env.VNPAY_RETURN_URL,
    clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  };
  if (!values.tmnCode || !values.secret || !values.paymentUrl || !values.returnUrl) {
    throw serviceError(503, "VNPay chưa được cấu hình đầy đủ");
  }
  return values;
};

export const formatVnpDate = (date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type)?.value || "";
  return `${part("year")}${part("month")}${part("day")}${part("hour")}${part("minute")}${part("second")}`;
};

const sortedQuery = (params) => {
  const query = new URLSearchParams();
  Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([left], [right]) => left.localeCompare(right))
    .forEach(([key, value]) => query.append(key, String(value)));
  return query.toString();
};

const sign = (data, secret = config().secret) =>
  crypto.createHmac("sha512", secret).update(data, "utf8").digest("hex");

const safeEqual = (left, right) => {
  if (!left || !right || left.length !== right.length) return false;
  return crypto.timingSafeEqual(Buffer.from(left), Buffer.from(right));
};

export const verifyVnpayCallback = (query) => {
  const received = String(query.vnp_SecureHash || "").toLowerCase();
  const params = Object.fromEntries(
    Object.entries(query).filter(([key, value]) =>
      key.startsWith("vnp_") && !["vnp_SecureHash", "vnp_SecureHashType"].includes(key) && value !== ""),
  );
  return safeEqual(received, sign(sortedQuery(params)));
};

export const createVnpayPayment = async (order, ipAddress, transaction) => {
  const settings = config();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + PAYMENT_MINUTES * 60_000);
  const txnRef = `${order.orderCode}-${crypto.randomUUID().slice(0, 8)}`.slice(0, 100);
  const payment = await Payment.create({
    orderId: order.id,
    txnRef,
    amount: order.totalAmount,
    createDate: formatVnpDate(now),
    expiresAt,
  }, { transaction });
  await order.update({ paymentExpiresAt: expiresAt }, { transaction });

  const params = {
    vnp_Version: VERSION,
    vnp_Command: "pay",
    vnp_TmnCode: settings.tmnCode,
    vnp_Amount: Math.round(Number(order.totalAmount) * 100),
    vnp_CreateDate: payment.createDate,
    vnp_CurrCode: "VND",
    vnp_ExpireDate: formatVnpDate(expiresAt),
    vnp_IpAddr: ipAddress || "127.0.0.1",
    vnp_Locale: "vn",
    vnp_OrderInfo: `Thanh toan don hang ${order.orderCode}`,
    vnp_OrderType: "other",
    vnp_ReturnUrl: settings.returnUrl,
    vnp_TxnRef: txnRef,
  };
  const signData = sortedQuery(params);
  return {
    payment,
    paymentUrl: `${settings.paymentUrl}?${signData}&vnp_SecureHash=${sign(signData)}`,
  };
};

const applyCallbackFields = (payment, query, transaction) => payment.update({
  transactionNo: query.vnp_TransactionNo || payment.transactionNo,
  bankCode: query.vnp_BankCode || payment.bankCode,
  cardType: query.vnp_CardType || payment.cardType,
  payDate: query.vnp_PayDate || payment.payDate,
  responseCode: query.vnp_ResponseCode || payment.responseCode,
  transactionStatus: query.vnp_TransactionStatus || payment.transactionStatus,
  lastCallbackAt: new Date(),
}, { transaction });

export const handleVnpayIpn = async (query) => {
  if (!verifyVnpayCallback(query)) return { RspCode: "97", Message: "Invalid checksum" };
  if (query.vnp_TmnCode !== config().tmnCode) {
    return { RspCode: "97", Message: "Invalid merchant" };
  }
  const payment = await Payment.findOne({ where: { txnRef: query.vnp_TxnRef } });
  if (!payment) return { RspCode: "01", Message: "Order not found" };
  if (Math.round(Number(payment.amount) * 100) !== Number(query.vnp_Amount)) {
    return { RspCode: "04", Message: "Invalid amount" };
  }
  if (payment.status !== "PENDING") return { RspCode: "02", Message: "Order already confirmed" };

  await sequelize.transaction(async (transaction) => {
    const lockedPayment = await Payment.findByPk(payment.id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (lockedPayment.status !== "PENDING") return;
    const order = await Order.findByPk(lockedPayment.orderId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    await applyCallbackFields(lockedPayment, query, transaction);
    const success = query.vnp_ResponseCode === "00" && query.vnp_TransactionStatus === "00";
    if (success) {
      await lockedPayment.update({ status: "PAID" }, { transaction });
      await order.update({ paymentStatus: "PAID" }, { transaction });
      await createNotifications([
        {
          audience: "USER",
          recipientUserId: order.userId,
          type: "PAYMENT_SUCCESS",
          title: "Thanh toán VNPay thành công",
          message: `Đơn hàng ${order.orderCode} đã được thanh toán.`,
          orderId: order.id,
          metadata: { orderCode: order.orderCode, transactionNo: query.vnp_TransactionNo },
          dedupeKey: `order:${order.id}:vnpay:paid:user`,
        },
        {
          audience: "ADMIN",
          recipientUserId: null,
          type: "PAYMENT_SUCCESS",
          title: "Đơn VNPay đã thanh toán",
          message: `Đơn hàng ${order.orderCode} đã thanh toán thành công.`,
          orderId: order.id,
          metadata: { orderCode: order.orderCode },
          dedupeKey: `order:${order.id}:vnpay:paid:admin`,
        },
      ], { transaction });
    } else {
      await lockedPayment.update({ status: "FAILED" }, { transaction });
      await cancelLockedOrder(order, { transaction, paymentStatus: "FAILED", actor: "VNPAY" });
    }
  });
  return { RspCode: "00", Message: "Confirm success" };
};

export const buildReturnRedirect = async (query) => {
  const settings = config();
  const valid = verifyVnpayCallback(query);
  if (valid) {
    await handleVnpayIpn(query);
  }
  const payment = valid
    ? await Payment.findOne({
        where: { txnRef: query.vnp_TxnRef || "" },
        attributes: ["orderId"],
      })
    : null;
  const params = new URLSearchParams({
    orderId: payment?.orderId ? String(payment.orderId) : "",
    gatewayStatus: valid ? String(query.vnp_ResponseCode || "") : "INVALID_SIGNATURE",
  });
  return `${settings.clientUrl}/payment/vnpay/result?${params}`;
};

const requestVnpay = async (payload) => {
  const { apiUrl } = config();
  if (!apiUrl) throw serviceError(503, "VNPay API URL chưa được cấu hình");
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw serviceError(502, "VNPay không phản hồi yêu cầu");
  return response.json();
};

const verifyApiResponse = (result) => {
  if (!result?.vnp_SecureHash) return false;
  const data = [
    result.vnp_ResponseId, result.vnp_Command, result.vnp_ResponseCode,
    result.vnp_Message, result.vnp_TmnCode, result.vnp_TxnRef,
    result.vnp_Amount, result.vnp_BankCode, result.vnp_PayDate,
    result.vnp_TransactionNo, result.vnp_TransactionType,
    result.vnp_TransactionStatus, result.vnp_OrderInfo,
    result.vnp_PromotionCode, result.vnp_PromotionAmount,
  ].map((value) => value ?? "").join("|");
  return safeEqual(String(result.vnp_SecureHash).toLowerCase(), sign(data));
};

export const refundPaidOrder = async (orderId, requestedBy, ipAddress, reason = null) => {
  const settings = config();
  const prepared = await sequelize.transaction(async (transaction) => {
    const order = await Order.findByPk(orderId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!order) throw serviceError(404, "Không tìm thấy đơn hàng");
    if (order.status !== "PENDING") throw serviceError(409, "Chỉ hoàn tiền khi đơn đang chờ xử lý");
    const payment = await Payment.findOne({
      where: { orderId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!payment || payment.status !== "PAID") {
      throw serviceError(409, "Giao dịch chưa thanh toán hoặc không thể hoàn tiền");
    }
    const requestId = crypto.randomUUID().replaceAll("-", "").slice(0, 32);
    await payment.update({
      status: "REFUNDING",
      refundRequestId: requestId,
      refundRequestedBy: requestedBy,
      refundReason: reason,
    }, { transaction });
    await order.update({ paymentStatus: "REFUNDING" }, { transaction });
    return { order, payment, requestId };
  });

  const createDate = formatVnpDate(new Date());
  const amount = Math.round(Number(prepared.payment.amount) * 100);
  const orderInfo = `Hoan tien don hang ${prepared.order.orderCode}`;
  const payload = {
    vnp_RequestId: prepared.requestId,
    vnp_Version: VERSION,
    vnp_Command: "refund",
    vnp_TmnCode: settings.tmnCode,
    vnp_TransactionType: "02",
    vnp_TxnRef: prepared.payment.txnRef,
    vnp_Amount: amount,
    vnp_OrderInfo: orderInfo,
    vnp_TransactionNo: prepared.payment.transactionNo || "",
    vnp_TransactionDate: prepared.payment.createDate,
    vnp_CreateBy: requestedBy,
    vnp_CreateDate: createDate,
    vnp_IpAddr: ipAddress || "127.0.0.1",
  };
  const checksumData = [
    payload.vnp_RequestId, VERSION, "refund", settings.tmnCode, "02",
    payload.vnp_TxnRef, amount, payload.vnp_TransactionNo,
    payload.vnp_TransactionDate, requestedBy, createDate, payload.vnp_IpAddr, orderInfo,
  ].join("|");
  payload.vnp_SecureHash = sign(checksumData);

  let result;
  try {
    result = await requestVnpay(payload);
  } catch (error) {
    await Payment.update(
      { status: "REFUND_FAILED", refundMessage: error.message },
      { where: { id: prepared.payment.id } },
    );
    await Order.update({ paymentStatus: "PAID" }, { where: { id: orderId } });
    throw error;
  }

  if (!verifyApiResponse(result)) {
    await Payment.update(
      { status: "REFUND_FAILED", refundMessage: "Phản hồi hoàn tiền sai checksum" },
      { where: { id: prepared.payment.id } },
    );
    await Order.update({ paymentStatus: "PAID" }, { where: { id: orderId } });
    throw serviceError(502, "Không xác minh được phản hồi hoàn tiền VNPay");
  }
  const successful = result.vnp_ResponseCode === "00"
    && (!result.vnp_TransactionStatus || result.vnp_TransactionStatus === "00");
  await sequelize.transaction(async (transaction) => {
    const payment = await Payment.findByPk(prepared.payment.id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const order = await Order.findByPk(orderId, { transaction, lock: transaction.LOCK.UPDATE });
    await payment.update({
      status: successful ? "REFUNDED" : "REFUND_FAILED",
      refundResponseCode: result.vnp_ResponseCode,
      refundMessage: result.vnp_Message,
      refundTransactionNo: result.vnp_TransactionNo,
      refundedAt: successful ? new Date() : null,
    }, { transaction });
    if (successful) {
      await cancelLockedOrder(order, {
        transaction,
        paymentStatus: "REFUNDED",
        actor: requestedBy,
      });
    } else {
      await order.update({ paymentStatus: "PAID" }, { transaction });
    }
  });
  if (!successful) throw serviceError(502, result.vnp_Message || "VNPay từ chối hoàn tiền");
};

export const queryVnpayTransaction = async (payment, ipAddress = "127.0.0.1") => {
  const settings = config();
  const requestId = crypto.randomUUID().replaceAll("-", "").slice(0, 32);
  const createDate = formatVnpDate(new Date());
  const orderInfo = `Truy van don hang ${payment.txnRef}`;
  const payload = {
    vnp_RequestId: requestId,
    vnp_Version: VERSION,
    vnp_Command: "querydr",
    vnp_TmnCode: settings.tmnCode,
    vnp_TxnRef: payment.txnRef,
    vnp_OrderInfo: orderInfo,
    vnp_TransactionNo: payment.transactionNo || "",
    vnp_TransactionDate: payment.createDate,
    vnp_CreateDate: createDate,
    vnp_IpAddr: ipAddress,
  };
  payload.vnp_SecureHash = sign([
    requestId, VERSION, "querydr", settings.tmnCode, payment.txnRef,
    payment.createDate, createDate, ipAddress, orderInfo,
  ].join("|"));
  const result = await requestVnpay(payload);
  if (!verifyApiResponse(result)) throw serviceError(502, "Phản hồi đối soát VNPay sai checksum");
  return { result, requestId };
};

export const expirePendingPayments = async () => {
  const expired = await Payment.findAll({
    where: { status: "PENDING", expiresAt: { [Op.lt]: new Date() } },
    attributes: ["id"],
    limit: 50,
  });
  for (const candidate of expired) {
    const snapshot = await Payment.findByPk(candidate.id);
    if (!snapshot || snapshot.status !== "PENDING") continue;
    let queryResult;
    try {
      ({ result: queryResult } = await queryVnpayTransaction(snapshot));
    } catch {
      continue;
    }
    await sequelize.transaction(async (transaction) => {
      const payment = await Payment.findByPk(candidate.id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!payment || payment.status !== "PENDING" || payment.expiresAt > new Date()) return;
      const order = await Order.findByPk(payment.orderId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      const paid = queryResult.vnp_ResponseCode === "00"
        && queryResult.vnp_TransactionStatus === "00";
      const confirmedNotPaid = (
        queryResult.vnp_ResponseCode === "00"
        && queryResult.vnp_TransactionStatus !== "00"
      ) || queryResult.vnp_ResponseCode === "91";
      if (paid) {
        await payment.update({
          status: "PAID",
          transactionNo: queryResult.vnp_TransactionNo || payment.transactionNo,
          bankCode: queryResult.vnp_BankCode || payment.bankCode,
          payDate: queryResult.vnp_PayDate || payment.payDate,
          responseCode: queryResult.vnp_ResponseCode,
          transactionStatus: queryResult.vnp_TransactionStatus,
        }, { transaction });
        await order.update({ paymentStatus: "PAID" }, { transaction });
      } else if (confirmedNotPaid) {
        await payment.update({ status: "FAILED", responseCode: "EXPIRED" }, { transaction });
        await cancelLockedOrder(order, {
          transaction,
          paymentStatus: "FAILED",
          actor: "PAYMENT_TIMEOUT",
        });
      }
    });
  }
};
