<template>
  <v-container fluid class="pa-4">
    <!-- Document Selection Section -->
    <v-row v-if="!selectedDocument" class="mb-6">
      <v-col cols="12">
        <v-card class="elevation-4 glass-card" rounded="xl">
          <v-card-title class="text-headline-small font-weight-medium pa-6">
            <v-icon class="mr-2">mdi-file-sign</v-icon>
            Select Document to Sign
          </v-card-title>
          
          <v-card-text class="pa-6">
            <!-- Loading State -->
            <div v-if="documentsStore.loading" class="text-center py-8">
              <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
              <p class="text-body-large text-medium-emphasis mt-4">Loading signed documents...</p>
            </div>

            <!-- Error State -->
            <v-alert
              v-else-if="documentsStore.error"
              type="error"
              variant="tonal"
              class="mb-4"
              closable
              @click:close="documentsStore.clearError"
            >
              {{ documentsStore.error }}
            </v-alert>

            <!-- Empty State -->
            <div v-else-if="documentsStore.pendingDocuments.length === 0" class="text-center py-8">
              <v-icon size="64" color="primary" class="mb-4">mdi-file-document-outline</v-icon>
              <h3 class="text-title-large font-weight-medium mb-2">No Documents to Sign</h3>
              <p class="text-body-large text-medium-emphasis mb-6">
                You don't have any uploaded documents that need signing
              </p>
              <v-btn
                v-if="authStore.isAdmin"
                color="primary"
                variant="elevated"
                size="large"
                rounded="xl"
                @click="$router.push('/documents')"
              >
                <v-icon class="mr-2">mdi-upload</v-icon>
                Upload Documents
              </v-btn>
              <div v-else class="text-center">
                <v-chip color="warning" variant="tonal" size="large" rounded="xl">
                  <v-icon class="mr-2">mdi-shield-account</v-icon>
                  Admin Access Required
                </v-chip>
              </div>
            </div>

            <!-- Documents List -->
            <div v-else>
              <h3 class="text-title-large font-weight-medium mb-4">Select a Document to Sign</h3>
              <p class="text-body-large text-medium-emphasis mb-6">
                Choose from your uploaded PDF documents
              </p>
              
              <v-list class="pa-0">
                <v-list-item
                  v-for="doc in documentsStore.pendingDocuments"
                  :key="doc._id"
                  class="mb-3 rounded-xl border"
                  @click="selectDocument(doc)"
                  style="cursor: pointer;"
                >
                  <template v-slot:prepend>
                    <v-avatar color="primary" size="48" rounded="lg">
                      <v-icon color="white" size="24">mdi-file-document-outline</v-icon>
                    </v-avatar>
                  </template>
                  
                  <v-list-item-title class="text-title-medium font-weight-medium">
                    {{ doc.filename }}
                  </v-list-item-title>
                  
                  <v-list-item-subtitle class="text-body-medium text-medium-emphasis">
                    Uploaded: {{ formatDate(doc.createdAt) }}
                  </v-list-item-subtitle>
                  
                  <template v-slot:append>
                    <v-chip color="warning" variant="tonal" size="small" rounded="xl">
                      Pending
                    </v-chip>
                    <v-icon color="primary" class="ml-2">mdi-chevron-right</v-icon>
                  </template>
                </v-list-item>
              </v-list>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Document Preview and Signing Section -->
    <v-row v-if="selectedDocument" class="mb-6">
      <v-col cols="12">
        <v-card class="elevation-4 glass-card" rounded="xl">
          <v-card-title class="d-flex align-center justify-space-between pa-6">
            <div class="d-flex align-center">
              <v-icon class="mr-2">mdi-file-document</v-icon>
              <span class="text-headline-small font-weight-medium">{{ selectedDocument.filename }}</span>
            </div>
            <v-btn
              color="error"
              variant="outlined"
              @click="resetSelection"
            >
              <v-icon left>mdi-close</v-icon>
              Select Different Document
            </v-btn>
          </v-card-title>
          
          <v-divider></v-divider>
          
          <v-card-text class="pa-6">
            <!-- PDF Viewer -->
            <div class="mb-6">
              <PdfViewer :pdfFile="pdfFile" />
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
import { ref, computed, onMounted } from 'vue'
import { useDocumentsStore } from '@/stores/documents'
import { useAuthStore } from '@/stores/auth'
import PdfViewer from '@/components/PdfViewer.vue'
import SignaturePad from '@/components/SignaturePad.vue'
import axios from '@/config/axios'

const documentsStore = useDocumentsStore()
const authStore = useAuthStore()

// Reactive data
const selectedDocument = ref(null)
const signatureData = ref(null)
const signing = ref(false)
const signedDocument = ref(null)

// Computed properties
const canSign = computed(() => selectedDocument.value && signatureData.value)
const pdfFile = ref(null)

// Load documents on component mount
onMounted(async () => {
  await documentsStore.fetchDocuments()
})

// Document selection methods
const selectDocument = async (document) => {
  selectedDocument.value = document
  signatureData.value = null
  signedDocument.value = null
  
  try {
    // Fetch the PDF data using axios
    const response = await axios.get(`/api/documents/view/${document._id}`, {
      responseType: 'blob'
    })
    
    // Create a File object for the PDF viewer
    pdfFile.value = new File([response.data], document.filename, { type: 'application/pdf' })
    
    window.showSnackbar(`Selected "${document.filename}" for signing`, 'success')
  } catch (error) {
    console.error('Error loading PDF:', error)
    window.showSnackbar('Failed to load PDF document', 'error')
    selectedDocument.value = null
  }
}

const resetSelection = () => {
  selectedDocument.value = null
  signatureData.value = null
  signedDocument.value = null
  pdfFile.value = null
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
  if (!selectedDocument.value || !signatureData.value) {
    window.showSnackbar('Please select a document and create a signature first.', 'error')
    return
  }
  
  signing.value = true
  
  try {
    // Sign the selected document
    const signResult = await documentsStore.signDocument(
      selectedDocument.value._id,
      signatureData.value
    )
    
    if (signResult.success) {
      signedDocument.value = {
        ...selectedDocument.value,
        signedPath: signResult.signedPath
      }
      window.showSnackbar('Document signed successfully!', 'success')
    } else {
      window.showSnackbar(signResult.error || 'Failed to sign document.', 'error')
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

// Utility function to format dates
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
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