<template>
  <v-container fluid class="pa-4">
    <!-- Material Design 3 Welcome Section -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card class="gradient-bg pa-6 text-white elevation-3" rounded="xl">
          <v-row align="center">
            <v-col cols="12" md="8">
              <h1 class="text-display-small font-weight-medium mb-2">
                Welcome back, {{ user?.username }}! 👋
              </h1>
              <p class="text-body-large opacity-90">
                Manage your documents and digital signatures with ease
              </p>
            </v-col>
            <v-col cols="12" md="4" class="text-center">
              <v-icon size="80" class="opacity-80">mdi-file-document-edit-outline</v-icon>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>

    <!-- Material Design 3 Quick Actions -->
    <v-row class="mb-6">
      <v-col cols="12">
        <h2 class="text-headline-small font-weight-medium mb-4">Quick Actions</h2>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-card 
          class="glass-card pa-6 text-center h-100 elevation-2" 
          rounded="xl"
          @click="$router.push('/sign')"
          style="cursor: pointer;"
        >
          <v-icon size="48" color="primary" class="mb-4">mdi-file-sign</v-icon>
          <h3 class="text-title-medium font-weight-medium mb-2">Sign Document</h3>
          <p class="text-body-medium text-medium-emphasis">
            Upload and sign a new PDF document
          </p>
        </v-card>
      </v-col>
      
      <v-col cols="12" sm="6" md="4">
        <v-card 
          class="glass-card pa-6 text-center h-100 elevation-2" 
          rounded="xl"
          @click="$router.push('/documents')"
          style="cursor: pointer;"
        >
          <v-icon size="48" color="secondary" class="mb-4">mdi-file-document-multiple-outline</v-icon>
          <h3 class="text-title-medium font-weight-medium mb-2">Signed Documents</h3>
          <p class="text-body-medium text-medium-emphasis">
            View and manage your signed documents
          </p>
        </v-card>
      </v-col>
      
      <v-col cols="12" sm="6" md="4">
        <v-card 
          class="glass-card pa-6 text-center h-100 elevation-2" 
          rounded="xl"
          @click="refreshDocuments"
          style="cursor: pointer;"
        >
          <v-icon size="48" color="tertiary" class="mb-4">mdi-refresh</v-icon>
          <h3 class="text-title-medium font-weight-medium mb-2">Refresh</h3>
          <p class="text-body-medium text-medium-emphasis">
            Update your document list
          </p>
        </v-card>
      </v-col>
    </v-row>

    <!-- Material Design 3 Recent Documents -->
    <v-row>
      <v-col cols="12">
        <v-card class="elevation-2" rounded="xl">
          <v-card-title class="text-headline-small font-weight-medium pa-6 pb-2">
            <v-icon class="mr-2">mdi-clock-outline</v-icon>
            Recent Documents
          </v-card-title>
          
          <v-card-text class="pa-6 pt-2">
            <v-progress-circular
              v-if="loading"
              indeterminate
              color="primary"
              class="ma-4"
            ></v-progress-circular>
            
            <div v-else-if="documents.length === 0" class="text-center py-8">
              <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-file-document-outline</v-icon>
              <h3 class="text-title-medium text-medium-emphasis mb-2">No signed documents yet</h3>
              <p class="text-body-medium text-medium-emphasis mb-4">
                Upload your first document to get started
              </p>
              <v-btn
                v-if="authStore.isAdmin"
                color="primary"
                variant="elevated"
                rounded="xl"
                @click="$router.push('/sign')"
              >
                <v-icon class="mr-2">mdi-plus</v-icon>
                Upload Document
              </v-btn>
              <div v-else class="text-center">
                <v-chip color="warning" variant="tonal" size="large" rounded="xl">
                  <v-icon class="mr-2">mdi-shield-account</v-icon>
                  Admin Access Required
                </v-chip>
              </div>
            </div>
            
            <v-list v-else class="pa-0">
              <v-list-item
                v-for="document in documents.slice(0, 5)"
                :key="document._id"
                class="mb-2 rounded-xl"
                :class="document.status === 'signed' ? 'bg-success-lighten-5' : 'bg-warning-lighten-5'"
              >
                <template v-slot:prepend>
                  <v-avatar color="primary" size="40" rounded="lg">
                    <v-icon color="white">{{ getDocumentIcon(document.status) }}</v-icon>
                  </v-avatar>
                </template>
                
                <v-list-item-title class="text-title-small font-weight-medium">
                  {{ document.filename }}
                </v-list-item-title>
                
                <v-list-item-subtitle class="text-body-small text-medium-emphasis">
                  {{ formatDate(document.createdAt) }} • {{ document.status }}
                </v-list-item-subtitle>
                
                <template v-slot:append>
                  <v-chip
                    :color="document.status === 'signed' ? 'success' : 'warning'"
                    size="small"
                    rounded="xl"
                  >
                    {{ document.status }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
            
            <div v-if="documents.length > 5" class="text-center mt-4">
              <v-btn
                color="primary"
                variant="text"
                rounded="xl"
                @click="$router.push('/documents')"
              >
                View All Signed Documents
                <v-icon class="ml-2">mdi-arrow-right</v-icon>
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useDocumentsStore } from '@/stores/documents'

const authStore = useAuthStore()
const documentsStore = useDocumentsStore()

// Reactive data
const loading = ref(false)

// Computed properties
const user = computed(() => authStore.user)
const documents = computed(() => documentsStore.documents)

// Methods
const refreshDocuments = async () => {
  loading.value = true
  try {
    await documentsStore.fetchDocuments()
    if (window.showSnackbar) {
      window.showSnackbar('Documents refreshed successfully!', 'success')
    }
  } catch (error) {
    if (window.showSnackbar) {
      window.showSnackbar('Failed to refresh documents', 'error')
    }
  } finally {
    loading.value = false
  }
}

const getDocumentIcon = (status) => {
  return status === 'signed' ? 'mdi-check-circle' : 'mdi-clock-outline'
}

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown date'
  return new Date(dateString).toLocaleDateString()
}

// Lifecycle
onMounted(() => {
  refreshDocuments()
})
</script>

<style scoped>
.glass-card {
  background: rgba(var(--v-theme-surface), 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.gradient-bg {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-tertiary)) 100%);
}
</style>