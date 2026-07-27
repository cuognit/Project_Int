import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "../controllers/category.controller.js";
import { authenticate, requireAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", listCategories);
router.post("/", authenticate, requireAdmin, createCategory);
router.put("/:categoryId", authenticate, requireAdmin, updateCategory);
router.delete("/:categoryId", authenticate, requireAdmin, deleteCategory);

export default router;
