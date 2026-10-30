import axios from 'axios';
import { useAuthStore } from '../stores/auth';

export const api = axios.create({
  baseURL: '/api' // <-- Esta línea debe ser relativa
});

api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});