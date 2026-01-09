<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";

const router = useRouter();
const userStore = useUserStore();

const isLoading = ref(false);
const email = ref("");
const password = ref("");
const name = ref("");
const errorMessage = ref("");
const isSignUp = ref(false);

const isDev = import.meta.env.DEV;

// Sign in with email/password
const signInWithEmail = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = "Please enter email and password";
    return;
  }

  isLoading.value = true;
  errorMessage.value = "";

  try {
    const res = await fetch("/api/auth/sign-in/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: email.value,
        password: password.value,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      errorMessage.value = data.message || "Sign in failed. Please check your credentials.";
      return;
    }

    // Fetch session to update user store
    await userStore.fetchSession();

    // Redirect to dashboard
    router.push("/dashboard");
  } catch (error) {
    console.error("Sign in error:", error);
    errorMessage.value = "Sign in failed. Please try again.";
  } finally {
    isLoading.value = false;
  }
};

// Sign up with email/password
const signUpWithEmail = async () => {
  if (!email.value || !password.value || !name.value) {
    errorMessage.value = "Please fill in all fields";
    return;
  }

  if (password.value.length < 8) {
    errorMessage.value = "Password must be at least 8 characters";
    return;
  }

  isLoading.value = true;
  errorMessage.value = "";

  try {
    const res = await fetch("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: email.value,
        password: password.value,
        name: name.value,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      errorMessage.value = data.message || "Sign up failed. Please try again.";
      return;
    }

    // Auto sign in after sign up
    await signInWithEmail();
  } catch (error) {
    console.error("Sign up error:", error);
    errorMessage.value = "Sign up failed. Please try again.";
  } finally {
    isLoading.value = false;
  }
};

// Toggle between sign in and sign up
const toggleMode = () => {
  isSignUp.value = !isSignUp.value;
  errorMessage.value = "";
};

// Dev mode: quick login with test credentials
const devQuickLogin = async () => {
  email.value = "test@firekaro.com";
  password.value = "testpassword123";
  name.value = "Test User";

  // First try to sign in, if fails, sign up
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const signInRes = await fetch("/api/auth/sign-in/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: email.value,
        password: password.value,
      }),
    });

    if (signInRes.ok) {
      await userStore.fetchSession();
      router.push("/dashboard");
      return;
    }

    // If sign in failed, try sign up
    const signUpRes = await fetch("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: email.value,
        password: password.value,
        name: name.value,
      }),
    });

    if (signUpRes.ok) {
      // Sign in after sign up
      await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.value,
          password: password.value,
        }),
      });
      await userStore.fetchSession();
      router.push("/dashboard");
    } else {
      const data = await signUpRes.json();
      errorMessage.value = data.message || "Quick login failed";
    }
  } catch (error) {
    console.error("Quick login error:", error);
    errorMessage.value = "Quick login failed. Please try again.";
  } finally {
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
                  {{ isSignUp ? "Create your account" : "Sign in to your account" }}
                </p>
              </div>

              <!-- Error Alert -->
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

              <!-- Sign Up: Name Field -->
              <v-text-field
                v-if="isSignUp"
                v-model="name"
                label="Full Name"
                variant="outlined"
                density="compact"
                class="mb-3"
                prepend-inner-icon="mdi-account"
                @keyup.enter="signUpWithEmail"
              />

              <!-- Email Field -->
              <v-text-field
                v-model="email"
                label="Email"
                type="email"
                variant="outlined"
                density="compact"
                class="mb-3"
                prepend-inner-icon="mdi-email"
                @keyup.enter="isSignUp ? signUpWithEmail() : signInWithEmail()"
              />

              <!-- Password Field -->
              <v-text-field
                v-model="password"
                label="Password"
                type="password"
                variant="outlined"
                density="compact"
                class="mb-4"
                prepend-inner-icon="mdi-lock"
                :hint="isSignUp ? 'Minimum 8 characters' : ''"
                @keyup.enter="isSignUp ? signUpWithEmail() : signInWithEmail()"
              />

              <!-- Submit Button -->
              <v-btn
                block
                color="primary"
                size="large"
                :loading="isLoading"
                @click="isSignUp ? signUpWithEmail() : signInWithEmail()"
              >
                <v-icon :icon="isSignUp ? 'mdi-account-plus' : 'mdi-login'" class="mr-2" />
                {{ isSignUp ? "Create Account" : "Sign In" }}
              </v-btn>

              <!-- Toggle Sign In / Sign Up -->
              <div class="text-center mt-4">
                <span class="text-medium-emphasis">
                  {{ isSignUp ? "Already have an account?" : "Don't have an account?" }}
                </span>
                <v-btn
                  variant="text"
                  color="primary"
                  density="compact"
                  @click="toggleMode"
                >
                  {{ isSignUp ? "Sign In" : "Sign Up" }}
                </v-btn>
              </div>

              <!-- Dev Mode Quick Login -->
              <template v-if="isDev">
                <v-divider class="my-4" />
                <p class="text-caption text-medium-emphasis text-center mb-3">
                  Development Mode
                </p>
                <v-btn
                  block
                  variant="outlined"
                  color="secondary"
                  :loading="isLoading"
                  @click="devQuickLogin"
                >
                  <v-icon icon="mdi-lightning-bolt" class="mr-2" />
                  Quick Dev Login
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
