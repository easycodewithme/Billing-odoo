import api from './axios';

export const getDiscounts = (params) => api.get('/discounts', { params });
export const getDiscount = (id) => api.get(`/discounts/${id}`);
export const createDiscount = (data) => api.post('/discounts', data);
export const updateDiscount = (id, data) => api.put(`/discounts/${id}`, data);
export const deleteDiscount = (id) => api.delete(`/discounts/${id}`);
export const attachProduct = (discountId, data) => api.post(`/discounts/${discountId}/products`, data);
export const detachProduct = (discountId, productId) => api.delete(`/discounts/${discountId}/products/${productId}`);
export const attachSubscription = (discountId, data) => api.post(`/discounts/${discountId}/subscriptions`, data);
export const detachSubscription = (discountId, subscriptionId) => api.delete(`/discounts/${discountId}/subscriptions/${subscriptionId}`);
