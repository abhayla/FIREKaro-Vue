<script setup lang="ts">
import { ref, computed } from 'vue'
import LoanCard from '@/components/liabilities/LoanCard.vue'
import {
  useLoans,
  formatINR,
  getLoanTypeLabel,
  type Loan,
  type LoanType
} from '@/composables/useLiabilities'

// Emits
const emit = defineEmits<{
  'add-loan': []
  'edit-loan': [loan: Loan]
  'delete-loan': [id: string]
  'view-schedule': [loan: Loan]
  'prepay': [loan: Loan]
}>()

// Data fetching
const { data: loans, isLoading, error } = useLoans()

// UI State
const typeFilter = ref<LoanType | null>(null)

// Use API data directly - ensure it's always an array
const loansList = computed(() => {
  const data = loans.value
  return Array.isArray(data) ? data : []
})

// Filter loans
const filteredLoans = computed(() => {
  if (!typeFilter.value) return loansList.value
  return loansList.value.filter(l => l.loanType === typeFilter.value)
})

// Available loan types
const loanTypes = computed(() => {
  const types = new Set(loansList.value.map(l => l.loanType))
  return Array.from(types) as LoanType[]
})

// Handlers - emit events to parent
const handleEdit = (loan: Loan) => {
  emit('edit-loan', loan)
}

const handleDelete = (id: string) => {
  emit('delete-loan', id)
}

const handleViewSchedule = (loan: Loan) => {
  emit('view-schedule', loan)
}

const handlePrepay = (loan: Loan) => {
  emit('prepay', loan)
}
</script>

<template>
  <div>
    <!-- Toolbar -->
    <v-card variant="outlined" class="mb-6">
      <v-card-text class="d-flex gap-3 flex-wrap align-center">
        <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="emit('add-loan')">
          Add Loan
        </v-btn>

        <v-spacer />

        <v-select
          v-model="typeFilter"
          :items="[
            { title: 'All Types', value: null },
            ...loanTypes.map(t => ({ title: getLoanTypeLabel(t), value: t }))
          ]"
          label="Filter by Type"
          variant="outlined"
          density="compact"
          hide-details
          style="max-width: 220px"
        />

        <!-- Type Chips -->
        <div class="d-flex gap-2 flex-wrap">
          <v-chip
            v-for="type in loanTypes"
            :key="type"
            variant="tonal"
            size="small"
          >
            {{ loansList.filter(l => l.loanType === type).length }} {{ getLoanTypeLabel(type) }}
          </v-chip>
        </div>
      </v-card-text>
    </v-card>

    <!-- Loading State -->
    <template v-if="isLoading">
      <v-row>
        <v-col v-for="n in 3" :key="n" cols="12" md="4">
          <v-skeleton-loader type="card" />
        </v-col>
      </v-row>
    </template>

    <!-- Error State -->
    <v-alert v-else-if="error" type="error" variant="tonal" class="mb-6">
      Failed to load loans. Please try again later.
    </v-alert>

    <!-- Loans Grid -->
    <v-row v-else-if="filteredLoans.length > 0">
      <v-col
        v-for="loan in filteredLoans"
        :key="loan.id"
        cols="12"
        md="6"
        lg="4"
      >
        <LoanCard
          :loan="loan"
          show-actions
          @edit="handleEdit"
          @delete="handleDelete"
          @view-schedule="handleViewSchedule"
          @prepay="handlePrepay"
        />
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-card v-else variant="outlined" class="pa-8 text-center">
      <v-icon icon="mdi-bank-off" size="64" color="grey" class="mb-4" />
      <h3 class="text-h6 mb-2">No loans found</h3>
      <p class="text-body-2 text-medium-emphasis mb-4">
        {{ typeFilter ? 'No loans match your filter' : 'Add your first loan to start tracking EMIs' }}
      </p>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="emit('add-loan')">
        Add Loan
      </v-btn>
    </v-card>
  </div>
</template>
