import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'https://api-reportevisitas.onrender.com/api';

export const api = axios.create({
  baseURL: API_URL
});

api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});