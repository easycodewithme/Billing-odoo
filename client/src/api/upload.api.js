import api from './axios';

export const uploadFile = (category, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/upload/${category}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteFile = (category, filename) => api.delete(`/upload/${category}/${filename}`);
