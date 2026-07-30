import { fn, col, Op } from "sequelize";
import sequelize from "../config/database.js";
import { Order, Payment, PaymentAction, User } from "../models/index.js";
import { cancelLockedOrder } from "./orderCancellation.service.js";
import { queryVnpayTransaction, refundPaidOrder } from "./vnpay.service.js";

const serviceError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const orderInclude = {
  model: Order,
  as: "order",
  required: true,
  include: [{
    model: User,
    as: "user",
    attributes: ["id", "fullName", "email"],
  }],
};

const dateWhere = (from, to) => {
  const where = {};
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt[Op.gte] = new Date(`${from}T00:00:00+07:00`);
    if (to) where.createdAt[Op.lte] = new Date(`${to}T23:59:59.999+07:00`);
  }
  return where;
};

// Tìm kiếm và phân trang giao dịch thanh toán cho quản trị viên.
export const listAdminPayments = async ({ page, limit, status, search, from, to }) => {
  const where = dateWhere(from, to);
  if (status !== "ALL") where.status = status;
  if (search) {
    const pattern = `%${search}%`;
    where[Op.or] = [
      { txnRef: { [Op.iLike]: pattern } },
      { transactionNo: { [Op.iLike]: pattern } },
      { "$order.order_code$": { [Op.iLike]: pattern } },
      { "$order.user.email$": { [Op.iLike]: pattern } },
      { "$order.user.full_name$": { [Op.iLike]: pattern } },
    ];
  }
  const { count, rows } = await Payment.findAndCountAll({
    where,
    include: [orderInclude],
    order: [["createdAt", "DESC"]],
    limit,
    offset: (page - 1) * limit,
    distinct: true,
    subQuery: false,
  });

  const grouped = await Payment.findAll({
    attributes: ["status", [fn("COUNT", col("Payment.id")), "count"], [fn("SUM", col("amount")), "amount"]],
    where: dateWhere(from, to),
    group: ["status"],
    raw: true,
  });
  const vnpay = Object.fromEntries(grouped.map((item) => [
    item.status,
    { count: Number(item.count), amount: Number(item.amount || 0) },
  ]));
  const [codCollected, codPending] = await Promise.all([
    Order.sum("totalAmount", {
      where: { paymentMethod: "COD", paymentStatus: "PAID", ...dateWhere(from, to) },
    }),
    Order.sum("totalAmount", {
      where: {
        paymentMethod: "COD",
        paymentStatus: "PENDING",
        status: { [Op.ne]: "CANCELLED" },
        ...dateWhere(from, to),
      },
    }),
  ]);
  return {
    items: rows,
    summary: { vnpay, cod: { collected: Number(codCollected || 0), pending: Number(codPending || 0) } },
    pagination: {
      page,
      limit,
      totalItems: count,
      totalPages: Math.max(1, Math.ceil(count / limit)),
    },
  };
};

// Lấy chi tiết giao dịch cùng đơn hàng và lịch sử thao tác.
export const getAdminPayment = async (id) => {
  const payment = await Payment.findByPk(id, {
    include: [
      orderInclude,
      {
        model: PaymentAction,
        as: "actions",
        include: [{ model: User, as: "admin", attributes: ["id", "fullName", "email"] }],
      },
    ],
    order: [[{ model: PaymentAction, as: "actions" }, "createdAt", "DESC"]],
  });
  if (!payment) throw serviceError(404, "Không tìm thấy giao dịch");
  return payment;
};

const recordAction = (payload) => PaymentAction.create(payload);

// Đối soát giao dịch với VNPay và ghi nhận thao tác quản trị.
export const reconcilePayment = async (id, adminUserId, ipAddress) => {
  const payment = await Payment.findByPk(id);
  if (!payment) throw serviceError(404, "Không tìm thấy giao dịch");
  let requestId;
  try {
    const queried = await queryVnpayTransaction(payment, ipAddress);
    requestId = queried.requestId;
    const result = queried.result;
    const paid = result.vnp_ResponseCode === "00" && result.vnp_TransactionStatus === "00";
    const failed = (
      result.vnp_ResponseCode === "00" && result.vnp_TransactionStatus !== "00"
    ) || result.vnp_ResponseCode === "91";

    await sequelize.transaction(async (transaction) => {
      const lockedPayment = await Payment.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      const order = await Order.findByPk(lockedPayment.orderId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (paid) {
        if (order.status === "CANCELLED" && lockedPayment.status !== "PAID") {
          throw serviceError(409, "VNPay báo đã thu tiền nhưng đơn đã hủy; cần xử lý hoàn tiền");
        }
        await lockedPayment.update({
          status: "PAID",
          transactionNo: result.vnp_TransactionNo || lockedPayment.transactionNo,
          bankCode: result.vnp_BankCode || lockedPayment.bankCode,
          payDate: result.vnp_PayDate || lockedPayment.payDate,
          responseCode: result.vnp_ResponseCode,
          transactionStatus: result.vnp_TransactionStatus,
          lastCallbackAt: new Date(),
        }, { transaction });
        await order.update({ paymentStatus: "PAID" }, { transaction });
      } else if (failed && lockedPayment.status === "PENDING") {
        await lockedPayment.update({
          status: "FAILED",
          responseCode: result.vnp_ResponseCode,
          transactionStatus: result.vnp_TransactionStatus,
          lastCallbackAt: new Date(),
        }, { transaction });
        await cancelLockedOrder(order, {
          transaction,
          paymentStatus: "FAILED",
          actor: `admin:${adminUserId}:reconcile`,
        });
      }
    });

    await recordAction({
      paymentId: id,
      adminUserId,
      action: "RECONCILE",
      status: "SUCCESS",
      requestId,
      responseCode: result.vnp_ResponseCode,
      responseMessage: result.vnp_Message,
      metadata: { transactionStatus: result.vnp_TransactionStatus },
    });
    return getAdminPayment(id);
  } catch (error) {
    await recordAction({
      paymentId: id,
      adminUserId,
      action: "RECONCILE",
      status: "FAILED",
      requestId,
      responseMessage: error.message,
    });
    throw error;
  }
};

// Hoàn tiền giao dịch hợp lệ và lưu vết người thực hiện.
export const refundPayment = async (id, adminUserId, ipAddress, reason) => {
  const payment = await Payment.findByPk(id);
  if (!payment) throw serviceError(404, "Không tìm thấy giao dịch");
  try {
    await refundPaidOrder(payment.orderId, `admin:${adminUserId}`, ipAddress, reason);
    const refundedPayment = await Payment.findByPk(id);
    await recordAction({
      paymentId: id,
      adminUserId,
      action: "REFUND",
      status: "SUCCESS",
      reason,
      requestId: refundedPayment.refundRequestId,
      responseCode: refundedPayment.refundResponseCode || "00",
      responseMessage: "Hoàn tiền toàn phần thành công",
    });
    return getAdminPayment(id);
  } catch (error) {
    await recordAction({
      paymentId: id,
      adminUserId,
      action: "REFUND",
      status: "FAILED",
      reason,
      responseMessage: error.message,
    });
    throw error;
  }
};
