import apiClient from './client';

export const usersApi = {
  getAll: async () => {
    const res = await apiClient.get('/users');
    return res.data.data;
  },
  create: async (data) => {
    const res = await apiClient.post('/users', data);
    return res.data.data;
  },
  update: async (id, data) => {
    const res = await apiClient.put(`/users/${id}`, data);
    return res.data.data;
  },
  resetPassword: async (id, newPassword) => {
    await apiClient.post(`/users/${id}/reset-password`, { newPassword });
  },
  delete: async (id) => {
    await apiClient.delete(`/users/${id}`);
  },
};
