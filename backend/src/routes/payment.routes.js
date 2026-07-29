import { Router } from "express";
import {
  getAdminPayment,
  listAdminPayments,
  reconcileAdminPayment,
  refundAdminPayment,
  vnpayIpn,
  vnpayReturn,
} from "../controllers/payment.controller.js";
import { authenticate, requireAdmin } from "../middlewares/auth.middleware.js";

const router = Router();
router.get("/vnpay/ipn", vnpayIpn);
router.get("/vnpay/return", vnpayReturn);
router.get("/admin", authenticate, requireAdmin, listAdminPayments);
router.get("/admin/:paymentId", authenticate, requireAdmin, getAdminPayment);
router.post("/admin/:paymentId/reconcile", authenticate, requireAdmin, reconcileAdminPayment);
router.post("/admin/:paymentId/refund", authenticate, requireAdmin, refundAdminPayment);
export default router;
