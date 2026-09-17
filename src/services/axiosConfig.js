// src/services/axiosConfig.js
import axios from 'axios';

// This is the URL where your FastAPI is running
const API_BASE_URL = 'http://127.0.0.1:8000/'
// Create axios instance with default settings
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {"ngrok-skip-browser-warning": "true",
    'Content-Type': 'application/json',
  },
});



export default axiosInstance;