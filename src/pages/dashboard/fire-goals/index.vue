<script setup lang="ts">
import SectionHeader from '@/components/shared/SectionHeader.vue'
import FamilyToggle from '@/components/shared/FamilyToggle.vue'

const tabs = [
  { title: 'FIRE Dashboard', route: '/dashboard/fire-goals' },
  { title: 'Calculators', route: '/dashboard/fire-goals/calculators' },
  { title: 'Goals', route: '/dashboard/fire-goals/goals' },
  { title: 'Projections', route: '/dashboard/fire-goals/projections' },
  { title: 'Withdrawal', route: '/dashboard/fire-goals/withdrawal' },
  { title: 'Reports', route: '/dashboard/fire-goals/reports' },
]
</script>

<template>
  <div>
    <SectionHeader title="FIRE & Goals" subtitle="Your path to Financial Independence" icon="mdi-fire" :tabs="tabs" />
    <FamilyToggle class="mb-6" />

    <!-- FIRE Freedom Score -->
    <v-row class="mb-6">
      <v-col cols="12" lg="4">
        <v-card class="pa-6 text-center" color="fire-orange" dark>
          <v-icon icon="mdi-fire" size="64" class="mb-4" />
          <div class="text-h3 font-weight-bold mb-2">--</div>
          <div class="text-h6">FIRE Freedom Score</div>
          <div class="text-body-2 mt-2">SAVE | GROW | PROTECT | READY</div>
        </v-card>
      </v-col>
      <v-col cols="12" lg="8">
        <v-row>
          <v-col cols="6" md="3">
            <v-card class="pa-4 text-center">
              <div class="text-body-2 text-medium-emphasis">FIRE Number</div>
              <div class="text-h6 font-weight-bold">Loading...</div>
            </v-card>
          </v-col>
          <v-col cols="6" md="3">
            <v-card class="pa-4 text-center">
              <div class="text-body-2 text-medium-emphasis">Current Corpus</div>
              <div class="text-h6 font-weight-bold">Loading...</div>
            </v-card>
          </v-col>
          <v-col cols="6" md="3">
            <v-card class="pa-4 text-center">
              <div class="text-body-2 text-medium-emphasis">Progress</div>
              <div class="text-h6 font-weight-bold">--%</div>
            </v-card>
          </v-col>
          <v-col cols="6" md="3">
            <v-card class="pa-4 text-center">
              <div class="text-body-2 text-medium-emphasis">Years to FIRE</div>
              <div class="text-h6 font-weight-bold">--</div>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Main Content -->
    <v-row>
      <v-col cols="12" lg="8">
        <v-card>
          <v-card-title>FIRE Journey Progress</v-card-title>
          <v-card-text>
            <div class="d-flex align-center justify-center" style="height: 300px">
              <div class="text-center">
                <v-icon icon="mdi-chart-line" size="64" color="primary" class="mb-4" />
                <p class="text-medium-emphasis">
                  Your FIRE progress chart will appear here once data is loaded.
                </p>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" lg="4">
        <v-card class="mb-4">
          <v-card-title>Active Goals</v-card-title>
          <v-card-text>
            <v-alert type="info" variant="tonal">
              Set your first financial goal to get started.
            </v-alert>
            <v-btn
              color="primary"
              variant="outlined"
              block
              class="mt-4"
              to="/dashboard/fire-goals/goals"
            >
              <v-icon icon="mdi-plus" class="mr-2" />
              Add Goal
            </v-btn>
          </v-card-text>
        </v-card>
        <v-card>
          <v-card-title>Quick Actions</v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item
                prepend-icon="mdi-calculator"
                title="FIRE Calculator"
                to="/dashboard/fire-goals/calculators"
              />
              <v-list-item
                prepend-icon="mdi-chart-timeline"
                title="100-Year Projection"
                to="/dashboard/fire-goals/projections"
              />
              <v-list-item
                prepend-icon="mdi-cash-sync"
                title="Withdrawal Strategy"
                to="/dashboard/fire-goals/withdrawal"
              />
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
