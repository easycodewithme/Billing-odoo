import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import MainLayout from '../components/layout/MainLayout';

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
import NotFoundPage from '../pages/NotFoundPage';

export default function AppRouter() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/plans" element={<PlansPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/subscriptions/:id" element={<SubscriptionDetailPage />} />
          <Route path="/quotation-templates" element={<QuotationTemplatesPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/discounts" element={<DiscountsPage />} />
          <Route path="/taxes" element={<TaxesPage />} />
          <Route path="/reports" element={<ReportsPage />} />

          {/* Admin / internal_user only */}
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
