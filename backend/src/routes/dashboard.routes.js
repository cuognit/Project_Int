import { Router } from "express";
import {
  getAnalytics,
  getCustomers,
  getLeaderboard,
  getOrders,
  getOverview,
  getProducts,
} from "../controllers/dashboard.controller.js";
import { authenticate, requireAdmin } from "../middlewares/auth.middleware.js";
const router = Router();
router.use(authenticate, requireAdmin);
router.get("/overview", getOverview);
router.get("/analytics", getAnalytics);
router.get("/customers", getCustomers);
router.get("/orders", getOrders);
router.get("/products", getProducts);
router.get("/leaderboard", getLeaderboard);
export default router;
