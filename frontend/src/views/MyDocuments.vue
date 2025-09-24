<template>
  <v-container fluid class="pa-4">
    <v-row>
      <v-col cols="12">
        <v-card class="elevation-2" rounded="xl">
          <v-card-title class="text-headline-small font-weight-medium pa-6">
            <v-icon class="mr-2">mdi-file-document-multiple-outline</v-icon>
            My Documents
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              variant="elevated"
              rounded="xl"
              @click="refreshDocuments"
              :loading="documentsStore.loading"
            >
              <v-icon class="mr-2">mdi-refresh</v-icon>
              Refresh
            </v-btn>
          </v-card-title>
          
          <v-card-text class="pa-6">
            <!-- Loading State -->
            <div v-if="documentsStore.loading" class="text-center py-8">
              <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
              <p class="text-body-large text-medium-emphasis mt-4">Loading documents...</p>
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
            <div v-else-if="documentsStore.documents.length === 0" class="text-center py-8">
              <v-icon size="64" color="primary" class="mb-4">mdi-file-document-outline</v-icon>
              <h3 class="text-title-large font-weight-medium mb-2">No Documents Yet</h3>
              <p class="text-body-large text-medium-emphasis mb-4">
                Upload and sign your first document to get started
              </p>
            </div>

            <!-- Documents List -->
            <div v-else>
              <h3 class="text-title-large font-weight-medium mb-4">Your Documents</h3>
              
              <!-- Pending Documents -->
              <div v-if="documentsStore.pendingDocuments.length > 0" class="mb-6">
                <h4 class="text-title-medium font-weight-medium mb-3 text-warning">
                  <v-icon class="mr-2">mdi-clock-outline</v-icon>
                  Pending Documents ({{ documentsStore.pendingDocuments.length }})
                </h4>
                <v-card
                  v-for="doc in documentsStore.pendingDocuments"
                  :key="doc._id"
                  class="mb-3"
                  variant="outlined"
                >
                  <v-card-text class="d-flex align-center">
                    <v-icon class="mr-3" color="warning">mdi-file-document-outline</v-icon>
                    <div class="flex-grow-1">
                      <div class="text-subtitle-1 font-weight-medium">{{ doc.filename }}</div>
                      <div class="text-caption text-medium-emphasis">
                        Uploaded: {{ formatDate(doc.createdAt) }}
                      </div>
                    </div>
                    <v-chip color="warning" variant="tonal" size="small">
                      Pending
                    </v-chip>
                  </v-card-text>
                </v-card>
              </div>

              <!-- Signed Documents -->
              <div v-if="documentsStore.signedDocuments.length > 0">
                <h4 class="text-title-medium font-weight-medium mb-3 text-success">
                  <v-icon class="mr-2">mdi-check-circle-outline</v-icon>
                  Signed Documents ({{ documentsStore.signedDocuments.length }})
                </h4>
                <v-card
                  v-for="doc in documentsStore.signedDocuments"
                  :key="doc._id"
                  class="mb-3"
                  variant="outlined"
                >
                  <v-card-text class="d-flex align-center">
                    <v-icon class="mr-3" color="success">mdi-file-document-check-outline</v-icon>
                    <div class="flex-grow-1">
                      <div class="text-subtitle-1 font-weight-medium">{{ doc.filename }}</div>
                      <div class="text-caption text-medium-emphasis">
                        Signed: {{ formatDate(doc.updatedAt) }}
                      </div>
                    </div>
                    <div class="d-flex align-center">
                      <v-chip color="success" variant="tonal" size="small" class="mr-2">
                        Signed
                      </v-chip>
                      <v-btn
                        color="secondary"
                        variant="outlined"
                        size="small"
                        @click="previewSignedDocument(doc._id)"
                        :loading="previewingDocId === doc._id"
                        class="mr-2"
                      >
                        <v-icon class="mr-1">mdi-eye</v-icon>
                        Preview
                      </v-btn>
                      <v-btn
                        color="primary"
                        variant="elevated"
                        size="small"
                        @click="downloadSignedDocument(doc._id)"
                        :loading="downloadingDocId === doc._id"
                      >
                        <v-icon class="mr-1">mdi-download</v-icon>
                        Download
                      </v-btn>
                    </div>
                  </v-card-text>
                </v-card>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- PDF Preview Modal -->
    <v-dialog
      v-model="previewModal.show"
      max-width="90vw"
      max-height="90vh"
      persistent
    >
      <v-card class="preview-modal">
        <v-card-title class="d-flex align-center justify-space-between">
          <span class="text-h6 font-weight-medium">
            <v-icon class="mr-2">mdi-file-document-check-outline</v-icon>
            {{ previewModal.filename }}
          </span>
          <div class="d-flex align-center">
            <v-btn
              color="primary"
              variant="elevated"
              size="small"
              @click="downloadFromPreview"
              class="mr-2"
            >
              <v-icon class="mr-1">mdi-download</v-icon>
              Download
            </v-btn>
            <v-btn
              icon
              @click="closePreview"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text class="pa-0" style="height: 80vh;">
          <div v-if="previewModal.loading" class="d-flex align-center justify-center" style="height: 100%;">
            <div class="text-center">
              <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
              <p class="text-body-large text-medium-emphasis mt-4">Loading PDF preview...</p>
            </div>
          </div>
          
          <div v-else-if="previewModal.error" class="d-flex align-center justify-center" style="height: 100%;">
            <v-alert
              type="error"
              variant="tonal"
              class="ma-4"
            >
              {{ previewModal.error }}
            </v-alert>
          </div>
          
          <div v-else-if="previewModal.url" class="pdf-preview-container">
            <iframe
              :src="previewModal.url + '#toolbar=1&navpanes=1&scrollbar=1'"
              width="100%"
              height="100%"
              frameborder="0"
              class="preview-iframe"
              type="application/pdf"
            ></iframe>
            
            <!-- Fallback for browsers that don't support PDF in iframe -->
            <div v-if="!previewModal.iframeSupported" class="pdf-fallback">
              <v-alert
                type="info"
                variant="tonal"
                class="ma-4"
              >
                <div class="text-center">
                  <v-icon size="48" class="mb-2">mdi-file-pdf-box</v-icon>
                  <p class="text-h6 mb-2">PDF Preview</p>
                  <p class="text-body-medium mb-4">Your browser doesn't support PDF preview in this window.</p>
                  <v-btn
                    color="primary"
                    variant="elevated"
                    @click="openPdfInNewTab"
                    class="mr-2"
                  >
                    <v-icon class="mr-1">mdi-open-in-new</v-icon>
                    Open in New Tab
                  </v-btn>
                  <v-btn
                    color="secondary"
                    variant="outlined"
                    @click="downloadFromPreview"
                  >
                    <v-icon class="mr-1">mdi-download</v-icon>
                    Download
                  </v-btn>
                </div>
              </v-alert>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useDocumentsStore } from '@/stores/documents'

const documentsStore = useDocumentsStore()
const downloadingDocId = ref(null)
const previewingDocId = ref(null)

// Preview modal state
const previewModal = ref({
  show: false,
  loading: false,
  error: null,
  url: null,
  filename: '',
  docId: null,
  iframeSupported: true
})

const refreshDocuments = async () => {
  try {
    await documentsStore.fetchDocuments()
    if (window.showSnackbar) {
      window.showSnackbar('Documents refreshed!', 'success')
    }
  } catch (error) {
    if (window.showSnackbar) {
      window.showSnackbar('Failed to refresh documents', 'error')
    }
  }
}

const downloadSignedDocument = async (docId) => {
  downloadingDocId.value = docId
  try {
    const result = await documentsStore.downloadDocument(docId)
    if (result.success) {
      if (window.showSnackbar) {
        window.showSnackbar('Document downloaded successfully!', 'success')
      }
    } else {
      if (window.showSnackbar) {
        window.showSnackbar(result.error || 'Download failed', 'error')
      }
    }
  } catch (error) {
    if (window.showSnackbar) {
      window.showSnackbar('Download failed', 'error')
    }
  } finally {
    downloadingDocId.value = null
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown'
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

const previewSignedDocument = async (docId) => {
  previewingDocId.value = docId
  
  // Find the document to get filename
  const doc = documentsStore.documents.find(d => d._id === docId)
  if (!doc) {
    if (window.showSnackbar) {
      window.showSnackbar('Document not found', 'error')
    }
    previewingDocId.value = null
    return
  }
  
  // Open modal and start loading
  previewModal.value = {
    show: true,
    loading: true,
    error: null,
    url: null,
    filename: doc.filename,
    docId: docId
  }
  
  try {
    const result = await documentsStore.previewDocument(docId)
    if (result.success) {
      previewModal.value.loading = false
      previewModal.value.url = result.previewUrl
      
      // Test iframe support by checking if PDF can be loaded
      setTimeout(() => {
        const iframe = document.querySelector('.preview-iframe')
        if (iframe) {
          iframe.onerror = () => {
            previewModal.value.iframeSupported = false
          }
          iframe.onload = () => {
            previewModal.value.iframeSupported = true
          }
        }
      }, 1000)
    } else {
      previewModal.value.loading = false
      previewModal.value.error = result.error
    }
  } catch (error) {
    previewModal.value.loading = false
    previewModal.value.error = 'Failed to load PDF preview'
    if (window.showSnackbar) {
      window.showSnackbar('Failed to load PDF preview', 'error')
    }
  } finally {
    previewingDocId.value = null
  }
}

const closePreview = () => {
  // Clean up the blob URL to prevent memory leaks
  if (previewModal.value.url) {
    window.URL.revokeObjectURL(previewModal.value.url)
  }
  
  previewModal.value = {
    show: false,
    loading: false,
    error: null,
    url: null,
    filename: '',
    docId: null
  }
}

const downloadFromPreview = async () => {
  if (!previewModal.value.docId) return
  
  try {
    await downloadSignedDocument(previewModal.value.docId)
  } catch (error) {
    if (window.showSnackbar) {
      window.showSnackbar('Download failed', 'error')
    }
  }
}

const openPdfInNewTab = () => {
  if (previewModal.value.url) {
    window.open(previewModal.value.url, '_blank')
  }
}

// Load documents when component mounts
onMounted(() => {
  refreshDocuments()
})
</script>

<style scoped>
.preview-modal {
  height: 90vh;
}

.preview-iframe {
  border: none;
  background: white;
}

/* Responsive design for preview modal */
@media (max-width: 768px) {
  .preview-modal {
    height: 95vh;
  }
  
  .preview-modal .v-card-title {
    flex-direction: column;
    align-items: flex-start !important;
  }
  
  .preview-modal .v-card-title > div {
    margin-top: 8px;
  }
}
</style>