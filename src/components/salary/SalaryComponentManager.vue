<script setup lang="ts">
import { ref, computed } from 'vue'
import type { SalaryComponentDefinition, SalaryComponentType, TaxSection } from '@/types/salary'
import {
  useSalaryComponents,
  useCreateSalaryComponent,
  useUpdateSalaryComponent,
  useDeleteSalaryComponent,
} from '@/composables/useSalary'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// Get component definitions
const { components, earnings, deductions, employerContributions, isLoading } = useSalaryComponents()

// Mutations
const createMutation = useCreateSalaryComponent()
const updateMutation = useUpdateSalaryComponent()
const deleteMutation = useDeleteSalaryComponent()

// Dialog state
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const showDeleteConfirm = ref(false)
const selectedComponent = ref<SalaryComponentDefinition | null>(null)

// Form data
const formData = ref({
  code: '',
  name: '',
  componentType: 'EARNING' as SalaryComponentType,
  category: '',
  isTaxable: true,
  taxSection: null as TaxSection,
  isExemptUpTo: null as number | null,
  displayOrder: 100,
})

// Component type options
const componentTypeOptions = [
  { title: 'Earning', value: 'EARNING' },
  { title: 'Deduction', value: 'DEDUCTION' },
  { title: 'Employer Contribution', value: 'EMPLOYER_CONTRIBUTION' },
]

// Category options by type
const categoryOptions = computed(() => {
  switch (formData.value.componentType) {
    case 'EARNING':
      return ['Fixed', 'Variable', 'Allowance', 'Bonus', 'Other']
    case 'DEDUCTION':
      return ['Statutory', 'Voluntary', 'Tax', 'Other']
    case 'EMPLOYER_CONTRIBUTION':
      return ['Statutory', 'Voluntary', 'Other']
    default:
      return ['Other']
  }
})

// Tax section options (matching TaxSection type)
const taxSectionOptions: Array<{ title: string; value: TaxSection }> = [
  { title: 'None', value: null },
  { title: '80C (Investments)', value: '80C' },
  { title: '80CCD(1) (NPS)', value: '80CCD(1)' },
  { title: '80CCD(1B) (NPS Additional)', value: '80CCD(1B)' },
  { title: '80CCD(2) (Employer NPS)', value: '80CCD(2)' },
  { title: '80D (Health)', value: '80D' },
  { title: '10(13A) (HRA)', value: '10(13A)' },
  { title: '10(5) (LTA)', value: '10(5)' },
  { title: '10(14) (Other Allowances)', value: '10(14)' },
  { title: '16(iii) (Professional Tax)', value: '16(iii)' },
]

// Open create dialog
const openCreateDialog = () => {
  formData.value = {
    code: '',
    name: '',
    componentType: 'EARNING',
    category: '',
    isTaxable: true,
    taxSection: null,
    isExemptUpTo: null,
    displayOrder: 100,
  }
  showCreateDialog.value = true
}

// Open edit dialog
const openEditDialog = (component: SalaryComponentDefinition) => {
  if (component.isSystem) return // Can't edit system components
  selectedComponent.value = component
  formData.value = {
    code: component.code,
    name: component.name,
    componentType: component.componentType,
    category: component.category || '',
    isTaxable: component.isTaxable,
    taxSection: component.taxSection,
    isExemptUpTo: component.isExemptUpTo,
    displayOrder: component.displayOrder,
  }
  showEditDialog.value = true
}

// Confirm delete
const confirmDelete = (component: SalaryComponentDefinition) => {
  if (component.isSystem) return // Can't delete system components
  selectedComponent.value = component
  showDeleteConfirm.value = true
}

// Create component
const handleCreate = async () => {
  try {
    await createMutation.mutateAsync({
      code: formData.value.code.toUpperCase(),
      name: formData.value.name,
      componentType: formData.value.componentType,
      category: formData.value.category || null,
      isTaxable: formData.value.isTaxable,
      taxSection: formData.value.taxSection || null,
      isExemptUpTo: formData.value.isExemptUpTo,
      syncTarget: 'NONE',
      syncDirection: 'FROM_SALARY',
      isExpandable: false,
      parentCode: null,
      displayOrder: formData.value.displayOrder,
      isActive: true,
      isSystem: false,
      userId: null, // Will be set by server
    })
    showCreateDialog.value = false
  } catch (error) {
    console.error('Failed to create component:', error)
  }
}

// Update component
const handleUpdate = async () => {
  if (!selectedComponent.value) return
  try {
    await updateMutation.mutateAsync({
      id: selectedComponent.value.id,
      data: {
        code: formData.value.code.toUpperCase(),
        name: formData.value.name,
        componentType: formData.value.componentType,
        category: formData.value.category || null,
        isTaxable: formData.value.isTaxable,
        taxSection: formData.value.taxSection || null,
        isExemptUpTo: formData.value.isExemptUpTo,
        displayOrder: formData.value.displayOrder,
      },
    })
    showEditDialog.value = false
    selectedComponent.value = null
  } catch (error) {
    console.error('Failed to update component:', error)
  }
}

// Delete component
const handleDelete = async () => {
  if (!selectedComponent.value) return
  try {
    await deleteMutation.mutateAsync(selectedComponent.value.id)
    showDeleteConfirm.value = false
    selectedComponent.value = null
  } catch (error) {
    console.error('Failed to delete component:', error)
  }
}

// Get component type color
const getTypeColor = (type: SalaryComponentType) => {
  switch (type) {
    case 'EARNING':
      return 'success'
    case 'DEDUCTION':
      return 'error'
    case 'EMPLOYER_CONTRIBUTION':
      return 'info'
    default:
      return 'grey'
  }
}

// Get component type icon
const getTypeIcon = (type: SalaryComponentType) => {
  switch (type) {
    case 'EARNING':
      return 'mdi-plus-circle'
    case 'DEDUCTION':
      return 'mdi-minus-circle'
    case 'EMPLOYER_CONTRIBUTION':
      return 'mdi-office-building'
    default:
      return 'mdi-circle'
  }
}
</script>

<template>
  <v-dialog v-model="isOpen" max-width="800" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between bg-primary text-white pa-4">
        <div class="d-flex align-center">
          <v-icon icon="mdi-cog" class="mr-2" />
          Manage Salary Components
        </div>
        <v-btn icon="mdi-close" variant="text" color="white" @click="isOpen = false" />
      </v-card-title>

      <v-card-text class="pa-0">
        <v-progress-linear v-if="isLoading" indeterminate color="primary" />

        <!-- Add Custom Component Button -->
        <div class="pa-4 bg-grey-lighten-4">
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">
            Add Custom Component
          </v-btn>
          <span class="text-caption text-medium-emphasis ml-3">
            Create your own salary components (e.g., Company Stock, Meal Allowance)
          </span>
        </div>

        <v-divider />

        <!-- Component Tabs -->
        <v-tabs bg-color="grey-lighten-4">
          <v-tab value="earnings">
            <v-icon icon="mdi-plus-circle" color="success" class="mr-2" size="small" />
            Earnings ({{ earnings.length }})
          </v-tab>
          <v-tab value="deductions">
            <v-icon icon="mdi-minus-circle" color="error" class="mr-2" size="small" />
            Deductions ({{ deductions.length }})
          </v-tab>
          <v-tab value="employer">
            <v-icon icon="mdi-office-building" color="info" class="mr-2" size="small" />
            Employer ({{ employerContributions.length }})
          </v-tab>
        </v-tabs>

        <v-window>
          <!-- Earnings Tab -->
          <v-window-item value="earnings">
            <v-list density="compact">
              <v-list-item
                v-for="comp in earnings"
                :key="comp.id"
                :class="{ 'bg-grey-lighten-4': comp.isSystem }"
              >
                <template #prepend>
                  <v-icon :icon="getTypeIcon(comp.componentType)" :color="getTypeColor(comp.componentType)" size="small" />
                </template>

                <v-list-item-title class="d-flex align-center">
                  <span class="font-weight-medium">{{ comp.name }}</span>
                  <v-chip v-if="comp.isSystem" size="x-small" variant="tonal" class="ml-2">System</v-chip>
                  <v-chip v-else size="x-small" color="primary" variant="tonal" class="ml-2">Custom</v-chip>
                  <v-chip v-if="comp.taxSection" size="x-small" variant="outlined" class="ml-2">{{ comp.taxSection }}</v-chip>
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  Code: {{ comp.code }} | {{ comp.category || 'Uncategorized' }} | {{ comp.isTaxable ? 'Taxable' : 'Tax-Free' }}
                </v-list-item-subtitle>

                <template #append>
                  <div v-if="!comp.isSystem" class="d-flex ga-1">
                    <v-btn icon="mdi-pencil" size="x-small" variant="text" @click="openEditDialog(comp)" />
                    <v-btn icon="mdi-delete" size="x-small" variant="text" color="error" @click="confirmDelete(comp)" />
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-window-item>

          <!-- Deductions Tab -->
          <v-window-item value="deductions">
            <v-list density="compact">
              <v-list-item
                v-for="comp in deductions"
                :key="comp.id"
                :class="{ 'bg-grey-lighten-4': comp.isSystem }"
              >
                <template #prepend>
                  <v-icon :icon="getTypeIcon(comp.componentType)" :color="getTypeColor(comp.componentType)" size="small" />
                </template>

                <v-list-item-title class="d-flex align-center">
                  <span class="font-weight-medium">{{ comp.name }}</span>
                  <v-chip v-if="comp.isSystem" size="x-small" variant="tonal" class="ml-2">System</v-chip>
                  <v-chip v-else size="x-small" color="primary" variant="tonal" class="ml-2">Custom</v-chip>
                  <v-chip v-if="comp.taxSection" size="x-small" variant="outlined" class="ml-2">{{ comp.taxSection }}</v-chip>
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  Code: {{ comp.code }} | {{ comp.category || 'Uncategorized' }}
                </v-list-item-subtitle>

                <template #append>
                  <div v-if="!comp.isSystem" class="d-flex ga-1">
                    <v-btn icon="mdi-pencil" size="x-small" variant="text" @click="openEditDialog(comp)" />
                    <v-btn icon="mdi-delete" size="x-small" variant="text" color="error" @click="confirmDelete(comp)" />
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-window-item>

          <!-- Employer Contributions Tab -->
          <v-window-item value="employer">
            <v-list density="compact">
              <v-list-item
                v-for="empComp in employerContributions"
                :key="empComp.id"
                :class="{ 'bg-grey-lighten-4': empComp.isSystem }"
              >
                <template #prepend>
                  <v-icon :icon="getTypeIcon(empComp.componentType)" :color="getTypeColor(empComp.componentType)" size="small" />
                </template>

                <v-list-item-title class="d-flex align-center">
                  <span class="font-weight-medium">{{ empComp.name }}</span>
                  <v-chip v-if="empComp.isSystem" size="x-small" variant="tonal" class="ml-2">System</v-chip>
                  <v-chip v-else size="x-small" color="primary" variant="tonal" class="ml-2">Custom</v-chip>
                  <v-chip v-if="empComp.taxSection" size="x-small" variant="outlined" class="ml-2">{{ empComp.taxSection }}</v-chip>
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  Code: {{ empComp.code }} | {{ empComp.category || 'Uncategorized' }}
                </v-list-item-subtitle>

                <template #append>
                  <div v-if="!empComp.isSystem" class="d-flex ga-1">
                    <v-btn icon="mdi-pencil" size="x-small" variant="text" @click="openEditDialog(empComp)" />
                    <v-btn icon="mdi-delete" size="x-small" variant="text" color="error" @click="confirmDelete(empComp)" />
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-chip size="small" variant="tonal">
          {{ components.length }} components total
        </v-chip>
        <v-spacer />
        <v-btn variant="text" @click="isOpen = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Create Dialog -->
  <v-dialog v-model="showCreateDialog" max-width="500" persistent>
    <v-card>
      <v-card-title class="bg-primary text-white">
        <v-icon icon="mdi-plus" class="mr-2" />
        Add Custom Component
      </v-card-title>
      <v-card-text class="pt-4">
        <v-text-field
          v-model="formData.code"
          label="Component Code *"
          placeholder="e.g., MEAL_ALLOW"
          hint="Unique identifier (uppercase, no spaces)"
          persistent-hint
          density="comfortable"
          variant="outlined"
          class="mb-3"
        />
        <v-text-field
          v-model="formData.name"
          label="Display Name *"
          placeholder="e.g., Meal Allowance"
          density="comfortable"
          variant="outlined"
          class="mb-3"
        />
        <v-select
          v-model="formData.componentType"
          :items="componentTypeOptions"
          label="Component Type *"
          density="comfortable"
          variant="outlined"
          class="mb-3"
        />
        <v-select
          v-model="formData.category"
          :items="categoryOptions"
          label="Category"
          density="comfortable"
          variant="outlined"
          clearable
          class="mb-3"
        />
        <v-switch
          v-model="formData.isTaxable"
          label="Taxable"
          color="primary"
          density="comfortable"
          hide-details
          class="mb-3"
        />
        <v-select
          v-model="formData.taxSection"
          :items="taxSectionOptions"
          label="Tax Section"
          density="comfortable"
          variant="outlined"
          clearable
          class="mb-3"
        />
        <v-text-field
          v-model.number="formData.isExemptUpTo"
          label="Exempt Up To (INR)"
          type="number"
          prefix="₹"
          hint="Maximum exemption limit (if applicable)"
          persistent-hint
          density="comfortable"
          variant="outlined"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="showCreateDialog = false">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="createMutation.isPending.value"
          :disabled="!formData.code || !formData.name"
          @click="handleCreate"
        >
          Create
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Edit Dialog -->
  <v-dialog v-model="showEditDialog" max-width="500" persistent>
    <v-card>
      <v-card-title class="bg-primary text-white">
        <v-icon icon="mdi-pencil" class="mr-2" />
        Edit Component
      </v-card-title>
      <v-card-text class="pt-4">
        <v-text-field
          v-model="formData.code"
          label="Component Code *"
          density="comfortable"
          variant="outlined"
          class="mb-3"
        />
        <v-text-field
          v-model="formData.name"
          label="Display Name *"
          density="comfortable"
          variant="outlined"
          class="mb-3"
        />
        <v-select
          v-model="formData.componentType"
          :items="componentTypeOptions"
          label="Component Type *"
          density="comfortable"
          variant="outlined"
          class="mb-3"
        />
        <v-select
          v-model="formData.category"
          :items="categoryOptions"
          label="Category"
          density="comfortable"
          variant="outlined"
          clearable
          class="mb-3"
        />
        <v-switch
          v-model="formData.isTaxable"
          label="Taxable"
          color="primary"
          density="comfortable"
          hide-details
          class="mb-3"
        />
        <v-select
          v-model="formData.taxSection"
          :items="taxSectionOptions"
          label="Tax Section"
          density="comfortable"
          variant="outlined"
          clearable
          class="mb-3"
        />
        <v-text-field
          v-model.number="formData.isExemptUpTo"
          label="Exempt Up To (INR)"
          type="number"
          prefix="₹"
          density="comfortable"
          variant="outlined"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="showEditDialog = false">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="updateMutation.isPending.value"
          :disabled="!formData.code || !formData.name"
          @click="handleUpdate"
        >
          Save Changes
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Delete Confirmation -->
  <v-dialog v-model="showDeleteConfirm" max-width="400">
    <v-card>
      <v-card-title class="bg-error text-white">
        <v-icon icon="mdi-delete" class="mr-2" />
        Delete Component?
      </v-card-title>
      <v-card-text class="pt-4">
        <p>
          Are you sure you want to delete <strong>{{ selectedComponent?.name }}</strong>?
        </p>
        <v-alert v-if="selectedComponent" type="warning" variant="tonal" density="compact" class="mt-3">
          If this component has salary entries, it will be deactivated instead of deleted.
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="showDeleteConfirm = false">Cancel</v-btn>
        <v-btn
          color="error"
          variant="flat"
          :loading="deleteMutation.isPending.value"
          @click="handleDelete"
        >
          Delete
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
