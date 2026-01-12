<script setup lang="ts">
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold">
        Welcome back, {{ userStore.userName }}!
      </h1>
      <p class="text-body-1 text-medium-emphasis">
        Here's your financial overview
      </p>
    </div>

    <!-- Quick Stats Row -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4">
          <div class="d-flex align-center">
            <v-avatar color="primary" size="48" class="mr-3">
              <v-icon icon="mdi-wallet" />
            </v-avatar>
            <div>
              <div class="text-body-2 text-medium-emphasis">Net Worth</div>
              <div class="text-h6 font-weight-bold">Loading...</div>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4">
          <div class="d-flex align-center">
            <v-avatar color="success" size="48" class="mr-3">
              <v-icon icon="mdi-cash-plus" />
            </v-avatar>
            <div>
              <div class="text-body-2 text-medium-emphasis">Monthly Income</div>
              <div class="text-h6 font-weight-bold">Loading...</div>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4">
          <div class="d-flex align-center">
            <v-avatar color="warning" size="48" class="mr-3">
              <v-icon icon="mdi-cart" />
            </v-avatar>
            <div>
              <div class="text-body-2 text-medium-emphasis">
                Monthly Expenses
              </div>
              <div class="text-h6 font-weight-bold">Loading...</div>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4">
          <div class="d-flex align-center">
            <v-avatar color="fire-orange" size="48" class="mr-3">
              <v-icon icon="mdi-fire" />
            </v-avatar>
            <div>
              <div class="text-body-2 text-medium-emphasis">FIRE Progress</div>
              <div class="text-h6 font-weight-bold">Loading...</div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Main Content Grid -->
    <v-row>
      <!-- Left Column -->
      <v-col cols="12" lg="8">
        <!-- Net Worth Chart -->
        <v-card class="mb-6">
          <v-card-title>Net Worth Trend</v-card-title>
          <v-card-text>
            <div
              class="d-flex align-center justify-center"
              style="height: 300px"
            >
              <v-progress-circular indeterminate color="primary" />
            </div>
          </v-card-text>
        </v-card>

        <!-- Recent Transactions -->
        <v-card>
          <v-card-title>Recent Transactions</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item
                v-for="i in 5"
                :key="i"
                :title="`Transaction ${i}`"
                subtitle="Loading..."
              >
                <template #prepend>
                  <v-skeleton-loader type="avatar" />
                </template>
                <template #append>
                  <v-skeleton-loader type="text" width="80" />
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Right Column -->
      <v-col cols="12" lg="4">
        <!-- FIRE Progress Card -->
        <v-card class="mb-6">
          <v-card-title>FIRE Journey</v-card-title>
          <v-card-text>
            <div class="text-center">
              <v-progress-circular
                :model-value="0"
                :size="150"
                :width="12"
                color="fire-orange"
              >
                <div class="text-h5 font-weight-bold">0%</div>
              </v-progress-circular>
              <p class="text-body-2 text-medium-emphasis mt-4">
                Calculate your FIRE number to get started
              </p>
              <v-btn
                color="primary"
                variant="outlined"
                to="/dashboard/fire-goals"
                class="mt-2"
              >
                FIRE Calculator
              </v-btn>
            </div>
          </v-card-text>
        </v-card>

        <!-- Quick Actions -->
        <v-card>
          <v-card-title>Quick Actions</v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item
                prepend-icon="mdi-plus"
                title="Add Expense"
                to="/dashboard/expenses/track"
              />
              <v-list-item
                prepend-icon="mdi-cash-plus"
                title="Record Income"
                to="/income"
              />
              <v-list-item
                prepend-icon="mdi-calculator"
                title="Tax Calculator"
                to="/dashboard/tax-planning/calculator"
              />
              <v-list-item
                prepend-icon="mdi-target"
                title="Set Goal"
                to="/dashboard/fire-goals/goals"
              />
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
