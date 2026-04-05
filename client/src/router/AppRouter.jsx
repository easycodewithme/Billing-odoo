import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import RoleLayout from '../components/layout/RoleLayout';

import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import DashboardPage from '../pages/DashboardPage';
import ProductsPage from '../pages/ProductsPage';
import PlansPage from '../pages/PlansPage';
import SubscriptionsPage from '../pages/SubscriptionsPage';
import SubscriptionDetailPage from '../pages/SubscriptionDetailPage';
import QuotationTemplatesPage from '../pages/QuotationTemplatesPage';
import InvoicesPage from '../pages/InvoicesPage';
import InvoiceDetailPage from '../pages/InvoiceDetailPage';
import PaymentsPage from '../pages/PaymentsPage';
import DiscountsPage from '../pages/DiscountsPage';
import TaxesPage from '../pages/TaxesPage';
import UsersPage from '../pages/UsersPage';
import ReportsPage from '../pages/ReportsPage';
import ProfilePage from '../pages/ProfilePage';
import NotFoundPage from '../pages/NotFoundPage';
import PaymentSuccessPage from '../pages/PaymentSuccessPage';
import PaymentCancelPage from '../pages/PaymentCancelPage';
import ShopPage from '../pages/shop/ShopPage';
import ShopProductDetailPage from '../pages/shop/ProductDetailPage';
import ShopPlansPage from '../pages/shop/PlansPage';

export default function AppRouter() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Payment return pages (public, user redirected from Stripe) */}
      <Route path="/payments/success" element={<PaymentSuccessPage />} />
      <Route path="/payments/cancel" element={<PaymentCancelPage />} />

      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleLayout />}>
          {/* All authenticated users */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/subscriptions/:id" element={<SubscriptionDetailPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Shop pages (portal uses same layout) */}
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/shop/plans" element={<ShopPlansPage />} />
          <Route path="/shop/:id" element={<ShopProductDetailPage />} />

          {/* Admin / internal_user only */}
          <Route element={<RoleRoute roles={['admin', 'internal_user']} />}>
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/plans" element={<PlansPage />} />
            <Route path="/quotation-templates" element={<QuotationTemplatesPage />} />
            <Route path="/taxes" element={<TaxesPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Route>

          {/* Admin / internal_user */}
          <Route element={<RoleRoute roles={['admin', 'internal_user']} />}>
            <Route path="/discounts" element={<DiscountsPage />} />
          </Route>

          <Route element={<RoleRoute roles={['admin', 'internal_user']} />}>
            <Route path="/users" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
