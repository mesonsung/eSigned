<template>
  <v-container fluid class="fill-height">
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="6" lg="4">
        <!-- Material Design 3 Activation Card -->
        <v-card class="elevation-4" rounded="xl">
          <v-card-title class="text-center pa-8 pb-4">
            <v-icon size="48" color="primary" class="mb-4">mdi-email-check</v-icon>
            <h1 class="text-headline-medium font-weight-medium">Activate Account</h1>
            <p class="text-body-medium text-medium-emphasis mt-2">
              Check your email for activation code
            </p>
          </v-card-title>
          
          <v-card-text class="pa-8 pt-2">
            <v-alert
              v-if="activationMessage"
              type="info"
              variant="tonal"
              class="mb-4"
            >
              <v-icon slot="prepend">mdi-information</v-icon>
              {{ activationMessage }}
            </v-alert>

            <v-form @submit.prevent="handleActivation">
              <v-text-field
                v-model="form.email"
                label="Email Address"
                type="email"
                variant="outlined"
                rounded="xl"
                class="mb-4"
                :error-messages="errors.email"
                prepend-inner-icon="mdi-email"
                :disabled="loading"
              ></v-text-field>
              
              <v-text-field
                v-model="form.activationCode"
                label="Activation Code"
                variant="outlined"
                rounded="xl"
                class="mb-4"
                :error-messages="errors.activationCode"
                prepend-inner-icon="mdi-key"
                placeholder="Enter 6-digit code"
                maxlength="6"
                :disabled="loading"
              ></v-text-field>
              
              <v-btn
                type="submit"
                color="primary"
                variant="elevated"
                size="large"
                rounded="xl"
                block
                class="mb-4"
                :loading="loading"
                :disabled="!isFormValid"
              >
                <v-icon class="mr-2">mdi-check-circle</v-icon>
                Activate Account
              </v-btn>
            </v-form>

            <v-divider class="my-4"></v-divider>

            <div class="text-center">
              <p class="text-body-small text-medium-emphasis mb-2">
                Didn't receive the code?
              </p>
              <v-btn
                color="primary"
                variant="text"
                rounded="xl"
                @click="handleResendCode"
                :loading="resendLoading"
                :disabled="loading"
              >
                <v-icon class="mr-2">mdi-email-send</v-icon>
                Resend Activation Code
              </v-btn>
            </div>
          </v-card-text>
          
          <v-card-actions class="pa-8 pt-2">
            <p class="text-body-small text-center w-100">
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Reactive data
const loading = ref(false)
const resendLoading = ref(false)
const activationMessage = ref('')

const form = reactive({
  email: '',
  activationCode: ''
})

const errors = reactive({
  email: '',
  activationCode: ''
})

// Computed
const isFormValid = computed(() => {
  return form.email && form.activationCode && form.activationCode.length === 6
})

// Methods
const validateForm = () => {
  errors.email = ''
  errors.activationCode = ''
  
  if (!form.email) {
    errors.email = 'Email is required'
  } else if (!/\S+@\S+\.\S+/.test(form.email)) {
    errors.email = 'Email is invalid'
  }
  
  if (!form.activationCode) {
    errors.activationCode = 'Activation code is required'
  } else if (form.activationCode.length !== 6) {
    errors.activationCode = 'Activation code must be 6 digits'
  } else if (!/^\d{6}$/.test(form.activationCode)) {
    errors.activationCode = 'Activation code must contain only numbers'
  }
  
  return !Object.values(errors).some(error => error)
}

const handleActivation = async () => {
  if (!validateForm()) return
  
  loading.value = true
  
  try {
    const result = await authStore.activateAccount(form.email, form.activationCode)
    
    if (result.success) {
      if (window.showSnackbar) {
        window.showSnackbar(result.message || 'Account activated successfully!', 'success')
      }
      router.push('/login')
    } else {
      if (window.showSnackbar) {
        window.showSnackbar(result.error || 'Activation failed', 'error')
      }
    }
  } catch (error) {
    if (window.showSnackbar) {
      window.showSnackbar('An error occurred during activation', 'error')
    }
  } finally {
    loading.value = false
  }
}

const handleResendCode = async () => {
  if (!form.email) {
    if (window.showSnackbar) {
      window.showSnackbar('Please enter your email address first', 'warning')
    }
    return
  }

  if (!/\S+@\S+\.\S+/.test(form.email)) {
    if (window.showSnackbar) {
      window.showSnackbar('Please enter a valid email address', 'warning')
    }
    return
  }

  resendLoading.value = true
  
  try {
    const result = await authStore.resendActivationCode(form.email)
    
    if (result.success) {
      if (window.showSnackbar) {
        window.showSnackbar(result.message || 'Activation code sent successfully!', 'success')
      }
    } else {
      if (window.showSnackbar) {
        window.showSnackbar(result.error || 'Failed to resend activation code', 'error')
      }
    }
  } catch (error) {
    if (window.showSnackbar) {
      window.showSnackbar('An error occurred while resending code', 'error')
    }
  } finally {
    resendLoading.value = false
  }
}

// Initialize form with email from route params or query
onMounted(() => {
  if (route.params.email) {
    form.email = route.params.email
  } else if (route.query.email) {
    form.email = route.query.email
  }
  
  // Set activation message if coming from registration
  if (route.query.message) {
    activationMessage.value = route.query.message
  }
})
</script>

<style scoped>
/* Material Design 3 styles are inherited from App.vue */
</style>
