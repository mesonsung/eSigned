import { defineStore } from 'pinia'
import axios from '@/config/axios'
import { useAuthStore } from './auth'

export const useDocumentsStore = defineStore('documents', {
  state: () => ({
    documents: [],
    currentDocument: null,
    loading: false,
    error: null
  }),

  getters: {
    pendingDocuments: (state) => state.documents.filter(doc => doc.status === 'pending'),
    signedDocuments: (state) => state.documents.filter(doc => doc.status === 'signed')
  },

  actions: {
    async fetchDocuments() {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.get('/api/documents')
        this.documents = response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch signed documents'
      } finally {
        this.loading = false
      }
    },

    async uploadDocument(file) {
      this.loading = true
      this.error = null
      
      try {
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await axios.post('/api/documents/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        
        this.documents.push(response.data)
        return { success: true, document: response.data }
      } catch (error) {
        const errorData = error.response?.data
        
        // Handle admin required error specifically
        if (error.response?.status === 403 && errorData?.errorType === 'admin_required') {
          this.error = 'Only ADMIN users can upload PDF files. Please contact your administrator.'
          return { 
            success: false, 
            error: this.error,
            errorType: 'admin_required'
          }
        }
        
        // Handle duplicate file error specifically
        if (error.response?.status === 409 && errorData?.errorType === 'duplicate_file') {
          this.error = errorData.msg
          return { 
            success: false, 
            error: this.error,
            errorType: 'duplicate_file',
            filename: errorData.filename
          }
        }
        
        // Handle other errors
        this.error = errorData?.message || 'Upload failed'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async signDocument(docId, signatureData) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post('/api/documents/sign', {
          docId,
          signatureImageBase64: signatureData
        })
        
        // Update document status
        const docIndex = this.documents.findIndex(doc => doc._id === docId)
        if (docIndex !== -1) {
          this.documents[docIndex].status = 'signed'
          this.documents[docIndex].signedPath = response.data.signedPath
        }
        
        return { success: true, signedPath: response.data.signedPath }
      } catch (error) {
        this.error = error.response?.data?.message || 'Signing failed'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async downloadDocument(docId) {
      try {
        const authStore = useAuthStore()
        const signerId = authStore.user?.id || 'unknown'
        
        const response = await axios.get(`/api/documents/download/${docId}`, {
          responseType: 'blob'
        })
        
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `signed-by-${signerId}.pdf`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
        
        return { success: true }
      } catch (error) {
        this.error = error.response?.data?.message || 'Download failed'
        return { success: false, error: this.error }
      }
    },

    async previewDocument(docId) {
      try {
        const response = await axios.get(`/api/documents/download/${docId}`, {
          responseType: 'blob'
        })
        
        const url = window.URL.createObjectURL(new Blob([response.data]))
        return { success: true, previewUrl: url }
      } catch (error) {
        this.error = error.response?.data?.message || 'Preview failed'
        return { success: false, error: this.error }
      }
    },

    setCurrentDocument(document) {
      this.currentDocument = document
    },

    clearError() {
      this.error = null
    }
  }
})
