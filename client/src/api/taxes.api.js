import api from './axios';

export const getTaxes = (params) => api.get('/taxes', { params });
export const getTax = (id) => api.get(`/taxes/${id}`);
export const createTax = (data) => api.post('/taxes', data);
export const updateTax = (id, data) => api.put(`/taxes/${id}`, data);
export const deleteTax = (id) => api.delete(`/taxes/${id}`);
