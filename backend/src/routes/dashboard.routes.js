import { Router } from "express";
import { getDashboardStats, getLeaderboard } from "../controllers/dashboard.controller.js";
const router = Router();
router.get("/", getDashboardStats);
router.get("/leaderboard", getLeaderboard);
export default router;
