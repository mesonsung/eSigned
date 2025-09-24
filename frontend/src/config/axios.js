import axios from 'axios'

// Set base URL
axios.defaults.baseURL = process.env.VUE_APP_API_URL || 'http://localhost:5000'
axios.defaults.timeout = 10000

// Request interceptor
axios.interceptors.request.use(
  (config) => {
    // Add timestamp for debugging
    config.metadata = { startTime: new Date() }
    
    // Log request
    console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`)
    
    // Add auth token if available
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
axios.interceptors.response.use(
  (response) => {
    // Log successful response
    const duration = new Date() - response.config.metadata.startTime
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`)
    
    return response
  },
  (error) => {
    // Log error response
    if (error.config?.metadata) {
      const duration = new Date() - error.config.metadata.startTime
      console.log(`❌ ${error.config.method?.toUpperCase()} ${error.config.url} (${duration}ms)`)
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      if (window.showSnackbar) {
        window.showSnackbar('Session expired. Please login again.', 'error')
      }
    }
    
    // Handle other errors
    if (error.response?.status >= 500) {
      if (window.showSnackbar) {
        window.showSnackbar('Server error. Please try again later.', 'error')
      }
    }
    
    return Promise.reject(error)
  }
)

export default axios
