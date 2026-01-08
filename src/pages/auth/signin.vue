<script setup lang="ts">
import { ref } from "vue";

const isLoading = ref(false);

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
