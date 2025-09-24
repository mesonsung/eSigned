<template>
  <v-container fluid class="fill-height">
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="6" lg="4">
        <!-- Material Design 3 Login Card -->
        <v-card class="elevation-4" rounded="xl">
          <v-card-title class="text-center pa-8 pb-4">
            <v-icon size="48" color="primary" class="mb-4">mdi-file-sign</v-icon>
            <h1 class="text-headline-medium font-weight-medium">Welcome to eSigned</h1>
            <p class="text-body-medium text-medium-emphasis mt-2">
              Sign in to your account
            </p>
          </v-card-title>
          
          <v-card-text class="pa-8 pt-2">
            <v-form @submit.prevent="handleLogin">
              <v-text-field
                v-model="form.username"
                label="Username"
                variant="outlined"
                rounded="xl"
                class="mb-4"
                :error-messages="errors.username"
                prepend-inner-icon="mdi-account"
              ></v-text-field>
              
              <v-text-field
                v-model="form.password"
                label="Password"
                type="password"
                variant="outlined"
                rounded="xl"
                class="mb-6"
                :error-messages="errors.password"
                prepend-inner-icon="mdi-lock"
              ></v-text-field>
              
              <v-btn
                type="submit"
                color="primary"
                variant="elevated"
                size="large"
                block
                rounded="xl"
                :loading="loading"
                class="mb-4"
              >
                <v-icon class="mr-2">mdi-login</v-icon>
                Sign In
              </v-btn>
            </v-form>
          </v-card-text>
          
          <v-card-actions class="pa-8 pt-0">
            <v-spacer></v-spacer>
            <p class="text-body-medium text-medium-emphasis">
              Don't have an account?
              <v-btn
                color="primary"
                variant="text"
                rounded="xl"
                @click="$router.push('/register')"
              >
                Sign Up
              </v-btn>
            </p>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// Reactive data
const loading = ref(false)
const form = reactive({
  username: '',
  password: ''
})

const errors = reactive({
  username: '',
  password: ''
})

// Methods
const validateForm = () => {
  errors.username = ''
  errors.password = ''
  
  if (!form.username) {
    errors.username = 'Username is required'
  }
  
  if (!form.password) {
    errors.password = 'Password is required'
  }
  
  return !errors.username && !errors.password
}

const handleLogin = async () => {
  if (!validateForm()) return
  
  loading.value = true
  
  try {
    const result = await authStore.login(form)
    
    if (result.success) {
      if (window.showSnackbar) {
        window.showSnackbar('Login successful!', 'success')
      }
      router.push('/dashboard')
    } else {
      // Check if account needs activation
      if (result.requiresActivation) {
        router.push({
          name: 'activate',
          query: {
            email: result.email,
            message: result.error
          }
        })
      } else {
        if (window.showSnackbar) {
          window.showSnackbar(result.error || 'Login failed', 'error')
        }
      }
    }
  } catch (error) {
    if (window.showSnackbar) {
      window.showSnackbar('An error occurred during login', 'error')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}
</style>