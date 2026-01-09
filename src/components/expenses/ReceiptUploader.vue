<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatINR } from '@/composables/useExpenses'

interface ReceiptData {
  merchant: string | null
  date: string | null
  amount: number | null
  items: Array<{ name: string; amount: number }>
  paymentMethod: string | null
  suggestedCategory: string | null
}

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'receipt-processed': [data: ReceiptData]
}>()

// Dialog state
const dialog = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

// Upload state
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const isProcessing = ref(false)
const error = ref<string | null>(null)
const receiptData = ref<ReceiptData | null>(null)

// Trigger file input
const triggerFileInput = () => {
  fileInput.value?.click()
}

// Handle file selection
const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    selectFile(file)
  }
}

// Handle drag and drop
const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  const file = event.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) {
    selectFile(file)
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
}

// Select and preview file
const selectFile = (file: File) => {
  if (!file.type.startsWith('image/')) {
    error.value = 'Please select an image file'
    return
  }

  if (file.size > 10 * 1024 * 1024) {
    error.value = 'File size must be less than 10MB'
    return
  }

  selectedFile.value = file
  error.value = null
  receiptData.value = null

  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

// Process receipt with OCR
const processReceipt = async () => {
  if (!selectedFile.value) return

  isProcessing.value = true
  error.value = null

  try {
    const formData = new FormData()
    formData.append('receipt', selectedFile.value)

    const response = await fetch('/api/expenses/ai/process-receipt', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to process receipt')
    }

    receiptData.value = result.data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to process receipt'
    console.error('Receipt processing error:', err)
  } finally {
    isProcessing.value = false
  }
}

// Use extracted data
const useExtractedData = () => {
  if (receiptData.value) {
    emit('receipt-processed', receiptData.value)
    resetAndClose()
  }
}

// Reset state
const resetState = () => {
  selectedFile.value = null
  imagePreview.value = null
  receiptData.value = null
  error.value = null
  isProcessing.value = false
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Reset and close
const resetAndClose = () => {
  resetState()
  dialog.value = false
}

// Format payment method
const formatPaymentMethod = (method: string | null) => {
  if (!method) return '-'
  return method.replace(/_/g, ' ')
}
</script>

<template>
  <v-dialog v-model="dialog" max-width="600" persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-camera" class="mr-2" />
        Scan Receipt
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="resetAndClose" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-4">
        <!-- File Input (hidden) -->
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          capture="environment"
          class="d-none"
          @change="handleFileChange"
        />

        <!-- Upload Area -->
        <div
          v-if="!imagePreview"
          class="upload-area"
          @click="triggerFileInput"
          @drop="handleDrop"
          @dragover="handleDragOver"
        >
          <v-icon icon="mdi-camera-plus" size="64" color="grey" />
          <div class="text-h6 mt-4">Capture or Upload Receipt</div>
          <div class="text-body-2 text-medium-emphasis mt-2">
            Take a photo or drag & drop an image here
          </div>
          <v-btn color="primary" class="mt-4" @click.stop="triggerFileInput">
            <v-icon icon="mdi-upload" class="mr-1" />
            Choose File
          </v-btn>
        </div>

        <!-- Preview and Results -->
        <div v-else>
          <v-row>
            <!-- Image Preview -->
            <v-col cols="12" :sm="receiptData ? 6 : 12">
              <div class="preview-container">
                <v-img :src="imagePreview" max-height="300" contain class="rounded" />
                <v-btn
                  icon="mdi-close"
                  size="small"
                  variant="elevated"
                  color="error"
                  class="preview-remove"
                  @click="resetState"
                />
              </div>

              <!-- Process Button -->
              <v-btn
                v-if="!receiptData && !isProcessing"
                color="primary"
                block
                class="mt-4"
                @click="processReceipt"
              >
                <v-icon icon="mdi-text-recognition" class="mr-1" />
                Extract Data
              </v-btn>

              <!-- Processing State -->
              <div v-if="isProcessing" class="text-center mt-4">
                <v-progress-circular indeterminate color="primary" size="32" />
                <div class="text-body-2 text-medium-emphasis mt-2">
                  Processing receipt with AI...
                </div>
              </div>
            </v-col>

            <!-- Extracted Data -->
            <v-col v-if="receiptData" cols="12" sm="6">
              <v-card variant="outlined">
                <v-card-title class="text-subtitle-1">
                  <v-icon icon="mdi-check-circle" color="success" class="mr-2" />
                  Extracted Data
                </v-card-title>
                <v-card-text>
                  <v-list density="compact" class="pa-0">
                    <v-list-item>
                      <template #prepend>
                        <v-icon icon="mdi-store" size="small" />
                      </template>
                      <v-list-item-title>Merchant</v-list-item-title>
                      <v-list-item-subtitle>
                        {{ receiptData.merchant || 'Not detected' }}
                      </v-list-item-subtitle>
                    </v-list-item>

                    <v-list-item>
                      <template #prepend>
                        <v-icon icon="mdi-calendar" size="small" />
                      </template>
                      <v-list-item-title>Date</v-list-item-title>
                      <v-list-item-subtitle>
                        {{ receiptData.date || 'Not detected' }}
                      </v-list-item-subtitle>
                    </v-list-item>

                    <v-list-item>
                      <template #prepend>
                        <v-icon icon="mdi-currency-inr" size="small" />
                      </template>
                      <v-list-item-title>Amount</v-list-item-title>
                      <v-list-item-subtitle class="font-weight-bold text-error">
                        {{ receiptData.amount ? formatINR(receiptData.amount) : 'Not detected' }}
                      </v-list-item-subtitle>
                    </v-list-item>

                    <v-list-item>
                      <template #prepend>
                        <v-icon icon="mdi-credit-card" size="small" />
                      </template>
                      <v-list-item-title>Payment</v-list-item-title>
                      <v-list-item-subtitle>
                        {{ formatPaymentMethod(receiptData.paymentMethod) }}
                      </v-list-item-subtitle>
                    </v-list-item>

                    <v-list-item>
                      <template #prepend>
                        <v-icon icon="mdi-tag" size="small" />
                      </template>
                      <v-list-item-title>Category</v-list-item-title>
                      <v-list-item-subtitle>
                        <v-chip size="x-small" color="primary" variant="tonal">
                          {{ receiptData.suggestedCategory || 'Other' }}
                        </v-chip>
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-list>

                  <!-- Line Items -->
                  <div v-if="receiptData.items?.length" class="mt-3">
                    <div class="text-caption text-medium-emphasis">Line Items:</div>
                    <v-chip
                      v-for="(item, i) in receiptData.items.slice(0, 5)"
                      :key="i"
                      size="x-small"
                      class="mr-1 mb-1"
                      variant="tonal"
                    >
                      {{ item.name }}: {{ formatINR(item.amount) }}
                    </v-chip>
                    <v-chip
                      v-if="receiptData.items.length > 5"
                      size="x-small"
                      variant="tonal"
                    >
                      +{{ receiptData.items.length - 5 }} more
                    </v-chip>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <!-- Error Message -->
        <v-alert v-if="error" type="error" variant="tonal" class="mt-4">
          {{ error }}
        </v-alert>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-btn variant="text" @click="resetAndClose">Cancel</v-btn>
        <v-spacer />
        <v-btn
          v-if="receiptData"
          color="primary"
          @click="useExtractedData"
        >
          <v-icon icon="mdi-check" class="mr-1" />
          Use This Data
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.upload-area {
  border: 2px dashed rgba(var(--v-theme-primary), 0.3);
  border-radius: 12px;
  padding: 48px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.upload-area:hover {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.04);
}

.preview-container {
  position: relative;
}

.preview-remove {
  position: absolute;
  top: 8px;
  right: 8px;
}
</style>
