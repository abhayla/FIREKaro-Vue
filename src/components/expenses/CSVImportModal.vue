<script setup lang="ts">
import { ref, computed } from 'vue'
import type { CreateExpenseInput } from '@/composables/useExpenses'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  import: [expenses: CreateExpenseInput[]]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// State
const step = ref(1)
const file = ref<File | null>(null)
const csvContent = ref('')
const parsedRows = ref<string[][]>([])
const headers = ref<string[]>([])
const mappedExpenses = ref<CreateExpenseInput[]>([])
const error = ref('')

// Column mapping
const columnMapping = ref({
  amount: '',
  description: '',
  category: '',
  date: '',
  merchant: '',
  paymentMethod: '',
})

// Available columns (from CSV headers)
const availableColumns = computed(() =>
  headers.value.map((h, i) => ({ title: h || `Column ${i + 1}`, value: h }))
)

// Required fields
const requiredFields = ['amount', 'description', 'date']
const optionalFields = ['category', 'merchant', 'paymentMethod']

// Handle file selection
const handleFileChange = (files: File | File[]) => {
  if (!files) return
  const selectedFile = Array.isArray(files) ? files[0] : files
  if (!selectedFile) return
  file.value = selectedFile
  error.value = ''

  const reader = new FileReader()
  reader.onload = (e) => {
    csvContent.value = e.target?.result as string
    parseCSV()
  }
  reader.onerror = () => {
    error.value = 'Failed to read file'
  }
  reader.readAsText(file.value)
}

// Parse CSV
const parseCSV = () => {
  try {
    const lines = csvContent.value.trim().split('\n')
    if (lines.length < 2) {
      error.value = 'CSV must have at least a header row and one data row'
      return
    }

    // Parse header
    headers.value = parseCSVLine(lines[0])

    // Parse data rows
    parsedRows.value = lines.slice(1).map(parseCSVLine)

    // Auto-detect column mapping
    autoMapColumns()

    step.value = 2
  } catch {
    error.value = 'Failed to parse CSV file'
  }
}

// Parse a single CSV line (handles quoted values)
const parseCSVLine = (line: string): string[] => {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

// Auto-detect column mapping based on header names
const autoMapColumns = () => {
  const lowerHeaders = headers.value.map((h) => h.toLowerCase())

  const findColumn = (keywords: string[]) => {
    for (const keyword of keywords) {
      const index = lowerHeaders.findIndex((h) => h.includes(keyword))
      if (index !== -1) return headers.value[index]
    }
    return ''
  }

  columnMapping.value = {
    amount: findColumn(['amount', 'value', 'price', 'cost', 'total']),
    description: findColumn(['description', 'desc', 'name', 'item', 'particulars']),
    category: findColumn(['category', 'type', 'group']),
    date: findColumn(['date', 'time', 'when']),
    merchant: findColumn(['merchant', 'vendor', 'store', 'shop', 'payee']),
    paymentMethod: findColumn(['payment', 'method', 'mode', 'type']),
  }
}

// Validate mapping
const mappingValid = computed(() => {
  return (
    columnMapping.value.amount !== '' &&
    columnMapping.value.description !== '' &&
    columnMapping.value.date !== ''
  )
})

// Process mapping
const processMapping = () => {
  try {
    const getColumnIndex = (col: string) => headers.value.indexOf(col)

    mappedExpenses.value = parsedRows.value
      .map((row) => {
        const amountStr = row[getColumnIndex(columnMapping.value.amount)] || ''
        const amount = parseFloat(amountStr.replace(/[^0-9.-]/g, ''))

        if (isNaN(amount) || amount <= 0) return null

        const dateStr = row[getColumnIndex(columnMapping.value.date)] || ''
        const parsedDate = parseDate(dateStr)
        if (!parsedDate) return null

        return {
          amount,
          description: row[getColumnIndex(columnMapping.value.description)] || 'Imported expense',
          category: row[getColumnIndex(columnMapping.value.category)] || 'Other',
          date: parsedDate,
          merchant: row[getColumnIndex(columnMapping.value.merchant)] || undefined,
          paymentMethod: row[getColumnIndex(columnMapping.value.paymentMethod)] || undefined,
        } as CreateExpenseInput
      })
      .filter((e): e is CreateExpenseInput => e !== null)

    step.value = 3
  } catch {
    error.value = 'Failed to process CSV data'
  }
}

// Parse various date formats
const parseDate = (dateStr: string): string | null => {
  if (!dateStr) return null

  // Try various formats
  const formats = [
    // ISO format
    /^(\d{4})-(\d{2})-(\d{2})$/,
    // DD/MM/YYYY or DD-MM-YYYY
    /^(\d{2})[/-](\d{2})[/-](\d{4})$/,
    // MM/DD/YYYY or MM-DD-YYYY
    /^(\d{2})[/-](\d{2})[/-](\d{4})$/,
  ]

  // Try ISO format first
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) return dateStr.split('T')[0]

  // Try DD/MM/YYYY
  const ddmmMatch = dateStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (ddmmMatch) {
    const [, d, m, y] = ddmmMatch
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  // Try to parse with Date
  try {
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]
    }
  } catch {
    // Ignore
  }

  return null
}

// Confirm import
const confirmImport = () => {
  emit('import', mappedExpenses.value)
  resetModal()
}

// Reset modal
const resetModal = () => {
  step.value = 1
  file.value = null
  csvContent.value = ''
  parsedRows.value = []
  headers.value = []
  mappedExpenses.value = []
  error.value = ''
  columnMapping.value = {
    amount: '',
    description: '',
    category: '',
    date: '',
    merchant: '',
    paymentMethod: '',
  }
  isOpen.value = false
}
</script>

<template>
  <v-dialog v-model="isOpen" max-width="700" persistent>
    <v-card>
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-file-upload" class="mr-2" />
        Import Expenses from CSV
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="resetModal" />
      </v-card-title>

      <v-divider />

      <!-- Stepper -->
      <v-stepper v-model="step" flat>
        <v-stepper-header>
          <v-stepper-item :value="1" title="Upload File" />
          <v-divider />
          <v-stepper-item :value="2" title="Map Columns" />
          <v-divider />
          <v-stepper-item :value="3" title="Review & Import" />
        </v-stepper-header>

        <v-stepper-window>
          <!-- Step 1: Upload -->
          <v-stepper-window-item :value="1">
            <div class="pa-4">
              <v-file-input
                accept=".csv"
                label="Select CSV File"
                prepend-icon="mdi-file-delimited"
                show-size
                @update:model-value="handleFileChange"
              />

              <v-alert v-if="error" type="error" variant="tonal" class="mt-4">
                {{ error }}
              </v-alert>

              <v-alert type="info" variant="tonal" class="mt-4">
                <div class="text-subtitle-2 mb-2">CSV Format Requirements:</div>
                <ul class="text-body-2">
                  <li>First row should contain column headers</li>
                  <li>Required columns: Amount, Description, Date</li>
                  <li>Optional columns: Category, Merchant, Payment Method</li>
                  <li>Supported date formats: YYYY-MM-DD, DD/MM/YYYY</li>
                </ul>
              </v-alert>
            </div>
          </v-stepper-window-item>

          <!-- Step 2: Column Mapping -->
          <v-stepper-window-item :value="2">
            <div class="pa-4">
              <div class="text-subtitle-2 mb-4">Map CSV columns to expense fields:</div>

              <v-row>
                <v-col
                  v-for="field in [...requiredFields, ...optionalFields]"
                  :key="field"
                  cols="12"
                  sm="6"
                >
                  <v-select
                    v-model="columnMapping[field as keyof typeof columnMapping]"
                    :items="availableColumns"
                    :label="field.charAt(0).toUpperCase() + field.slice(1)"
                    :rules="requiredFields.includes(field) ? [(v) => !!v || 'Required'] : []"
                    clearable
                  >
                    <template #prepend-inner>
                      <v-icon
                        :icon="requiredFields.includes(field) ? 'mdi-asterisk' : 'mdi-circle-outline'"
                        :color="requiredFields.includes(field) ? 'error' : 'grey'"
                        size="x-small"
                      />
                    </template>
                  </v-select>
                </v-col>
              </v-row>

              <!-- Preview -->
              <div class="mt-4">
                <div class="text-subtitle-2 mb-2">Preview (first 3 rows):</div>
                <v-table density="compact" class="text-caption">
                  <thead>
                    <tr>
                      <th v-for="header in headers" :key="header">{{ header }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, i) in parsedRows.slice(0, 3)" :key="i">
                      <td v-for="(cell, j) in row" :key="j">{{ cell }}</td>
                    </tr>
                  </tbody>
                </v-table>
              </div>
            </div>
          </v-stepper-window-item>

          <!-- Step 3: Review -->
          <v-stepper-window-item :value="3">
            <div class="pa-4">
              <v-alert type="success" variant="tonal" class="mb-4">
                <v-icon icon="mdi-check-circle" class="mr-2" />
                {{ mappedExpenses.length }} expenses ready to import
              </v-alert>

              <v-table density="compact" class="mb-4" style="max-height: 300px; overflow-y: auto">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th class="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(expense, i) in mappedExpenses.slice(0, 20)" :key="i">
                    <td>{{ expense.date }}</td>
                    <td>{{ expense.description }}</td>
                    <td>{{ expense.category }}</td>
                    <td class="text-right">₹{{ expense.amount.toLocaleString('en-IN') }}</td>
                  </tr>
                </tbody>
              </v-table>

              <v-alert v-if="mappedExpenses.length > 20" type="info" variant="tonal">
                Showing first 20 of {{ mappedExpenses.length }} expenses
              </v-alert>
            </div>
          </v-stepper-window-item>
        </v-stepper-window>
      </v-stepper>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-btn v-if="step > 1" variant="text" @click="step--">Back</v-btn>
        <v-spacer />
        <v-btn variant="text" @click="resetModal">Cancel</v-btn>
        <v-btn
          v-if="step === 2"
          color="primary"
          :disabled="!mappingValid"
          @click="processMapping"
        >
          Next
        </v-btn>
        <v-btn v-if="step === 3" color="primary" @click="confirmImport">
          Import {{ mappedExpenses.length }} Expenses
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
