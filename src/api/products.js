import apiClient from './client';

export const productsApi = {
  getProducts: async (params) => {
    const res = await apiClient.get('/products', { params });
    return { data: res.data.data, pagination: res.data.pagination };
  },
  searchProducts: async (q) => {
    const res = await apiClient.get('/products/search', { params: { q } });
    return res.data.data;
  },
  getProduct: async (id) => {
    const res = await apiClient.get(`/products/${id}`);
    return res.data.data;
  },
  createProduct: async (data) => {
    const res = await apiClient.post('/products', data);
    return res.data.data;
  },
  updateProduct: async (id, data) => {
    const res = await apiClient.put(`/products/${id}`, data);
    return res.data.data;
  },
  deleteProduct: async (id) => {
    await apiClient.delete(`/products/${id}`);
  },
  getLowStock: async () => {
    const res = await apiClient.get('/products/low-stock');
    return res.data.data;
  },
};
