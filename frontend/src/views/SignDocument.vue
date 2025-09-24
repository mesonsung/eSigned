<template>
  <v-container fluid class="pa-4">
    <!-- Upload Section -->
    <v-row v-if="!uploadedFile" class="mb-6">
      <v-col cols="12">
        <v-card class="elevation-4 glass-card" rounded="xl">
          <v-card-title class="text-headline-small font-weight-medium pa-6">
            <v-icon class="mr-2">mdi-file-sign</v-icon>
            Upload Document
          </v-card-title>
          
          <v-card-text class="pa-6">
            <div class="text-center py-8">
              <v-icon size="64" color="primary" class="mb-4">mdi-file-document-outline</v-icon>
              <h3 class="text-title-large font-weight-medium mb-2">Document Signing</h3>
              <p class="text-body-large text-medium-emphasis mb-6">
                Upload and sign your PDF documents
              </p>
              
              <!-- File Upload Area -->
              <div class="upload-area" @click="triggerFileUpload" @dragover.prevent @drop.prevent="handleDrop">
                <input
                  ref="fileInput"
                  type="file"
                  accept=".pdf"
                  @change="handleFileSelect"
                  style="display: none"
                />
                
                <div class="upload-content">
                  <v-icon size="48" color="primary" class="mb-4">mdi-cloud-upload</v-icon>
                  <h4 class="text-title-medium mb-2">Drop your PDF here</h4>
                  <p class="text-body-2 text-medium-emphasis mb-4">or click to browse</p>
                  <v-btn
                    color="primary"
                    variant="elevated"
                    size="large"
                    rounded="xl"
                  >
                    <v-icon class="mr-2">mdi-upload</v-icon>
                    Choose PDF File
                  </v-btn>
                </div>
              </div>
              
              <p class="text-caption text-medium-emphasis mt-4">
                Supported format: PDF only • Max size: 10MB
              </p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Document Preview and Signing Section -->
    <v-row v-if="uploadedFile" class="mb-6">
      <v-col cols="12">
        <v-card class="elevation-4 glass-card" rounded="xl">
          <v-card-title class="d-flex align-center justify-space-between pa-6">
            <div class="d-flex align-center">
              <v-icon class="mr-2">mdi-file-document</v-icon>
              <span class="text-headline-small font-weight-medium">{{ uploadedFile.name }}</span>
            </div>
            <v-btn
              color="error"
              variant="outlined"
              @click="resetUpload"
            >
              <v-icon left>mdi-close</v-icon>
              Remove Document
            </v-btn>
          </v-card-title>
          
          <v-divider></v-divider>
          
          <v-card-text class="pa-6">
            <!-- PDF Viewer -->
            <div class="mb-6">
              <PdfViewer :pdfFile="uploadedFile" />
            </div>
            
            <!-- Signature Section -->
            <div class="mb-6">
              <SignaturePad
                @signature="handleSignature"
                @signature-cleared="handleSignatureCleared"
                @success="handleSignatureSuccess"
                @error="handleSignatureError"
              />
            </div>
            
            <!-- Action Buttons -->
            <div class="d-flex justify-space-between align-center">
              <v-btn
                color="secondary"
                variant="outlined"
                @click="resetUpload"
              >
                <v-icon left>mdi-arrow-left</v-icon>
                Upload Another
              </v-btn>
              
              <v-btn
                color="primary"
                variant="elevated"
                size="large"
                :disabled="!signatureData"
                :loading="signing"
                @click="signDocument"
              >
                <v-icon left>mdi-file-sign</v-icon>
                Sign Document
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Success Message -->
    <v-row v-if="signedDocument" class="mb-6">
      <v-col cols="12">
        <v-card class="elevation-4 glass-card gradient-bg-success" rounded="xl">
          <v-card-text class="pa-6 text-center text-white">
            <v-icon size="64" class="mb-4">mdi-check-circle</v-icon>
            <h3 class="text-title-large font-weight-bold mb-2">Document Signed Successfully!</h3>
            <p class="text-body-large mb-4">
              Your document has been signed and saved.
            </p>
            <v-btn
              color="white"
              variant="elevated"
              size="large"
              @click="downloadSignedDocument"
            >
              <v-icon left>mdi-download</v-icon>
              Download Signed Document
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDocumentsStore } from '@/stores/documents'
import PdfViewer from '@/components/PdfViewer.vue'
import SignaturePad from '@/components/SignaturePad.vue'

const documentsStore = useDocumentsStore()

// Reactive data
const uploadedFile = ref(null)
const signatureData = ref(null)
const signing = ref(false)
const signedDocument = ref(null)
const fileInput = ref(null)

// Computed properties
const canSign = computed(() => uploadedFile.value && signatureData.value)

// File upload methods
const triggerFileUpload = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    validateAndSetFile(file)
  }
}

const handleDrop = (event) => {
  const files = event.dataTransfer.files
  if (files.length > 0) {
    validateAndSetFile(files[0])
  }
}

const validateAndSetFile = (file) => {
  // Validate file type
  if (file.type !== 'application/pdf') {
    window.showSnackbar('Please select a PDF file only.', 'error')
    return
  }
  
  // Validate file size (10MB limit)
  const maxSize = 10 * 1024 * 1024 // 10MB in bytes
  if (file.size > maxSize) {
    window.showSnackbar('File size must be less than 10MB.', 'error')
    return
  }
  
  uploadedFile.value = file
  signatureData.value = null
  signedDocument.value = null
  
  window.showSnackbar(`File "${file.name}" uploaded successfully!`, 'success')
}

const resetUpload = () => {
  uploadedFile.value = null
  signatureData.value = null
  signedDocument.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Signature handling methods
const handleSignature = (signature) => {
  signatureData.value = signature
}

const handleSignatureCleared = () => {
  signatureData.value = null
}

const handleSignatureSuccess = (message) => {
  window.showSnackbar(message, 'success')
}

const handleSignatureError = (message) => {
  window.showSnackbar(message, 'error')
}

// Document signing method
const signDocument = async () => {
  if (!uploadedFile.value || !signatureData.value) {
    window.showSnackbar('Please upload a document and create a signature first.', 'error')
    return
  }
  
  signing.value = true
  
  try {
    // First upload the document
    const uploadResult = await documentsStore.uploadDocument(uploadedFile.value)
    
    if (uploadResult.success) {
      // Then sign the document
      const signResult = await documentsStore.signDocument(
        uploadResult.document._id,
        signatureData.value
      )
      
      if (signResult.success) {
        signedDocument.value = {
          ...uploadResult.document,
          signedPath: signResult.signedPath
        }
        window.showSnackbar('Document signed successfully!', 'success')
      } else {
        window.showSnackbar(signResult.error || 'Failed to sign document.', 'error')
      }
    } else {
      // Handle duplicate file error with warning
      if (uploadResult.errorType === 'duplicate_file') {
        window.showSnackbar(`⚠️ ${uploadResult.error}`, 'warning')
      } else {
        window.showSnackbar(uploadResult.error || 'Failed to upload document.', 'error')
      }
    }
  } catch (error) {
    console.error('Error signing document:', error)
    window.showSnackbar('An error occurred while signing the document.', 'error')
  } finally {
    signing.value = false
  }
}

// Download signed document
const downloadSignedDocument = async () => {
  if (!signedDocument.value) return
  
  try {
    await documentsStore.downloadDocument(signedDocument.value._id)
    window.showSnackbar('Download started!', 'success')
  } catch (error) {
    console.error('Error downloading document:', error)
    window.showSnackbar('Failed to download document.', 'error')
  }
}
</script>

<style scoped>
.glass-card {
  background: rgba(var(--v-theme-surface), 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(var(--v-theme-outline), 0.2);
}

.gradient-bg-success {
  background: linear-gradient(135deg, rgb(var(--v-theme-success)) 0%, rgb(var(--v-theme-primary)) 100%);
}

.upload-area {
  border: 2px dashed rgba(var(--v-theme-primary), 0.3);
  border-radius: 16px;
  padding: 48px 24px;
  background: rgba(var(--v-theme-primary), 0.02);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.upload-area:hover {
  border-color: rgba(var(--v-theme-primary), 0.6);
  background: rgba(var(--v-theme-primary), 0.05);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(var(--v-theme-primary), 0.15);
}

.upload-area:active {
  transform: translateY(0);
}

.upload-content {
  text-align: center;
  pointer-events: none;
}

.upload-area::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent 30%, rgba(var(--v-theme-primary), 0.1) 50%, transparent 70%);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.upload-area:hover::before {
  transform: translateX(100%);
}

/* Responsive design */
@media (max-width: 768px) {
  .upload-area {
    padding: 32px 16px;
  }
  
  .upload-content h4 {
    font-size: 1.1rem;
  }
  
  .upload-content p {
    font-size: 0.9rem;
  }
}

/* Drag and drop visual feedback */
.upload-area.drag-over {
  border-color: rgba(var(--v-theme-primary), 0.8);
  background: rgba(var(--v-theme-primary), 0.1);
  transform: scale(1.02);
}

/* Animation for file upload success */
@keyframes uploadSuccess {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.upload-success {
  animation: uploadSuccess 0.6s ease-in-out;
}

/* Loading state for signing */
.signing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(var(--v-theme-surface), 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

/* Signature pad integration */
.signature-section {
  border-top: 1px solid rgba(var(--v-theme-outline), 0.2);
  padding-top: 24px;
  margin-top: 24px;
}

/* Action buttons styling */
.action-buttons {
  border-top: 1px solid rgba(var(--v-theme-outline), 0.2);
  padding-top: 24px;
  margin-top: 24px;
}

/* Success state styling */
.success-card {
  background: linear-gradient(135deg, rgb(var(--v-theme-success)) 0%, rgb(var(--v-theme-primary)) 100%);
  color: white;
}

.success-card .v-icon {
  color: white !important;
}

.success-card .v-btn {
  background: rgba(255, 255, 255, 0.2) !important;
  color: white !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
}

.success-card .v-btn:hover {
  background: rgba(255, 255, 255, 0.3) !important;
}
</style>