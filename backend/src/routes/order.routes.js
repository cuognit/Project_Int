import { Router } from "express";
import {
  cancelOrder,
  createOrder,
  getAdminOrderCounts,
  getOrder,
  listAdminOrders,
  listMyOrders,
  listOrders,
  updateStatus,
} from "../controllers/order.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
const router = Router();
router.use(authenticate);
router.post("/", createOrder);
router.get("/admin/counts", getAdminOrderCounts);
router.get("/admin", listAdminOrders);
router.get("/mine", listMyOrders);
router.get("/", listOrders);
router.get("/:orderId", getOrder);
router.patch("/:orderId/cancel", cancelOrder);
router.patch("/:orderId/status", updateStatus);
export default router;
