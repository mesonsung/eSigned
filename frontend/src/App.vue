<template>
  <v-app>
    <!-- Material Design 3 App Bar -->
    <v-app-bar
      v-if="showNavigation"
      app
      color="primary"
      elevation="0"
      class="material-design-3-bar"
    >
      <v-app-bar-nav-icon @click="drawer = !drawer">
        <v-icon>mdi-menu</v-icon>
      </v-app-bar-nav-icon>
      
      <v-toolbar-title class="text-h6 font-weight-medium">
        <v-icon class="mr-2">mdi-file-sign</v-icon>
        eSigned
      </v-toolbar-title>
      
      <v-spacer></v-spacer>
      
      <!-- Theme Toggle -->
      <v-btn
        icon
        @click="toggleTheme"
        class="mr-2"
      >
        <v-icon>{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>
      
      <!-- User Menu -->
      <v-menu offset-y>
        <template v-slot:activator="{ props }">
          <v-btn
            icon
            v-bind="props"
          >
            <v-avatar size="32" color="surface-variant">
              <v-icon>mdi-account</v-icon>
            </v-avatar>
          </v-btn>
        </template>
        <v-list class="material-design-3-list">
          <v-list-item>
            <v-list-item-title class="text-subtitle-2">{{ user?.username }}</v-list-item-title>
            <v-list-item-subtitle>{{ user?.email }}</v-list-item-subtitle>
          </v-list-item>
          <v-divider class="my-2"></v-divider>
          <v-list-item @click="logout" class="material-design-3-item">
            <template v-slot:prepend>
              <v-icon>mdi-logout</v-icon>
            </template>
            <v-list-item-title>Logout</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Material Design 3 Navigation Drawer -->
    <v-navigation-drawer
      v-if="showNavigation"
      v-model="drawer"
      app
      temporary
      color="surface"
      class="material-design-3-drawer"
    >
      <v-list class="pa-4">
        <v-list-item
          v-for="item in menuItems"
          :key="item.title"
          :to="item.to"
          class="mb-2 material-design-3-item"
          rounded="xl"
        >
          <template v-slot:prepend>
            <v-icon>{{ item.icon }}</v-icon>
          </template>
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main class="material-design-3-main">
      <router-view />
    </v-main>

    <!-- Material Design 3 Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      location="top end"
      class="material-design-3-snackbar"
    >
      <div class="d-flex align-center">
        <v-icon class="mr-2">{{ getSnackbarIcon(snackbar.color) }}</v-icon>
        {{ snackbar.text }}
      </div>
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from 'vuetify'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const theme = useTheme()
const authStore = useAuthStore()

// Reactive data
const drawer = ref(false)
const snackbar = ref({
  show: false,
  text: '',
  color: 'success',
  timeout: 3000
})

// Menu items with Material Design 3 icons
const menuItems = ref([
  { title: 'Dashboard', icon: 'mdi-view-dashboard-outline', to: '/dashboard' },
  { title: 'Sign Document', icon: 'mdi-file-sign', to: '/sign' },
  { title: 'My Documents', icon: 'mdi-file-document-multiple-outline', to: '/documents' }
])

// Computed properties
const showNavigation = computed(() => {
  return route.name !== 'login' && route.name !== 'register'
})

const user = computed(() => authStore.user)
const isDark = computed(() => theme.global.current.value.dark)

// Methods
const toggleTheme = () => {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
}

const logout = async () => {
  await authStore.logout()
}

const getSnackbarIcon = (color) => {
  const icons = {
    success: 'mdi-check-circle',
    error: 'mdi-alert-circle',
    warning: 'mdi-alert',
    info: 'mdi-information'
  }
  return icons[color] || 'mdi-information'
}

// Global snackbar function
const showSnackbar = (text, color = 'success', timeout = 3000) => {
  snackbar.value = {
    show: true,
    text,
    color,
    timeout
  }
}

// Make showSnackbar available globally
window.showSnackbar = showSnackbar

onMounted(() => {
  // Initialize theme
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    theme.global.name.value = savedTheme
  }
})
</script>

<style>
/* Material Design 3 Global Styles */
html {
  overflow-y: auto;
}

.v-application {
  font-family: 'Roboto', sans-serif;
}

/* Material Design 3 App Bar */
.material-design-3-bar {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

/* Material Design 3 Navigation Drawer */
.material-design-3-drawer {
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.material-design-3-item {
  border-radius: 12px !important;
  margin: 4px 0;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.material-design-3-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.material-design-3-item.v-list-item--active {
  background-color: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
}

/* Material Design 3 Main Content */
.material-design-3-main {
  background-color: rgb(var(--v-theme-background));
}

/* Material Design 3 Snackbar */
.material-design-3-snackbar {
  border-radius: 16px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
}

/* Material Design 3 List */
.material-design-3-list {
  border-radius: 16px;
  padding: 8px;
}

/* Custom scrollbar with Material Design 3 colors */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-on-surface), 0.3);
}

/* Material Design 3 Smooth transitions */
.v-btn {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 20px;
}

.v-card {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 16px;
}

.v-text-field {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Material Design 3 Glass morphism effect */
.glass-card {
  background: rgba(var(--v-theme-surface), 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* Material Design 3 Gradient backgrounds */
.gradient-bg {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-tertiary)) 100%);
}

.gradient-bg-secondary {
  background: linear-gradient(135deg, rgb(var(--v-theme-secondary)) 0%, rgb(var(--v-theme-primary)) 100%);
}

.gradient-bg-success {
  background: linear-gradient(135deg, rgb(var(--v-theme-success)) 0%, rgb(var(--v-theme-primary)) 100%);
}

/* Material Design 3 Elevation shadows */
.elevation-1 {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
}

.elevation-2 {
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
}

.elevation-3 {
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23);
}

.elevation-4 {
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22);
}

.elevation-5 {
  box-shadow: 0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22);
}

/* Material Design 3 Typography */
.text-display-large {
  font-size: 57px;
  line-height: 64px;
  font-weight: 400;
  letter-spacing: -0.25px;
}

.text-display-medium {
  font-size: 45px;
  line-height: 52px;
  font-weight: 400;
  letter-spacing: 0px;
}

.text-display-small {
  font-size: 36px;
  line-height: 44px;
  font-weight: 400;
  letter-spacing: 0px;
}

.text-headline-large {
  font-size: 32px;
  line-height: 40px;
  font-weight: 400;
  letter-spacing: 0px;
}

.text-headline-medium {
  font-size: 28px;
  line-height: 36px;
  font-weight: 400;
  letter-spacing: 0px;
}

.text-headline-small {
  font-size: 24px;
  line-height: 32px;
  font-weight: 400;
  letter-spacing: 0px;
}

.text-title-large {
  font-size: 22px;
  line-height: 28px;
  font-weight: 400;
  letter-spacing: 0px;
}

.text-title-medium {
  font-size: 16px;
  line-height: 24px;
  font-weight: 500;
  letter-spacing: 0.15px;
}

.text-title-small {
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  letter-spacing: 0.1px;
}

.text-body-large {
  font-size: 16px;
  line-height: 24px;
  font-weight: 400;
  letter-spacing: 0.5px;
}

.text-body-medium {
  font-size: 14px;
  line-height: 20px;
  font-weight: 400;
  letter-spacing: 0.25px;
}

.text-body-small {
  font-size: 12px;
  line-height: 16px;
  font-weight: 400;
  letter-spacing: 0.4px;
}

.text-label-large {
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  letter-spacing: 0.1px;
}

.text-label-medium {
  font-size: 12px;
  line-height: 16px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.text-label-small {
  font-size: 11px;
  line-height: 16px;
  font-weight: 500;
  letter-spacing: 0.5px;
}
</style>
