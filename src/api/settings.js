import apiClient from './client';

export const settingsApi = {
  getShop: async () => {
    const res = await apiClient.get('/settings/shop');
    return res.data.data;
  },
  updateShop: async (data) => {
    const res = await apiClient.put('/settings/shop', data);
    return res.data.data;
  },
  updateProfile: async (data) => {
    const res = await apiClient.put('/settings/profile', data);
    return res.data.data;
  },
  changePassword: async (data) => {
    await apiClient.put('/settings/change-password', data);
  },
};
