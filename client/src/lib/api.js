import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5050/api' });
api.interceptors.request.use(config => { const token = localStorage.getItem('civicfix_token'); if (token) config.headers.Authorization = `Bearer ${token}`; return config; });
api.interceptors.response.use(r => r, e => { if (e.response?.status === 401) { localStorage.removeItem('civicfix_token'); localStorage.removeItem('civicfix_user'); } return Promise.reject(e); });
export default api;
