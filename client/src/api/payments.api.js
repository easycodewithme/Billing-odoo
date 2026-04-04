import api from './axios';

export const getPayments = (params) => api.get('/payments', { params });
export const getPayment = (id) => api.get(`/payments/${id}`);
export const createManualPayment = (data) => api.post('/payments/manual', data);
export const createCheckout = (invoiceId) => api.post(`/payments/checkout/${invoiceId}`);
