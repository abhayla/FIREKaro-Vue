<script setup lang="ts">
import { computed } from "vue";
import { Doughnut } from "vue-chartjs";
import {
  Chart as ChartJS,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  useProperties,
  formatINR,
  formatINRCompact,
  formatPercentage,
  type Property,
} from "@/composables/useInvestments";

ChartJS.register(ArcElement, Title, Tooltip, Legend);

const props = defineProps<{
  financialYear: string;
}>();

const emit = defineEmits<{
  (e: "go-to-details"): void;
  (e: "add-property"): void;
}>();

// Data fetching
const { data: properties, isLoading } = useProperties();

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

// Summary calculations
const summary = computed(() => {
  const list = propertiesList.value;
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
const rentalYield = computed(() =>
  summary.value.totalValue > 0
    ? ((summary.value.totalRentalIncome * 12) / summary.value.totalValue) * 100
    : 0
);

// Type allocation chart
const typeAllocation = computed(() => {
  const types: Record<string, number> = {};
  propertiesList.value.forEach((p) => {
    const type = p.type.charAt(0).toUpperCase() + p.type.slice(1);
    types[type] = (types[type] || 0) + p.currentValue;
  });
  return Object.entries(types).map(([type, value]) => ({
    type,
    value,
    percentage: (value / summary.value.totalValue) * 100,
  }));
});

const typeChartData = computed(() => ({
  labels: typeAllocation.value.map((t) => t.type),
  datasets: [
    {
      data: typeAllocation.value.map((t) => t.value),
      backgroundColor: ["#9C27B0", "#4CAF50", "#FF9800", "#2196F3"],
      borderWidth: 2,
      borderColor: "#ffffff",
    },
  ],
}));

const typeChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "60%",
  plugins: {
    legend: {
      position: "right" as const,
    },
    tooltip: {
      callbacks: {
        label: (context: unknown) => {
          const ctx = context as { label: string; raw: number };
          const percentage = ((ctx.raw / summary.value.totalValue) * 100).toFixed(1);
          return `${ctx.label}: ${formatINRCompact(ctx.raw)} (${percentage}%)`;
        },
      },
    },
  },
};

// Property counts by type
const propertyTypeCounts = computed(() => ({
  residential: propertiesList.value.filter((p) => p.type === "residential").length,
  commercial: propertiesList.value.filter((p) => p.type === "commercial").length,
  land: propertiesList.value.filter((p) => p.type === "land").length,
}));
</script>

<template>
  <div class="property-overview-tab">
    <!-- Loading State -->
    <template v-if="isLoading">
      <v-skeleton-loader type="card, card, card" />
    </template>

    <template v-else>
      <!-- Summary Cards Row -->
      <v-row class="mb-6">
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4 text-center h-100">
            <v-icon icon="mdi-home-city" size="32" color="purple" class="mb-2" />
            <div class="text-body-2 text-medium-emphasis">Total Value</div>
            <div class="text-h5 font-weight-bold">{{ formatINRCompact(summary.totalValue) }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ summary.propertyCount }} properties
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4 text-center h-100">
            <v-icon icon="mdi-cash" size="32" color="primary" class="mb-2" />
            <div class="text-body-2 text-medium-emphasis">Net Equity</div>
            <div class="text-h5 font-weight-bold">{{ formatINRCompact(netEquity) }}</div>
            <div class="text-caption text-medium-emphasis">
              Loans: {{ formatINRCompact(summary.totalLoanOutstanding) }}
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4 text-center h-100">
            <v-icon icon="mdi-trending-up" size="32" color="success" class="mb-2" />
            <div class="text-body-2 text-medium-emphasis">Total Appreciation</div>
            <div class="text-h5 font-weight-bold text-success">
              {{ formatINRCompact(summary.totalAppreciation) }}
            </div>
            <div class="text-caption text-success">{{ formatPercentage(avgAppreciation) }} overall</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4 text-center h-100">
            <v-icon icon="mdi-currency-inr" size="32" color="warning" class="mb-2" />
            <div class="text-body-2 text-medium-emphasis">Monthly Rent</div>
            <div class="text-h5 font-weight-bold">{{ formatINR(summary.totalRentalIncome) }}</div>
            <div class="text-caption text-medium-emphasis">Yield: {{ rentalYield.toFixed(1) }}% p.a.</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Charts and Quick View -->
      <v-row class="mb-6">
        <v-col cols="12" md="5">
          <v-card variant="outlined" class="h-100">
            <v-card-title class="text-subtitle-1">
              <v-icon icon="mdi-chart-pie" class="mr-2" color="purple" />
              Portfolio by Type
            </v-card-title>
            <v-card-text>
              <div style="height: 250px">
                <Doughnut :data="typeChartData" :options="typeChartOptions" />
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="7">
          <v-card variant="outlined" class="h-100">
            <v-card-title class="text-subtitle-1">
              <v-icon icon="mdi-view-list" class="mr-2" color="success" />
              Quick View
            </v-card-title>
            <v-card-text>
              <v-list density="compact">
                <v-list-item
                  v-for="property in propertiesList.slice(0, 4)"
                  :key="property.id"
                  class="px-0"
                >
                  <template #prepend>
                    <v-avatar
                      size="32"
                      :color="
                        property.type === 'residential'
                          ? 'purple'
                          : property.type === 'commercial'
                          ? 'success'
                          : 'warning'
                      "
                      variant="tonal"
                    >
                      <v-icon
                        :icon="
                          property.type === 'residential'
                            ? 'mdi-home'
                            : property.type === 'commercial'
                            ? 'mdi-office-building'
                            : 'mdi-terrain'
                        "
                        size="small"
                      />
                    </v-avatar>
                  </template>
                  <v-list-item-title class="font-weight-medium">{{ property.name }}</v-list-item-title>
                  <v-list-item-subtitle class="text-truncate" style="max-width: 200px">
                    {{ property.address }}
                  </v-list-item-subtitle>
                  <template #append>
                    <div class="text-right">
                      <div class="text-body-2 font-weight-medium text-currency">
                        {{ formatINRCompact(property.currentValue) }}
                      </div>
                      <div class="text-caption text-success">
                        +{{ formatPercentage(property.appreciationPercentage) }}
                      </div>
                    </div>
                  </template>
                </v-list-item>
              </v-list>
              <v-btn
                color="primary"
                variant="tonal"
                block
                class="mt-3"
                prepend-icon="mdi-view-list"
                @click="emit('go-to-details')"
              >
                View All Properties
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Property Type Summary -->
      <v-row class="mb-6">
        <v-col cols="12" md="4">
          <v-card variant="outlined" class="h-100 pa-4 text-center">
            <v-icon icon="mdi-home" size="40" color="purple" class="mb-2" />
            <div class="text-h4 font-weight-bold">{{ propertyTypeCounts.residential }}</div>
            <div class="text-body-2 text-medium-emphasis">Residential</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card variant="outlined" class="h-100 pa-4 text-center">
            <v-icon icon="mdi-office-building" size="40" color="success" class="mb-2" />
            <div class="text-h4 font-weight-bold">{{ propertyTypeCounts.commercial }}</div>
            <div class="text-body-2 text-medium-emphasis">Commercial</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card variant="outlined" class="h-100 pa-4 text-center">
            <v-icon icon="mdi-terrain" size="40" color="warning" class="mb-2" />
            <div class="text-h4 font-weight-bold">{{ propertyTypeCounts.land }}</div>
            <div class="text-body-2 text-medium-emphasis">Land</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Tax Benefits -->
      <v-card variant="outlined">
        <v-card-title class="text-subtitle-1">
          <v-icon icon="mdi-information" class="mr-2" color="info" />
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

      <!-- Action Bar -->
      <v-card variant="outlined" class="mt-6">
        <v-card-text class="d-flex gap-3 flex-wrap justify-center">
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-plus"
            @click="emit('add-property')"
          >
            Add Property
          </v-btn>
          <v-btn
            variant="tonal"
            prepend-icon="mdi-table"
            @click="emit('go-to-details')"
          >
            View Details
          </v-btn>
        </v-card-text>
      </v-card>
    </template>
  </div>
</template>

<style scoped>
.text-currency {
  font-family: "Roboto Mono", monospace;
}

.h-100 {
  height: 100%;
}
</style>
