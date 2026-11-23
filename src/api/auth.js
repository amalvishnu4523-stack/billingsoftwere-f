import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

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
  login: (email, password) => post('/auth/login', { email, password }),
  logout: () => post('/auth/logout'),
  refresh: () => post('/auth/refresh'),
  me: () => get('/auth/me').then((d) => d.user),
  setup: (data) => post('/auth/setup', data).then((d) => ({ message: 'Admin created successfully', user: d.user })),
};

export default authApi;
