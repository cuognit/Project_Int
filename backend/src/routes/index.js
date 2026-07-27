import { Router } from 'express';
import orderRoutes from './order.routes.js';
import userRoutes from './user.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import productRoutes from './product.routes.js';
import authRoutes from './auth.routes.js';
import cartRoutes from './cart.routes.js';
import notificationRoutes from './notification.routes.js';
import categoryRoutes from './category.routes.js';

const router = Router();
router.get('/health', (_req, res) => res.json({ message: 'Backend đang hoạt động' }));
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/orders', orderRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/cart', cartRoutes);
router.use('/notifications', notificationRoutes);

export default router;
