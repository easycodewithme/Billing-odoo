import api from './axios';

export const getTemplates = (params) => api.get('/quotation-templates', { params });
export const getTemplate = (id) => api.get(`/quotation-templates/${id}`);
export const createTemplate = (data) => api.post('/quotation-templates', data);
export const updateTemplate = (id, data) => api.put(`/quotation-templates/${id}`, data);
export const deleteTemplate = (id) => api.delete(`/quotation-templates/${id}`);
