import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// --- Request interceptor: attach JWT access token & handle multipart ---
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorageSafe.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // When uploading FormData (e.g. prescription images), remove any preset Content-Type
    // so the browser / HTTP client generates the multipart boundary automatically
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// --- Response interceptor: refresh token on 401, normalize errors ---
let isRefreshing = false;
let pendingRequests = [];

const processQueue = (error, token = null) => {
  pendingRequests.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  pendingRequests = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh') {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      const refreshToken = localStorageSafe.getItem('refreshToken');

      if (!refreshToken) {
        clearSession();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        const newAccessToken = data.data.accessToken;
        const newRefreshToken = data.data.refreshToken;

        localStorageSafe.setItem('accessToken', newAccessToken);
        localStorageSafe.setItem('refreshToken', newRefreshToken);

        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearSession();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(normalizeError(error));
  }
);

function normalizeError(error) {
  let message = 'Something went wrong. Please try again.';

  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      message = data.errors.join('. ');
    } else if (data?.message && typeof data.message === 'string' && data.message.trim() !== '') {
      message = data.message;
    } else if (status === 401) {
      message = 'Your login session has expired. Please log in again.';
    } else if (status === 403) {
      message = 'You do not have permission to perform this action.';
    } else if (status === 404) {
      message = 'The requested resource or pharmacy information could not be found.';
    } else if (status === 409) {
      message = 'A conflicting record already exists.';
    } else if (status >= 500) {
      message = 'Server error occurred. Please try again shortly.';
    }
  } else if (error.message) {
    if (error.message.includes('Network Error')) {
      message = 'Unable to connect to MediFindAI servers. Please check your connection.';
    } else if (error.message.includes('timeout')) {
      message = 'The request timed out. Please try again.';
    } else {
      message = error.message;
    }
  }

  return { ...error, message };
}

function clearSession() {
  localStorageSafe.removeItem('accessToken');
  localStorageSafe.removeItem('refreshToken');
  localStorageSafe.removeItem('user');
  if (typeof window !== 'undefined') {
    const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/', '/about', '/features', '/medicines', '/pharmacies'];
    const currentPath = window.location.pathname;
    if (!publicPaths.includes(currentPath)) {
      window.location.href = '/login';
    }
  }
}

// Guards against SSR / non-browser environments referencing `localStorage`.
const localStorageSafe = {
  getItem: (key) => (typeof window !== 'undefined' ? window.localStorage.getItem(key) : null),
  setItem: (key, value) => typeof window !== 'undefined' && window.localStorage.setItem(key, value),
  removeItem: (key) => typeof window !== 'undefined' && window.localStorage.removeItem(key),
};

export default apiClient;
