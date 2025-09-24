import { defineStore } from 'pinia'
import axios from '@/config/axios'
import router from '@/router'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token'),
    loading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    userInfo: (state) => state.user,
    isAdmin: (state) => state.user?.username === 'ADMIN'
  },

  actions: {
    async login(credentials) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post('/api/auth/login', credentials)
        const { token, user } = response.data
        
        this.token = token
        this.user = user
        localStorage.setItem('token', token)
        
        return { success: true }
      } catch (error) {
        const errorData = error.response?.data
        this.error = errorData?.message || 'Login failed'
        
        // Check if account needs activation
        if (errorData?.requiresActivation) {
          return { 
            success: false, 
            error: this.error,
            requiresActivation: true,
            email: errorData.email
          }
        }
        
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async register(userData) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post('/api/auth/register', userData)
        const { msg, emailSent, requiresActivation } = response.data
        
        // Registration successful but requires activation
        if (requiresActivation) {
          return { 
            success: true, 
            requiresActivation: true,
            emailSent: emailSent,
            message: msg,
            email: userData.email
          }
        }
        
        // Legacy registration (should not happen with new backend)
        const { token, user } = response.data
        this.token = token
        this.user = user
        localStorage.setItem('token', token)
        
        return { success: true }
      } catch (error) {
        this.error = error.response?.data?.message || 'Registration failed'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('token')
      
      // Redirect to login page
      router.push('/login')
      
      // Show logout message
      if (window.showSnackbar) {
        window.showSnackbar('You have been logged out successfully', 'info')
      }
    },

    async fetchUser() {
      if (!this.token) return
      
      try {
        const response = await axios.get('/api/auth/me')
        this.user = response.data
      } catch (error) {
        this.logout()
      }
    },

    async activateAccount(email, activationCode) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post('/api/auth/activate', {
          email,
          activationCode
        })
        
        return { success: true, message: response.data.msg }
      } catch (error) {
        this.error = error.response?.data?.message || 'Activation failed'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async resendActivationCode(email) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post('/api/auth/resend-activation', {
          email
        })
        
        return { success: true, message: response.data.msg }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to resend activation code'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    clearError() {
      this.error = null
    }
  }
})
