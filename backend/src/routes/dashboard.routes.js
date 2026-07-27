import { Router } from "express";
import { getDashboardStats, getLeaderboard } from "../controllers/dashboard.controller.js";
import { authenticate, requireAdmin } from "../middlewares/auth.middleware.js";
const router = Router();
router.use(authenticate, requireAdmin);
router.get("/", getDashboardStats);
router.get("/leaderboard", getLeaderboard);
export default router;
