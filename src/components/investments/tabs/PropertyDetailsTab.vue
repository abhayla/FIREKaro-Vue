<script setup lang="ts">
import { ref, computed } from "vue";
import {
  useProperties,
  useDeleteInvestment,
  formatINR,
  formatINRCompact,
  formatPercentage,
  type Property,
} from "@/composables/useInvestments";

const props = defineProps<{
  financialYear: string;
}>();

const emit = defineEmits<{
  (e: "add-property"): void;
  (e: "edit-property", property: Property): void;
}>();

// Data fetching
const { data: properties, isLoading } = useProperties();
const deleteInvestment = useDeleteInvestment();

// UI state
const searchQuery = ref("");
const typeFilter = ref<string | null>(null);
const sortBy = ref<{ key: string; order: "asc" | "desc" }[]>([{ key: "currentValue", order: "desc" }]);
const showDeleteConfirm = ref(false);
const deletingProperty = ref<Property | null>(null);

// Mock property data for demo
const mockProperties: Property[] = [
  {
    id: "1",
    name: "2BHK Flat - Baner",
    type: "residential",
    address: "Baner Road, Pune 411045",
    purchaseDate: "2019-06-15",
    purchasePrice: 6500000,
    currentValue: 8500000,
    registrationCost: 450000,
    stampDuty: 325000,
    loanOutstanding: 2500000,
    rentalIncome: 25000,
    appreciation: 2000000,
    appreciationPercentage: 30.77,
  },
  {
    id: "2",
    name: "Commercial Shop - Wakad",
    type: "commercial",
    address: "Datta Mandir Road, Wakad, Pune",
    purchaseDate: "2021-03-20",
    purchasePrice: 4500000,
    currentValue: 5200000,
    registrationCost: 250000,
    stampDuty: 225000,
    rentalIncome: 35000,
    appreciation: 700000,
    appreciationPercentage: 15.56,
  },
  {
    id: "3",
    name: "Agricultural Land - Nashik",
    type: "land",
    address: "Nashik District, Maharashtra",
    purchaseDate: "2017-11-10",
    purchasePrice: 1200000,
    currentValue: 2100000,
    registrationCost: 60000,
    stampDuty: 48000,
    appreciation: 900000,
    appreciationPercentage: 75.0,
  },
];

// Use mock data if API returns empty/error
const propertiesList = computed(() => {
  if (properties.value && properties.value.length > 0) {
    return properties.value;
  }
  return mockProperties;
});

// Property types for filter
const propertyTypes = ["residential", "commercial", "land", "other"];

// Filtered properties
const filteredProperties = computed(() => {
  let result = propertiesList.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.address?.toLowerCase().includes(query) ?? false)
    );
  }

  if (typeFilter.value) {
    result = result.filter((p) => p.type === typeFilter.value);
  }

  return result;
});

// Table headers
const headers = [
  { title: "Property", key: "name", sortable: true, minWidth: "200px" },
  { title: "Type", key: "type", sortable: true },
  { title: "Purchase Price", key: "purchasePrice", align: "end" as const, sortable: true },
  { title: "Current Value", key: "currentValue", align: "end" as const, sortable: true },
  { title: "Appreciation", key: "appreciation", align: "end" as const, sortable: true },
  { title: "Loan", key: "loanOutstanding", align: "end" as const, sortable: true },
  { title: "Rent/Month", key: "rentalIncome", align: "end" as const, sortable: true },
  { title: "Purchase Date", key: "purchaseDate", sortable: true },
  { title: "Actions", key: "actions", align: "center" as const, sortable: false },
];

// Summary calculations
const summary = computed(() => {
  const list = filteredProperties.value;
  return {
    totalValue: list.reduce((acc, p) => acc + p.currentValue, 0),
    totalCost: list.reduce(
      (acc, p) => acc + p.purchasePrice + p.registrationCost + p.stampDuty,
      0
    ),
    totalLoanOutstanding: list.reduce((acc, p) => acc + (p.loanOutstanding ?? 0), 0),
    totalRentalIncome: list.reduce((acc, p) => acc + (p.rentalIncome ?? 0), 0),
    totalAppreciation: list.reduce((acc, p) => acc + p.appreciation, 0),
    propertyCount: list.length,
  };
});

const netEquity = computed(() => summary.value.totalValue - summary.value.totalLoanOutstanding);
const avgAppreciation = computed(() =>
  summary.value.totalCost > 0
    ? (summary.value.totalAppreciation / summary.value.totalCost) * 100
    : 0
);

// Delete handling
const handleDeleteClick = (property: Property) => {
  deletingProperty.value = property;
  showDeleteConfirm.value = true;
};

const confirmDelete = async () => {
  if (deletingProperty.value) {
    await deleteInvestment.mutateAsync(deletingProperty.value.id);
  }
  showDeleteConfirm.value = false;
  deletingProperty.value = null;
};

// Type helpers
const getTypeColor = (type: string) => {
  switch (type) {
    case "residential":
      return "purple";
    case "commercial":
      return "success";
    case "land":
      return "warning";
    default:
      return "grey";
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "residential":
      return "mdi-home";
    case "commercial":
      return "mdi-office-building";
    case "land":
      return "mdi-terrain";
    default:
      return "mdi-home-city";
  }
};
</script>

<template>
  <div class="property-details-tab">
    <!-- Loading State -->
    <template v-if="isLoading">
      <v-skeleton-loader type="table" />
    </template>

    <template v-else>
      <!-- Action Bar -->
      <v-card variant="outlined" class="mb-4">
        <v-card-text class="d-flex align-center justify-space-between flex-wrap gap-3">
          <div class="d-flex align-center gap-3">
            <v-chip color="purple" variant="tonal">
              <v-icon icon="mdi-home-city" class="mr-1" />
              {{ summary.propertyCount }} Properties
            </v-chip>
            <v-chip color="success" variant="tonal">
              <v-icon icon="mdi-trending-up" class="mr-1" />
              {{ formatPercentage(avgAppreciation) }}
            </v-chip>
          </div>

          <div class="d-flex gap-2 flex-wrap">
            <v-text-field
              v-model="searchQuery"
              placeholder="Search properties..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              style="max-width: 250px"
              clearable
            />
            <v-select
              v-model="typeFilter"
              :items="[
                { title: 'All Types', value: null },
                { title: 'Residential', value: 'residential' },
                { title: 'Commercial', value: 'commercial' },
                { title: 'Land', value: 'land' },
              ]"
              label="Type"
              variant="outlined"
              density="compact"
              hide-details
              style="max-width: 150px"
            />
            <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="emit('add-property')">
              Add Property
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <!-- Data Table -->
      <v-card variant="outlined">
        <v-data-table
          :headers="headers"
          :items="filteredProperties"
          :sort-by="sortBy"
          item-value="id"
          density="comfortable"
          hover
          class="property-table"
        >
          <!-- Property Column -->
          <template #item.name="{ item }">
            <div class="d-flex align-center gap-2 py-2">
              <v-avatar size="32" :color="getTypeColor(item.type)" variant="tonal">
                <v-icon :icon="getTypeIcon(item.type)" size="small" />
              </v-avatar>
              <div>
                <div class="font-weight-medium">{{ item.name }}</div>
                <div class="text-caption text-medium-emphasis text-truncate" style="max-width: 200px">
                  {{ item.address }}
                </div>
              </div>
            </div>
          </template>

          <!-- Type Column -->
          <template #item.type="{ item }">
            <v-chip size="small" :color="getTypeColor(item.type)" variant="tonal">
              {{ item.type.charAt(0).toUpperCase() + item.type.slice(1) }}
            </v-chip>
          </template>

          <!-- Purchase Price Column -->
          <template #item.purchasePrice="{ item }">
            <span class="text-currency">{{ formatINRCompact(item.purchasePrice) }}</span>
          </template>

          <!-- Current Value Column -->
          <template #item.currentValue="{ item }">
            <span class="text-currency font-weight-medium">{{ formatINRCompact(item.currentValue) }}</span>
          </template>

          <!-- Appreciation Column -->
          <template #item.appreciation="{ item }">
            <div class="text-right">
              <div class="text-currency font-weight-medium text-success">
                +{{ formatINRCompact(item.appreciation) }}
              </div>
              <div class="text-caption text-success">
                {{ formatPercentage(item.appreciationPercentage) }}
              </div>
            </div>
          </template>

          <!-- Loan Column -->
          <template #item.loanOutstanding="{ item }">
            <span v-if="item.loanOutstanding" class="text-currency text-error">
              {{ formatINRCompact(item.loanOutstanding) }}
            </span>
            <span v-else class="text-medium-emphasis">-</span>
          </template>

          <!-- Rent Column -->
          <template #item.rentalIncome="{ item }">
            <span v-if="item.rentalIncome" class="text-currency text-primary font-weight-medium">
              {{ formatINR(item.rentalIncome) }}
            </span>
            <span v-else class="text-medium-emphasis">-</span>
          </template>

          <!-- Purchase Date Column -->
          <template #item.purchaseDate="{ item }">
            <span class="text-caption">
              {{ item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString("en-IN") : "-" }}
            </span>
          </template>

          <!-- Actions Column -->
          <template #item.actions="{ item }">
            <div class="d-flex gap-1 justify-center">
              <v-btn
                icon="mdi-pencil"
                size="small"
                variant="text"
                color="primary"
                @click="emit('edit-property', item)"
              />
              <v-btn
                icon="mdi-delete"
                size="small"
                variant="text"
                color="error"
                @click="handleDeleteClick(item)"
              />
            </div>
          </template>

          <!-- Footer -->
          <template #bottom>
            <v-divider />
            <div class="pa-4">
              <v-row>
                <v-col cols="12" md="3">
                  <div class="text-caption text-medium-emphasis">Total Value</div>
                  <div class="text-h6 font-weight-bold text-currency">
                    {{ formatINRCompact(summary.totalValue) }}
                  </div>
                </v-col>
                <v-col cols="12" md="3">
                  <div class="text-caption text-medium-emphasis">Net Equity</div>
                  <div class="text-h6 font-weight-bold text-currency">
                    {{ formatINRCompact(netEquity) }}
                  </div>
                </v-col>
                <v-col cols="12" md="3">
                  <div class="text-caption text-medium-emphasis">Total Appreciation</div>
                  <div class="text-h6 font-weight-bold text-currency text-success">
                    +{{ formatINRCompact(summary.totalAppreciation) }}
                    ({{ formatPercentage(avgAppreciation) }})
                  </div>
                </v-col>
                <v-col cols="12" md="3">
                  <div class="text-caption text-medium-emphasis">Monthly Rent</div>
                  <div class="text-h6 font-weight-bold text-currency text-primary">
                    {{ formatINR(summary.totalRentalIncome) }}
                  </div>
                </v-col>
              </v-row>
            </div>
          </template>
        </v-data-table>
      </v-card>
    </template>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteConfirm" max-width="400">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-alert" color="error" class="mr-2" />
          Delete Property
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete
          <strong>{{ deletingProperty?.name }}</strong>?
          This action cannot be undone.
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

<style scoped>
.text-currency {
  font-family: "Roboto Mono", monospace;
}

.property-table :deep(.v-data-table__td) {
  white-space: nowrap;
}
</style>
