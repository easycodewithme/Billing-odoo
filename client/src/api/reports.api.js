import api from './axios';

export const getDashboardStats = () => api.get('/reports/dashboard-stats');
export const getRevenueReport = (params) => api.get('/reports/revenue', { params });
export const getSubscriptionReport = (params) => api.get('/reports/subscriptions', { params });
export const getPaymentReport = (params) => api.get('/reports/payments', { params });
export const getOverdueInvoices = (params) => api.get('/reports/overdue-invoices', { params });
