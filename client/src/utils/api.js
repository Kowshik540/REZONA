import axios from 'axios';

// Default API instance — 30s timeout for normal requests
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rezona_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // AI-powered endpoints need longer timeout
  const aiEndpoints = ['/resume/analyze', '/resume/modify', '/resume/generate', '/resume/generate-preview', '/resume/cover-letter'];
  if (aiEndpoints.some(ep => config.url?.includes(ep))) {
    config.timeout = 120000; // 2 minutes for AI operations
  }
  return config;
});

// Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network error — server down or no internet
    if (!error.response) {
      console.error('Network error — server may be down');
      return Promise.reject(new Error('Network error. Please check your connection and try again.'));
    }
    // Token expired or invalid
    if (error.response.status === 401) {
      localStorage.removeItem('rezona_token');
      localStorage.removeItem('rezona_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
