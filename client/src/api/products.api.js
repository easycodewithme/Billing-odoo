import api from './axios';

export const getProducts = (params) => api.get('/products', { params });
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);
export const addVariant = (productId, data) => api.post(`/products/${productId}/variants`, data);
export const updateVariant = (productId, variantId, data) => api.put(`/products/${productId}/variants/${variantId}`, data);
export const deleteVariant = (productId, variantId) => api.delete(`/products/${productId}/variants/${variantId}`);
