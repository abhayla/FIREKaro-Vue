<script setup lang="ts">
import { formatINR, formatDate, type Expense } from '@/composables/useExpenses'

const props = defineProps<{
  expense: Expense
}>()

const emit = defineEmits<{
  edit: [expense: Expense]
  delete: [id: string]
}>()

const categoryIcons: Record<string, string> = {
  'Food & Dining': 'mdi-food',
  Transportation: 'mdi-car',
  Shopping: 'mdi-shopping',
  Entertainment: 'mdi-movie',
  Bills: 'mdi-file-document',
  Utilities: 'mdi-lightning-bolt',
  Healthcare: 'mdi-hospital',
  Education: 'mdi-school',
  Travel: 'mdi-airplane',
  Personal: 'mdi-account',
  Groceries: 'mdi-cart',
  Rent: 'mdi-home',
  Insurance: 'mdi-shield-check',
  Investments: 'mdi-trending-up',
  Other: 'mdi-dots-horizontal',
}

const getCategoryIcon = (category: string) => {
  return categoryIcons[category] || 'mdi-cash'
}

const paymentMethodIcons: Record<string, string> = {
  UPI: 'mdi-cellphone',
  'Credit Card': 'mdi-credit-card',
  'Debit Card': 'mdi-credit-card-outline',
  Cash: 'mdi-cash',
  'Net Banking': 'mdi-bank',
  Wallet: 'mdi-wallet',
}
</script>

<template>
  <v-card variant="outlined" class="expense-card mb-2">
    <div class="d-flex align-center pa-3">
      <!-- Category Icon -->
      <v-avatar color="primary" variant="tonal" size="40" class="mr-3">
        <v-icon :icon="getCategoryIcon(expense.category)" size="20" />
      </v-avatar>

      <!-- Main Content -->
      <div class="flex-grow-1">
        <div class="d-flex align-center">
          <span class="font-weight-medium">{{ expense.description }}</span>
          <v-chip
            v-if="expense.isRecurring"
            size="x-small"
            color="info"
            variant="tonal"
            class="ml-2"
          >
            <v-icon icon="mdi-refresh" size="10" class="mr-1" />
            Recurring
          </v-chip>
        </div>
        <div class="text-body-2 text-medium-emphasis">
          {{ expense.category }}
          <span v-if="expense.subcategory"> &gt; {{ expense.subcategory }}</span>
          <span v-if="expense.merchant"> &bull; {{ expense.merchant }}</span>
        </div>
        <div class="text-caption text-medium-emphasis">
          {{ formatDate(expense.date) }}
          <span v-if="expense.paymentMethod">
            &bull;
            <v-icon
              :icon="paymentMethodIcons[expense.paymentMethod] || 'mdi-cash'"
              size="12"
            />
            {{ expense.paymentMethod }}
          </span>
        </div>
        <!-- Tags -->
        <div v-if="expense.tags?.length" class="mt-1">
          <v-chip
            v-for="tag in expense.tags"
            :key="tag"
            size="x-small"
            variant="outlined"
            class="mr-1"
          >
            {{ tag }}
          </v-chip>
        </div>
      </div>

      <!-- Amount -->
      <div class="text-right">
        <div class="text-h6 font-weight-bold text-negative text-currency">
          -{{ formatINR(expense.amount) }}
        </div>
      </div>

      <!-- Actions Menu -->
      <v-menu>
        <template #activator="{ props: menuProps }">
          <v-btn
            icon="mdi-dots-vertical"
            variant="text"
            size="small"
            v-bind="menuProps"
            class="ml-2"
          />
        </template>
        <v-list density="compact">
          <v-list-item @click="emit('edit', expense)">
            <template #prepend>
              <v-icon icon="mdi-pencil" size="small" />
            </template>
            <v-list-item-title>Edit</v-list-item-title>
          </v-list-item>
          <v-list-item @click="emit('delete', expense.id)" class="text-error">
            <template #prepend>
              <v-icon icon="mdi-delete" size="small" />
            </template>
            <v-list-item-title>Delete</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
  </v-card>
</template>

<style scoped>
.expense-card:hover {
  border-color: rgb(var(--v-theme-primary));
}
</style>
