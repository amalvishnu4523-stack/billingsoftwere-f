import apiClient from './client';

export const returnsApi = {
  getReturns: async (params) => {
    const res = await apiClient.get('/returns', { params });
    return { data: res.data.data, pagination: res.data.pagination };
  },
  getReturn: async (id) => {
    const res = await apiClient.get(`/returns/${id}`);
    return res.data.data;
  },
  getReturnStats: async () => {
    const res = await apiClient.get('/returns/stats');
    return res.data.data;
  },
  getSaleReturnableInfo: async (saleIdentifier) => {
    const res = await apiClient.get(`/returns/sale-info/${encodeURIComponent(saleIdentifier)}`);
    return res.data.data;
  },
  createReturn: async (data) => {
    const res = await apiClient.post('/returns', data);
    return res.data.data;
  },
  updateReturnStatus: async (id, data) => {
    const res = await apiClient.put(`/returns/${id}/status`, data);
    return res.data.data;
  },
};
