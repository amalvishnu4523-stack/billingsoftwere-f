import apiClient from './client';

const p = (period, startDate, endDate) => ({
  period,
  ...(startDate && { startDate }),
  ...(endDate && { endDate }),
});

export const reportsApi = {
  getSummary: async (period, startDate, endDate) => {
    const res = await apiClient.get('/reports/summary', { params: p(period, startDate, endDate) });
    return res.data.data;
  },
  getTrend: async (period, startDate, endDate) => {
    const res = await apiClient.get('/reports/trend', { params: p(period, startDate, endDate) });
    return res.data.data;
  },
  getTopProducts: async (period, startDate, endDate) => {
    const res = await apiClient.get('/reports/top-products', { params: p(period, startDate, endDate) });
    return res.data.data;
  },
  getPaymentBreakdown: async (period, startDate, endDate) => {
    const res = await apiClient.get('/reports/payment-breakdown', { params: p(period, startDate, endDate) });
    return res.data.data;
  },
  getStockValuation: async () => {
    const res = await apiClient.get('/reports/stock-valuation');
    return res.data.data;
  },
};
