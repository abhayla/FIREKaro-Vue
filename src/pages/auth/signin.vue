<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";

const router = useRouter();
const userStore = useUserStore();

const isLoading = ref(false);
const testEmail = ref("abhayfaircent@gmail.com");
const testPassword = ref("abhayinfosys@123");
const errorMessage = ref("");

const isDev = import.meta.env.DEV;

const signInWithGoogle = async () => {
  isLoading.value = true;
  try {
    // Redirect to Next.js OAuth endpoint
    window.location.href = "/api/auth/signin/google";
  } catch (error) {
    console.error("Sign in error:", error);
    isLoading.value = false;
  }
};

const signInWithTestCredentials = async () => {
  isLoading.value = true;
  errorMessage.value = "";
  try {
    // Get CSRF token first
    const csrfRes = await fetch("/api/auth/csrf");
    const { csrfToken } = await csrfRes.json();

    // Build form and submit to NextAuth signin endpoint
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/auth/signin/test-credentials";

    const fields = {
      csrfToken,
      email: testEmail.value,
      password: testPassword.value,
      callbackUrl: window.location.origin + "/dashboard",
    };

    for (const [key, value] of Object.entries(fields)) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
  } catch (error) {
    console.error("Test sign in error:", error);
    errorMessage.value = "Sign in failed. Please try again.";
    isLoading.value = false;
  }
};
</script>

<template>
  <v-app>
    <v-main>
      <v-container class="fill-height">
        <v-row align="center" justify="center">
          <v-col cols="12" sm="8" md="6" lg="4">
            <v-card class="pa-8">
              <!-- Logo -->
              <div class="text-center mb-6">
                <v-icon
                  icon="mdi-fire"
                  size="48"
                  color="fire-orange"
                  class="mb-2"
                />
                <h1 class="text-h5 font-weight-bold">
                  FIRE<span class="text-primary">Karo</span>
                </h1>
                <p class="text-body-2 text-medium-emphasis">
                  Sign in to your account
                </p>
              </div>

              <!-- Sign In Button -->
              <v-btn
                block
                size="large"
                variant="outlined"
                :loading="isLoading"
                @click="signInWithGoogle"
              >
                <v-icon icon="mdi-google" class="mr-2" />
                Continue with Google
              </v-btn>

              <!-- Test Login (Dev Only) -->
              <template v-if="isDev">
                <v-divider class="my-4" />

                <v-alert
                  v-if="errorMessage"
                  type="error"
                  density="compact"
                  class="mb-4"
                  closable
                  @click:close="errorMessage = ''"
                >
                  {{ errorMessage }}
                </v-alert>

                <p class="text-caption text-medium-emphasis text-center mb-3">
                  Development Mode - Test Login
                </p>

                <v-text-field
                  v-model="testEmail"
                  id="test-email"
                  label="Test Email"
                  variant="outlined"
                  density="compact"
                  class="mb-2"
                />

                <v-text-field
                  v-model="testPassword"
                  id="test-password"
                  label="Test Password"
                  type="password"
                  variant="outlined"
                  density="compact"
                  class="mb-3"
                />

                <v-btn
                  block
                  color="primary"
                  :loading="isLoading"
                  @click="signInWithTestCredentials"
                >
                  <v-icon icon="mdi-login" class="mr-2" />
                  Sign in with Test Account
                </v-btn>
              </template>

              <v-divider class="my-6" />

              <!-- Info Text -->
              <p class="text-body-2 text-medium-emphasis text-center">
                By signing in, you agree to our
                <a href="#" class="text-primary">Terms of Service</a>
                and
                <a href="#" class="text-primary">Privacy Policy</a>
              </p>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>
