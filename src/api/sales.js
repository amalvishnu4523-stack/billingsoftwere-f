import apiClient from './client';

export const salesApi = {
  createSale: async (data) => {
    const res = await apiClient.post('/sales', data);
    return res.data.data;
  },
  getSales: async (params) => {
    const res = await apiClient.get('/sales', { params });
    return { data: res.data.data, pagination: res.data.pagination };
  },
  getSale: async (id) => {
    const res = await apiClient.get(`/sales/${id}`);
    return res.data.data;
  },
  cancelSale: async (id, reason) => {
    const res = await apiClient.post(`/sales/${id}/cancel`, { reason });
    return res.data.data;
  },
  getDashboardStats: async () => {
    const res = await apiClient.get('/dashboard/stats');
    return res.data.data;
  },
};
