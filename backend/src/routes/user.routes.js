import { Router } from 'express';
import { 
  listUsers, 
  getUserDetail, 
  listUserHaveOrders, 
  listOrdersByUserId,
  getProfile,
  updateProfile,
  changePassword,
  adminUpdateUser
} from '../controllers/user.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Profile routes for logged-in user
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

// Admin routes
router.get('/', listUsers);
router.get('/haveorders', listUserHaveOrders);
router.get('/:userId', getUserDetail);
router.get('/:userId/orders', listOrdersByUserId);
router.put('/:userId', authenticate, requireAdmin, adminUpdateUser);

export default router;

