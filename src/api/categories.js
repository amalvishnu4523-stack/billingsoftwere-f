import apiClient from './client';

export const categoriesApi = {
  getAll: async () => {
    const res = await apiClient.get('/categories');
    return res.data.data;
  },
  create: async (data) => {
    const res = await apiClient.post('/categories', data);
    return res.data.data;
  },
  update: async (id, data) => {
    const res = await apiClient.put(`/categories/${id}`, data);
    return res.data.data;
  },
  delete: async (id) => {
    await apiClient.delete(`/categories/${id}`);
  },
};
