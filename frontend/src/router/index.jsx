import { createBrowserRouter, Navigate } from 'react-router-dom';
import ShopLayout from '../layouts/ShopLayout.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import GuestRoute from './GuestRoute.jsx';

// Shop Pages
import ShopHomePage from '../pages/shop/ShopHomePage.jsx';
import ProductsListPage from '../pages/shop/ProductsListPage.jsx';
import ShopProductDetailPage from '../pages/shop/ShopProductDetailPage.jsx';
import AboutPage from '../pages/shop/AboutPage.jsx';
import PoliciesPage from '../pages/shop/PoliciesPage.jsx';
import CartPage from '../pages/shop/CartPage.jsx';
import CheckoutPage from '../pages/shop/CheckoutPage.jsx';
import MyOrdersPage from '../pages/shop/MyOrdersPage.jsx';
import CustomerOrderDetailPage from '../pages/shop/CustomerOrderDetailPage.jsx';

import ProfilePage from '../pages/shop/ProfilePage.jsx';

// Admin Pages
import DashboardPage from '../pages/admin/DashboardPage.jsx';
import UsersPage from '../pages/admin/UsersPage.jsx';
import ProductsPage from '../pages/admin/ProductsPage.jsx';


// Auth & Common Pages
import LoginPage from '../pages/auth/LoginPage.jsx';
import RegisterPage from '../pages/auth/RegisterPage.jsx';
import UnauthorizedPage from '../pages/auth/UnauthorizedPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';

const router = createBrowserRouter([
  // Guest-only Auth Pages
  {
    element: <GuestRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  { path: '/unauthorized', element: <UnauthorizedPage /> },

  // Shop Layout Routes (User / Customer Facing)
  {
    element: <ShopLayout />,
    children: [
      { index: true, element: <ShopHomePage /> },
      { path: 'products', element: <ProductsListPage /> },
      { path: 'products/:id', element: <ShopProductDetailPage /> },
      { path: 'policies', element: <PoliciesPage /> },
      { path: 'about', element: <AboutPage /> },

      // Protected Customer Routes
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'profile', element: <ProfilePage /> },
          { path: 'checkout', element: <CheckoutPage /> },
          { path: 'my-orders', element: <MyOrdersPage /> },
          { path: 'my-orders/:orderId', element: <CustomerOrderDetailPage /> },
          { path: 'my-order', element: <Navigate to="/my-orders" replace /> },
          { path: 'my-order/:orderId', element: <CustomerOrderDetailPage /> },
          { path: 'cart', element: <CartPage /> },
        ],
      },
    ],
  },

  // Protected Admin Layout Routes (Admin Only)
  {
    path: 'admin',
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'users', element: <UsersPage /> },
          { path: 'users/:userId', element: <UsersPage /> },
          { path: 'products', element: <ProductsPage /> },
          
        ],
      },
    ],
  },

  // 404 Catch-All
  { path: '*', element: <NotFoundPage /> },
]);

export default router;
