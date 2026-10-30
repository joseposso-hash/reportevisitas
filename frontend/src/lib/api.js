import axios from 'axios';
import { useAuthStore } from '../stores/auth';

export const api = axios.create({
  baseURL: 'http://localhost:3001/api'  // <-- Debe ser esta URL
});

api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});