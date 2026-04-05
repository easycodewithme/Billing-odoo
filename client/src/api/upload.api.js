import api from './axios';

export const uploadFile = (category, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/upload/${category}`, formData);
};

export const deleteFile = (category, filename) => api.delete(`/upload/${category}/${filename}`);
