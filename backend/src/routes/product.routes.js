import { Router } from "express";
import {
  createProduct, deleteProduct, getProduct, listProducts, updateProduct,
} from "../controllers/product.controller.js";

const router = Router();
router.get("/", listProducts);
router.get("/:productId", getProduct);
router.post("/", createProduct);
router.put("/:productId", updateProduct);
router.delete("/:productId", deleteProduct);
export default router;
