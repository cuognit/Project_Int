import { Router } from "express";
import {
  listNotifications,
  markNotificationRead,
  unreadCount,
} from "../controllers/notification.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(authenticate);
router.get("/unread-count", unreadCount);
router.get("/", listNotifications);
router.patch("/:notificationId/read", markNotificationRead);

export default router;
