import api from './axios';

export const getSubscriptions = (params) => api.get('/subscriptions', { params });
export const getSubscription = (id) => api.get(`/subscriptions/${id}`);
export const createSubscription = (data) => api.post('/subscriptions', data);
export const updateSubscription = (id, data) => api.put(`/subscriptions/${id}`, data);
export const updateSubscriptionStatus = (id, data) => api.patch(`/subscriptions/${id}/status`, data);
export const applyTemplate = (id, data) => api.post(`/subscriptions/${id}/apply-template`, data);
export const addOrderLine = (subId, data) => api.post(`/subscriptions/${subId}/order-lines`, data);
export const updateOrderLine = (subId, lineId, data) => api.put(`/subscriptions/${subId}/order-lines/${lineId}`, data);
export const deleteOrderLine = (subId, lineId) => api.delete(`/subscriptions/${subId}/order-lines/${lineId}`);
