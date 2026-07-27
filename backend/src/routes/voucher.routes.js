import { Router } from "express";
import {
  availableVouchers,
  createVoucher,
  listAdminVouchers,
  updateVoucher,
  updateVoucherStatus,
  validateVoucher,
} from "../controllers/voucher.controller.js";
import { authenticate, requireAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);
router.get("/available", availableVouchers);
router.post("/validate", validateVoucher);
router.get("/admin", requireAdmin, listAdminVouchers);
router.post("/", requireAdmin, createVoucher);
router.put("/:voucherId", requireAdmin, updateVoucher);
router.patch("/:voucherId/status", requireAdmin, updateVoucherStatus);

export default router;
