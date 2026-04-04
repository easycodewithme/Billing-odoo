import api from './axios';

export const getInvoices = (params) => api.get('/invoices', { params });
export const getInvoice = (id) => api.get(`/invoices/${id}`);
export const generateInvoice = (subscriptionId) => api.post(`/invoices/generate/${subscriptionId}`);
export const confirmInvoice = (id) => api.patch(`/invoices/${id}/confirm`);
export const cancelInvoice = (id) => api.patch(`/invoices/${id}/cancel`);
export const sendInvoice = (id) => api.post(`/invoices/${id}/send`);
export const downloadInvoicePDF = (id) =>
  api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
