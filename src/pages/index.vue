<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<template>
  <v-app>
    <v-main>
      <v-container class="fill-height">
        <v-row align="center" justify="center">
          <v-col cols="12" md="8" lg="6" class="text-center">
            <!-- Hero Section -->
            <v-icon
              icon="mdi-fire"
              size="80"
              color="fire-orange"
              class="mb-4"
            />
            <h1 class="text-h2 font-weight-bold mb-4">
              FIRE<span class="text-primary">Karo</span>
            </h1>
            <p class="text-h6 text-medium-emphasis mb-8">
              Financial Independence Planning for India
            </p>

            <!-- Features -->
            <v-row class="mb-8">
              <v-col cols="12" sm="4">
                <v-card variant="outlined" class="pa-4">
                  <v-icon
                    icon="mdi-calculator"
                    size="36"
                    color="primary"
                    class="mb-2"
                  />
                  <div class="text-subtitle-1 font-weight-medium">
                    Tax Planning
                  </div>
                  <div class="text-body-2 text-medium-emphasis">
                    Optimize your taxes with Old vs New regime comparison
                  </div>
                </v-card>
              </v-col>
              <v-col cols="12" sm="4">
                <v-card variant="outlined" class="pa-4">
                  <v-icon
                    icon="mdi-chart-line"
                    size="36"
                    color="primary"
                    class="mb-2"
                  />
                  <div class="text-subtitle-1 font-weight-medium">
                    Investments
                  </div>
                  <div class="text-body-2 text-medium-emphasis">
                    Track EPF, PPF, NPS, Stocks & Mutual Funds
                  </div>
                </v-card>
              </v-col>
              <v-col cols="12" sm="4">
                <v-card variant="outlined" class="pa-4">
                  <v-icon
                    icon="mdi-fire"
                    size="36"
                    color="fire-orange"
                    class="mb-2"
                  />
                  <div class="text-subtitle-1 font-weight-medium">
                    FIRE Goals
                  </div>
                  <div class="text-body-2 text-medium-emphasis">
                    Plan your path to Financial Independence
                  </div>
                </v-card>
              </v-col>
            </v-row>

            <!-- CTA Buttons -->
            <v-btn
              color="primary"
              size="large"
              @click="router.push('/auth/signin')"
              class="mr-4"
            >
              Get Started
              <v-icon icon="mdi-arrow-right" class="ml-2" />
            </v-btn>
            <v-btn
              variant="outlined"
              size="large"
              @click="router.push('/dashboard')"
            >
              View Demo
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>
