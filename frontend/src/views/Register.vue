<template>
  <v-container fluid class="fill-height">
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="6" lg="4">
        <!-- Material Design 3 Register Card -->
        <v-card class="elevation-4" rounded="xl">
          <v-card-title class="text-center pa-8 pb-4">
            <v-icon size="48" color="primary" class="mb-4">mdi-account-plus</v-icon>
            <h1 class="text-headline-medium font-weight-medium">Create Account</h1>
            <p class="text-body-medium text-medium-emphasis mt-2">
              Join eSigned today
            </p>
          </v-card-title>
          
          <v-card-text class="pa-8 pt-2">
            <v-form @submit.prevent="handleRegister">
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
                v-model="form.email"
                label="Email"
                type="email"
                variant="outlined"
                rounded="xl"
                class="mb-4"
                :error-messages="errors.email"
                prepend-inner-icon="mdi-email"
              ></v-text-field>
              
              <v-text-field
                v-model="form.password"
                label="Password"
                type="password"
                variant="outlined"
                rounded="xl"
                class="mb-4"
                :error-messages="errors.password"
                prepend-inner-icon="mdi-lock"
              ></v-text-field>
              
              <v-text-field
                v-model="form.confirmPassword"
                label="Confirm Password"
                type="password"
                variant="outlined"
                rounded="xl"
                class="mb-6"
                :error-messages="errors.confirmPassword"
                prepend-inner-icon="mdi-lock-check"
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
                <v-icon class="mr-2">mdi-account-plus</v-icon>
                Create Account
              </v-btn>
            </v-form>
          </v-card-text>
          
          <v-card-actions class="pa-8 pt-0">
            <v-spacer></v-spacer>
            <p class="text-body-medium text-medium-emphasis">
              Already have an account?
              <v-btn
                color="primary"
                variant="text"
                rounded="xl"
                @click="$router.push('/login')"
              >
                Sign In
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
  email: '',
  password: '',
  confirmPassword: ''
})

const errors = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// Methods
const validateForm = () => {
  errors.username = ''
  errors.email = ''
  errors.password = ''
  errors.confirmPassword = ''
  
  if (!form.username) {
    errors.username = 'Username is required'
  }
  
  if (!form.email) {
    errors.email = 'Email is required'
  } else if (!/\S+@\S+\.\S+/.test(form.email)) {
    errors.email = 'Email is invalid'
  }
  
  if (!form.password) {
    errors.password = 'Password is required'
  } else if (form.password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
  }
  
  if (!form.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password'
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
  }
  
  return !Object.values(errors).some(error => error)
}

const handleRegister = async () => {
  if (!validateForm()) return
  
  loading.value = true
  
  try {
    const result = await authStore.register(form)
    
    if (result.success) {
      if (result.requiresActivation) {
        // Redirect to activation page
        router.push({
          name: 'activate',
          query: {
            email: result.email,
            message: result.message
          }
        })
      } else {
        // Legacy registration (should not happen)
        if (window.showSnackbar) {
          window.showSnackbar('Account created successfully!', 'success')
        }
        router.push('/dashboard')
      }
    } else {
      if (window.showSnackbar) {
        window.showSnackbar(result.error || 'Registration failed', 'error')
      }
    }
  } catch (error) {
    if (window.showSnackbar) {
      window.showSnackbar('An error occurred during registration', 'error')
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