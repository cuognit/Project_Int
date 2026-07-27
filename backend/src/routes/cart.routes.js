import { Router } from "express";
import {
  addItem,
  getCart,
  removeItem,
  updateItem,
} from "../controllers/cart.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(authenticate);
router.get("/", getCart);
router.post("/items", addItem);
router.patch("/items/:productId", updateItem);
router.delete("/items/:productId", removeItem);
export default router;
