import { Router } from 'express';
import { 
  listUsers, 
  getUserDetail, 
  listUserHaveOrders, 
  listOrdersByUserId,
  getProfile,
  updateProfile,
  changePassword,
  adminUpdateUser,
  updateUserAccess,
} from '../controllers/user.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Profile routes for logged-in user
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

// Admin routes
router.get('/', authenticate, requireAdmin, listUsers);
router.get('/haveorders', authenticate, requireAdmin, listUserHaveOrders);
router.get('/:userId', authenticate, requireAdmin, getUserDetail);
router.get('/:userId/orders', authenticate, requireAdmin, listOrdersByUserId);
router.put('/:userId', authenticate, requireAdmin, adminUpdateUser);
router.patch('/:userId/access', authenticate, requireAdmin, updateUserAccess);

export default router;
