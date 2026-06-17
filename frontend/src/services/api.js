import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: '/api'
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const mlApi = axios.create({
  baseURL: '/ml'
});

export default api;
