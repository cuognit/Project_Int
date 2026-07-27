import { Router } from "express";
import {
  createProduct, deleteProduct, getProduct, listAdminProducts, listProducts, updateProduct,
} from "../controllers/product.controller.js";
import { authenticate, requireAdmin } from "../middlewares/auth.middleware.js";

const router = Router();
router.get("/", listProducts);
router.get("/admin", authenticate, requireAdmin, listAdminProducts);
router.get("/:productId", getProduct);
router.post("/", authenticate, requireAdmin, createProduct);
router.put("/:productId", authenticate, requireAdmin, updateProduct);
router.delete("/:productId", authenticate, requireAdmin, deleteProduct);
export default router;
