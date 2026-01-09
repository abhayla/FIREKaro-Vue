<script setup lang="ts">
import { ref, computed } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import PropertyCard from '@/components/investments/PropertyCard.vue'
import {
  useProperties,
  useCreateInvestment,
  useUpdateInvestment,
  useDeleteInvestment,
  formatINR,
  formatINRCompact,
  formatPercentage,
  type Property,
  type Investment
} from '@/composables/useInvestments'

const tabs = [
  { title: 'Portfolio', route: '/dashboard/investments' },
  { title: 'Stocks', route: '/dashboard/investments/stocks' },
  { title: 'Mutual Funds', route: '/dashboard/investments/mutual-funds' },
  { title: 'EPF & PPF', route: '/dashboard/investments/epf-ppf' },
  { title: 'NPS', route: '/dashboard/investments/nps' },
  { title: 'Property', route: '/dashboard/investments/property' },
  { title: 'Reports', route: '/dashboard/investments/reports' },
]

// Data fetching
const { data: properties, isLoading, error } = useProperties()
const createInvestment = useCreateInvestment()
const updateInvestment = useUpdateInvestment()
const deleteInvestment = useDeleteInvestment()

// UI state
const showAddDialog = ref(false)
const editingProperty = ref<Property | null>(null)
const showDeleteConfirm = ref(false)
const deletingId = ref<string | null>(null)

// Mock property data for demo
const mockProperties: Property[] = [
  {
    id: '1',
    name: '2BHK Flat - Baner',
    type: 'residential',
    address: 'Baner Road, Pune 411045',
    purchaseDate: '2019-06-15',
    purchasePrice: 6500000,
    currentValue: 8500000,
    registrationCost: 450000,
    stampDuty: 325000,
    loanOutstanding: 2500000,
    rentalIncome: 25000,
    appreciation: 2000000,
    appreciationPercentage: 30.77
  },
  {
    id: '2',
    name: 'Commercial Shop - Wakad',
    type: 'commercial',
    address: 'Datta Mandir Road, Wakad, Pune',
    purchaseDate: '2021-03-20',
    purchasePrice: 4500000,
    currentValue: 5200000,
    registrationCost: 250000,
    stampDuty: 225000,
    rentalIncome: 35000,
    appreciation: 700000,
    appreciationPercentage: 15.56
  },
  {
    id: '3',
    name: 'Agricultural Land - Nashik',
    type: 'land',
    address: 'Nashik District, Maharashtra',
    purchaseDate: '2017-11-10',
    purchasePrice: 1200000,
    currentValue: 2100000,
    registrationCost: 60000,
    stampDuty: 48000,
    appreciation: 900000,
    appreciationPercentage: 75.00
  }
]

// Use mock data if API returns empty/error
const propertiesList = computed(() => {
  if (properties.value && properties.value.length > 0) {
    return properties.value
  }
  return mockProperties
})

// Summary calculations
const summary = computed(() => {
  const list = propertiesList.value
  return {
    totalValue: list.reduce((acc, p) => acc + p.currentValue, 0),
    totalCost: list.reduce((acc, p) => acc + p.purchasePrice + p.registrationCost + p.stampDuty, 0),
    totalLoanOutstanding: list.reduce((acc, p) => acc + (p.loanOutstanding ?? 0), 0),
    totalRentalIncome: list.reduce((acc, p) => acc + (p.rentalIncome ?? 0), 0),
    totalAppreciation: list.reduce((acc, p) => acc + p.appreciation, 0),
    propertyCount: list.length
  }
})

const netEquity = computed(() => summary.value.totalValue - summary.value.totalLoanOutstanding)
const avgAppreciation = computed(() =>
  summary.value.totalCost > 0
    ? (summary.value.totalAppreciation / summary.value.totalCost) * 100
    : 0
)
const rentalYield = computed(() =>
  summary.value.totalValue > 0
    ? (summary.value.totalRentalIncome * 12 / summary.value.totalValue) * 100
    : 0
)

// Property type mapping
type PropertyType = 'residential' | 'commercial' | 'land' | 'other'

// Actions
const handleEdit = (property: Property) => {
  editingProperty.value = property
  // Populate the form with property data
  const propertyType = (['residential', 'commercial', 'land', 'other'].includes(property.type)
    ? property.type
    : 'residential') as PropertyType

  newProperty.value = {
    name: property.name,
    type: propertyType,
    address: property.address ?? '',
    purchaseDate: property.purchaseDate ?? '',
    purchasePrice: property.purchasePrice,
    currentValue: property.currentValue,
    registrationCost: property.registrationCost ?? 0,
    stampDuty: property.stampDuty ?? 0,
    loanOutstanding: property.loanOutstanding ?? 0,
    rentalIncome: property.rentalIncome ?? 0
  }
  showAddDialog.value = true
}

const handleDelete = (id: string) => {
  deletingId.value = id
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  if (deletingId.value) {
    await deleteInvestment.mutateAsync(deletingId.value)
  }
  showDeleteConfirm.value = false
  deletingId.value = null
}

// Add property form
const newProperty = ref<{
  name: string
  type: PropertyType
  address: string
  purchaseDate: string
  purchasePrice: number
  currentValue: number
  registrationCost: number
  stampDuty: number
  loanOutstanding: number
  rentalIncome: number
}>({
  name: '',
  type: 'residential',
  address: '',
  purchaseDate: '',
  purchasePrice: 0,
  currentValue: 0,
  registrationCost: 0,
  stampDuty: 0,
  loanOutstanding: 0,
  rentalIncome: 0
})

const resetPropertyForm = () => {
  newProperty.value = {
    name: '',
    type: 'residential' as const,
    address: '',
    purchaseDate: '',
    purchasePrice: 0,
    currentValue: 0,
    registrationCost: 0,
    stampDuty: 0,
    loanOutstanding: 0,
    rentalIncome: 0
  }
}

const handleAddProperty = async () => {
  const totalCost = newProperty.value.purchasePrice +
                    newProperty.value.registrationCost +
                    newProperty.value.stampDuty

  const propertyData = {
    name: newProperty.value.name,
    type: 'real_estate' as const,
    category: 'real_estate' as const,
    investedAmount: totalCost,
    currentValue: newProperty.value.currentValue,
    purchaseDate: newProperty.value.purchaseDate,
    purchasePrice: newProperty.value.purchasePrice,
    notes: JSON.stringify({
      subtype: newProperty.value.type,
      address: newProperty.value.address,
      registrationCost: newProperty.value.registrationCost,
      stampDuty: newProperty.value.stampDuty,
      loanOutstanding: newProperty.value.loanOutstanding,
      rentalIncome: newProperty.value.rentalIncome
    })
  }

  try {
    if (editingProperty.value) {
      await updateInvestment.mutateAsync({
        id: editingProperty.value.id,
        data: propertyData
      })
    } else {
      await createInvestment.mutateAsync(propertyData)
    }

    // Reset form and close dialog
    resetPropertyForm()
    editingProperty.value = null
    showAddDialog.value = false
  } catch (err) {
    console.error('Failed to save property:', err)
  }
}
</script>

<template>
  <div>
    <SectionHeader
      title="Investments"
      subtitle="Property Investments"
      icon="mdi-chart-line"
      :tabs="tabs"
    />

    <!-- Summary Cards -->
    <v-row class="mb-6">
      <v-col cols="12" md="3">
        <v-card class="pa-4">
          <div class="d-flex align-center mb-2">
            <v-icon icon="mdi-home-city" color="purple" class="mr-2" />
            <span class="text-body-2 text-medium-emphasis">Total Value</span>
          </div>
          <div class="text-h5 font-weight-bold">{{ formatINRCompact(summary.totalValue) }}</div>
          <div class="text-caption text-medium-emphasis">
            {{ summary.propertyCount }} properties
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="pa-4">
          <div class="d-flex align-center mb-2">
            <v-icon icon="mdi-cash" color="primary" class="mr-2" />
            <span class="text-body-2 text-medium-emphasis">Net Equity</span>
          </div>
          <div class="text-h5 font-weight-bold">{{ formatINRCompact(netEquity) }}</div>
          <div class="text-caption text-medium-emphasis">
            After loans: {{ formatINRCompact(summary.totalLoanOutstanding) }}
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="pa-4">
          <div class="d-flex align-center mb-2">
            <v-icon icon="mdi-trending-up" color="success" class="mr-2" />
            <span class="text-body-2 text-medium-emphasis">Total Appreciation</span>
          </div>
          <div class="text-h5 font-weight-bold text-success">
            {{ formatINRCompact(summary.totalAppreciation) }}
          </div>
          <div class="text-caption text-success">
            {{ formatPercentage(avgAppreciation) }} overall
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="pa-4">
          <div class="d-flex align-center mb-2">
            <v-icon icon="mdi-currency-inr" color="warning" class="mr-2" />
            <span class="text-body-2 text-medium-emphasis">Monthly Rent</span>
          </div>
          <div class="text-h5 font-weight-bold">{{ formatINR(summary.totalRentalIncome) }}</div>
          <div class="text-caption text-medium-emphasis">
            Yield: {{ rentalYield.toFixed(1) }}% p.a.
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Toolbar -->
    <v-card variant="outlined" class="mb-6">
      <v-card-text class="d-flex gap-3 flex-wrap align-center">
        <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="showAddDialog = true">
          Add Property
        </v-btn>
        <v-spacer />
        <v-chip variant="tonal">
          <v-icon icon="mdi-home" class="mr-1" />
          {{ propertiesList.filter(p => p.type === 'residential').length }} Residential
        </v-chip>
        <v-chip variant="tonal" color="success">
          <v-icon icon="mdi-office-building" class="mr-1" />
          {{ propertiesList.filter(p => p.type === 'commercial').length }} Commercial
        </v-chip>
        <v-chip variant="tonal" color="warning">
          <v-icon icon="mdi-terrain" class="mr-1" />
          {{ propertiesList.filter(p => p.type === 'land').length }} Land
        </v-chip>
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
    <v-alert v-else-if="error" type="info" variant="tonal" class="mb-6">
      Showing demo data. Add your properties to track real estate investments.
    </v-alert>

    <!-- Property Cards Grid -->
    <v-row v-if="propertiesList.length > 0">
      <v-col
        v-for="property in propertiesList"
        :key="property.id"
        cols="12"
        md="6"
        lg="4"
      >
        <PropertyCard
          :property="property"
          show-actions
          @edit="handleEdit"
          @delete="handleDelete"
        />
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-card v-else variant="outlined" class="pa-8 text-center">
      <v-icon icon="mdi-home-city" size="64" color="grey" class="mb-4" />
      <h3 class="text-h6 mb-2">No properties found</h3>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Add your real estate holdings to track property values and rental income.
      </p>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="showAddDialog = true">
        Add Property
      </v-btn>
    </v-card>

    <!-- Property Tax Info -->
    <v-card variant="outlined" class="mt-6">
      <v-card-title class="text-subtitle-1">
        <v-icon icon="mdi-information" class="mr-2" />
        Property Tax Benefits
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-alert color="primary" variant="tonal" density="compact">
              <div class="text-subtitle-2 font-weight-bold">Section 24(b)</div>
              <div class="text-body-2 mt-1">
                Home loan interest up to ₹2L for self-occupied property
              </div>
            </v-alert>
          </v-col>
          <v-col cols="12" md="4">
            <v-alert color="success" variant="tonal" density="compact">
              <div class="text-subtitle-2 font-weight-bold">Section 80C</div>
              <div class="text-body-2 mt-1">
                Home loan principal up to ₹1.5L (within overall limit)
              </div>
            </v-alert>
          </v-col>
          <v-col cols="12" md="4">
            <v-alert color="warning" variant="tonal" density="compact">
              <div class="text-subtitle-2 font-weight-bold">Capital Gains</div>
              <div class="text-body-2 mt-1">
                LTCG after 2 years: 20% with indexation. Exemption under 54/54F
              </div>
            </v-alert>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Add Property Dialog -->
    <v-dialog v-model="showAddDialog" max-width="600" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-home-plus" class="mr-2" />
          {{ editingProperty ? 'Edit Property' : 'Add Property' }}
        </v-card-title>

        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="newProperty.name"
                label="Property Name"
                placeholder="e.g., 2BHK Flat - Baner"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="newProperty.type"
                :items="[
                  { title: 'Residential', value: 'residential' },
                  { title: 'Commercial', value: 'commercial' },
                  { title: 'Land', value: 'land' },
                  { title: 'Other', value: 'other' }
                ]"
                label="Type"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="newProperty.purchaseDate"
                label="Purchase Date"
                type="date"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="newProperty.address"
                label="Address"
                rows="2"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="newProperty.purchasePrice"
                label="Purchase Price"
                type="number"
                prefix="₹"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="newProperty.currentValue"
                label="Current Value"
                type="number"
                prefix="₹"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="newProperty.registrationCost"
                label="Registration Cost"
                type="number"
                prefix="₹"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="newProperty.stampDuty"
                label="Stamp Duty"
                type="number"
                prefix="₹"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="newProperty.loanOutstanding"
                label="Loan Outstanding"
                type="number"
                prefix="₹"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="newProperty.rentalIncome"
                label="Monthly Rental Income"
                type="number"
                prefix="₹"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="showAddDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="handleAddProperty">
            {{ editingProperty ? 'Update' : 'Add' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteConfirm" max-width="400">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-alert" color="error" class="mr-2" />
          Delete Property
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete this property? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDeleteConfirm = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" @click="confirmDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
