import api from './axios';

export const getShopProducts = (params) => api.get('/shop/products', { params });
export const getShopProduct = (id) => api.get(`/shop/products/${id}`);
export const getShopPlans = () => api.get('/shop/plans');
export const submitSubscriptionRequest = (data) => api.post('/shop/subscribe', data);
export const acceptQuotation = (id) => api.post(`/shop/subscriptions/${id}/accept`);
export const rejectQuotation = (id, data) => api.post(`/shop/subscriptions/${id}/reject`, data);
export const paySubscription = (id) => api.post(`/shop/subscriptions/${id}/pay`);
