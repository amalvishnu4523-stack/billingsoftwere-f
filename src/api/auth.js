import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

const REFRESH_TOKEN_KEY = 'erp_refresh_token';

export const authAxios = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let getAccessToken = null;

export function initAuthAxiosStore(getter) {
  getAccessToken = getter;
}

authAxios.interceptors.request.use((reqConfig) => {
  const token = getAccessToken?.() ?? null;
  if (token && reqConfig.headers) {
    reqConfig.headers['Authorization'] = `Bearer ${token}`;
  }
  return reqConfig;
});

async function post(url, data) {
  const res = await authAxios.post(url, data);
  return res.data.data;
}

async function get(url) {
  const res = await authAxios.get(url);
  return res.data.data;
}

const authApi = {
  login: async (email, password) => {
    const data = await post('/auth/login', { email, password });
    // Store refresh token in localStorage for cross-origin deployments
    if (data?.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    }
    return data;
  },
  logout: async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    try {
      await post('/auth/logout', refreshToken ? { refreshToken } : {});
    } finally {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  },
  refresh: async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const data = await post('/auth/refresh', refreshToken ? { refreshToken } : {});
    // Rotate stored refresh token
    if (data?.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    }
    return data;
  },
  me: () => get('/auth/me').then((d) => d.user),
  setup: (data) => post('/auth/setup', data).then((d) => ({ message: 'Admin created successfully', user: d.user })),
};

export default authApi;
