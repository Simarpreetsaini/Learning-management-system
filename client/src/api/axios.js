import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000, // 10 second timeout
});

// Add a request interceptor to include token
axiosInstance.interceptors.request.use(
  (config) => {
    console.log('Axios: Making request to:', config.baseURL + config.url);
    console.log('Axios: Request method:', config.method);
    console.log('Axios: Request data:', config.data);
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Axios: Token added to request headers');
    } else {
      console.log('Axios: No token found in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('Axios: Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors globally
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('Axios: Response received:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('Axios: Response error:', error);
    
    if (error.response) {
      // Server responded with error status
      console.error('Axios: Server error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url
      });
    } else if (error.request) {
      // Request was made but no response received
      console.error('Axios: No response received:', {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL
      });
      
      // Check if it's a network error
      if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        console.error('Axios: Network error detected - server may be down or unreachable');
      }
    } else {
      // Something else happened
      console.error('Axios: Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
