<script setup lang="ts">
import { ref, computed } from "vue";
import { formatINR } from "@/composables/useIncome";

interface Exemption {
  id: string;
  section: "54" | "54F" | "54EC";
  saleDate: string;
  exemptionClaimed: number;
  amountUtilized: number;
  propertyDescription: string;
  reinvestmentDeadline: string;
  status: "pending" | "partial" | "completed" | "expired";
}

// Mock data - in production this would come from the API
const exemptions = ref<Exemption[]>([
  {
    id: "1",
    section: "54",
    saleDate: "2024-06-15",
    exemptionClaimed: 2500000,
    amountUtilized: 1500000,
    propertyDescription: "Flat in Mumbai sold",
    reinvestmentDeadline: "2026-06-15",
    status: "partial",
  },
]);

// Add new exemption form
const showAddForm = ref(false);
const newExemption = ref({
  section: "54" as "54" | "54F" | "54EC",
  saleDate: "",
  exemptionClaimed: 0,
  amountUtilized: 0,
  propertyDescription: "",
});

// Section info
const sectionInfo = {
  "54": {
    title: "Section 54 - Residential Property",
    description: "Exemption on LTCG from sale of residential house if reinvested in another residential house",
    purchaseDeadline: "2 years from sale",
    constructionDeadline: "3 years from sale",
    maxProperties: "2 (if gain ≤ ₹2 Cr)",
  },
  "54F": {
    title: "Section 54F - Any Asset to Residential",
    description: "Exemption on LTCG from sale of any asset (other than residential) if invested in residential house",
    purchaseDeadline: "1 year before or 2 years after sale",
    constructionDeadline: "3 years from sale",
    condition: "Should not own more than 1 residential house on sale date",
  },
  "54EC": {
    title: "Section 54EC - Capital Gains Bonds",
    description: "Exemption on LTCG from property if invested in specified bonds (NHAI, REC)",
    deadline: "6 months from sale",
    maxLimit: "₹50 lakhs per FY",
    lockIn: "5 years",
  },
};

// Calculate days remaining
function daysRemaining(deadline: string): number {
  const today = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Format deadline with status color
function getDeadlineColor(deadline: string): string {
  const days = daysRemaining(deadline);
  if (days < 0) return "error";
  if (days < 90) return "warning";
  if (days < 180) return "info";
  return "success";
}

function getStatusColor(status: string): string {
  switch (status) {
    case "completed":
      return "success";
    case "partial":
      return "warning";
    case "expired":
      return "error";
    default:
      return "info";
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Calculate reinvestment deadline based on section
function calculateDeadline(section: string, saleDate: string): string {
  const sale = new Date(saleDate);
  switch (section) {
    case "54":
    case "54F":
      // 2 years for purchase
      sale.setFullYear(sale.getFullYear() + 2);
      break;
    case "54EC":
      // 6 months
      sale.setMonth(sale.getMonth() + 6);
      break;
  }
  return sale.toISOString().split("T")[0];
}

function addExemption() {
  if (newExemption.value.saleDate && newExemption.value.exemptionClaimed > 0) {
    const deadline = calculateDeadline(newExemption.value.section, newExemption.value.saleDate);
    exemptions.value.push({
      id: Date.now().toString(),
      ...newExemption.value,
      reinvestmentDeadline: deadline,
      status: "pending",
    });
    showAddForm.value = false;
    newExemption.value = {
      section: "54",
      saleDate: "",
      exemptionClaimed: 0,
      amountUtilized: 0,
      propertyDescription: "",
    };
  }
}

// Summary calculations
const totalClaimed = computed(() =>
  exemptions.value.reduce((sum, e) => sum + e.exemptionClaimed, 0)
);
const totalUtilized = computed(() =>
  exemptions.value.reduce((sum, e) => sum + e.amountUtilized, 0)
);
const pendingAmount = computed(() => totalClaimed.value - totalUtilized.value);
const upcomingDeadlines = computed(() =>
  exemptions.value
    .filter((e) => e.status !== "completed" && e.status !== "expired")
    .filter((e) => daysRemaining(e.reinvestmentDeadline) > 0)
    .sort((a, b) => daysRemaining(a.reinvestmentDeadline) - daysRemaining(b.reinvestmentDeadline))
);
</script>

<template>
  <v-card class="mb-4">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2" color="success">mdi-shield-home</v-icon>
      Section 54/54F/54EC Exemption Tracker
      <v-spacer />
      <v-btn
        color="primary"
        size="small"
        prepend-icon="mdi-plus"
        @click="showAddForm = true"
      >
        Track Exemption
      </v-btn>
    </v-card-title>

    <v-card-text>
      <!-- Summary Cards -->
      <v-row class="mb-4">
        <v-col cols="12" sm="4">
          <v-card variant="tonal" color="primary">
            <v-card-text class="text-center">
              <div class="text-h5 font-weight-bold text-currency">
                {{ formatINR(totalClaimed) }}
              </div>
              <div class="text-body-2">Total Exemption Claimed</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4">
          <v-card variant="tonal" color="success">
            <v-card-text class="text-center">
              <div class="text-h5 font-weight-bold text-currency">
                {{ formatINR(totalUtilized) }}
              </div>
              <div class="text-body-2">Amount Reinvested</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4">
          <v-card variant="tonal" :color="pendingAmount > 0 ? 'warning' : 'success'">
            <v-card-text class="text-center">
              <div class="text-h5 font-weight-bold text-currency">
                {{ formatINR(pendingAmount) }}
              </div>
              <div class="text-body-2">Pending Reinvestment</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Upcoming Deadlines Alert -->
      <v-alert
        v-if="upcomingDeadlines.length > 0"
        type="warning"
        variant="tonal"
        class="mb-4"
      >
        <div class="font-weight-medium mb-2">
          <v-icon class="mr-1">mdi-clock-alert</v-icon>
          Upcoming Reinvestment Deadlines
        </div>
        <v-list density="compact" class="bg-transparent">
          <v-list-item
            v-for="exemption in upcomingDeadlines.slice(0, 3)"
            :key="exemption.id"
            class="px-0"
          >
            <template #prepend>
              <v-chip size="small" :color="getDeadlineColor(exemption.reinvestmentDeadline)">
                {{ daysRemaining(exemption.reinvestmentDeadline) }} days
              </v-chip>
            </template>
            <v-list-item-title>
              {{ exemption.propertyDescription }} - Section {{ exemption.section }}
            </v-list-item-title>
            <template #append>
              <span class="text-currency">
                {{ formatINR(exemption.exemptionClaimed - exemption.amountUtilized) }} pending
              </span>
            </template>
          </v-list-item>
        </v-list>
      </v-alert>

      <!-- Exemptions List -->
      <div v-if="exemptions.length > 0">
        <div class="text-subtitle-2 mb-2">Tracked Exemptions</div>
        <v-expansion-panels variant="accordion">
          <v-expansion-panel
            v-for="exemption in exemptions"
            :key="exemption.id"
          >
            <v-expansion-panel-title>
              <div class="d-flex align-center w-100">
                <v-chip size="small" class="mr-2" variant="tonal">
                  Sec {{ exemption.section }}
                </v-chip>
                <span class="flex-grow-1">{{ exemption.propertyDescription }}</span>
                <v-chip
                  size="small"
                  :color="getStatusColor(exemption.status)"
                  class="mr-2"
                >
                  {{ exemption.status }}
                </v-chip>
                <span class="text-currency font-weight-medium">
                  {{ formatINR(exemption.exemptionClaimed) }}
                </span>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row>
                <v-col cols="6" md="3">
                  <div class="text-caption text-medium-emphasis">Sale Date</div>
                  <div>{{ formatDate(exemption.saleDate) }}</div>
                </v-col>
                <v-col cols="6" md="3">
                  <div class="text-caption text-medium-emphasis">Reinvestment Deadline</div>
                  <div :class="`text-${getDeadlineColor(exemption.reinvestmentDeadline)}`">
                    {{ formatDate(exemption.reinvestmentDeadline) }}
                    <span v-if="daysRemaining(exemption.reinvestmentDeadline) > 0">
                      ({{ daysRemaining(exemption.reinvestmentDeadline) }} days)
                    </span>
                  </div>
                </v-col>
                <v-col cols="6" md="3">
                  <div class="text-caption text-medium-emphasis">Exemption Claimed</div>
                  <div class="text-currency">{{ formatINR(exemption.exemptionClaimed) }}</div>
                </v-col>
                <v-col cols="6" md="3">
                  <div class="text-caption text-medium-emphasis">Amount Utilized</div>
                  <div class="text-currency text-success">{{ formatINR(exemption.amountUtilized) }}</div>
                </v-col>
              </v-row>
              <v-progress-linear
                :model-value="(exemption.amountUtilized / exemption.exemptionClaimed) * 100"
                :color="exemption.amountUtilized >= exemption.exemptionClaimed ? 'success' : 'warning'"
                height="8"
                rounded
                class="mt-3"
              />
              <div class="text-caption text-right mt-1">
                {{ ((exemption.amountUtilized / exemption.exemptionClaimed) * 100).toFixed(0) }}% utilized
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-6">
        <v-icon icon="mdi-shield-home-outline" size="48" color="grey-lighten-1" />
        <div class="text-body-1 text-medium-emphasis mt-2">
          No exemptions being tracked
        </div>
        <div class="text-caption text-medium-emphasis">
          Track your Section 54/54F/54EC exemptions to never miss reinvestment deadlines
        </div>
      </div>

      <!-- Section Info Cards -->
      <v-row class="mt-4">
        <v-col cols="12" md="4">
          <v-card variant="outlined" density="compact">
            <v-card-title class="text-body-1">
              <v-icon size="small" class="mr-1" color="primary">mdi-home</v-icon>
              Section 54
            </v-card-title>
            <v-card-text class="text-caption">
              Sale of residential house → Buy new residential house<br />
              <strong>Purchase:</strong> Within 2 years<br />
              <strong>Construction:</strong> Within 3 years
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card variant="outlined" density="compact">
            <v-card-title class="text-body-1">
              <v-icon size="small" class="mr-1" color="secondary">mdi-home-import-outline</v-icon>
              Section 54F
            </v-card-title>
            <v-card-text class="text-caption">
              Sale of any asset → Buy residential house<br />
              <strong>Condition:</strong> Max 1 house on sale date<br />
              <strong>Timeline:</strong> 1 yr before or 2 yrs after
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card variant="outlined" density="compact">
            <v-card-title class="text-body-1">
              <v-icon size="small" class="mr-1" color="info">mdi-file-certificate</v-icon>
              Section 54EC
            </v-card-title>
            <v-card-text class="text-caption">
              LTCG from property → Capital gains bonds<br />
              <strong>Deadline:</strong> Within 6 months<br />
              <strong>Max:</strong> ₹50L/year, 5-year lock-in
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>

    <!-- Add Exemption Dialog -->
    <v-dialog v-model="showAddForm" max-width="500">
      <v-card>
        <v-card-title>Track New Exemption</v-card-title>
        <v-card-text>
          <v-select
            v-model="newExemption.section"
            label="Section"
            :items="[
              { title: 'Section 54 - Residential to Residential', value: '54' },
              { title: 'Section 54F - Any Asset to Residential', value: '54F' },
              { title: 'Section 54EC - Capital Gains Bonds', value: '54EC' },
            ]"
            item-title="title"
            item-value="value"
          />
          <v-text-field
            v-model="newExemption.propertyDescription"
            label="Property/Asset Description"
            placeholder="e.g., 2BHK Flat in Andheri"
          />
          <v-text-field
            v-model="newExemption.saleDate"
            label="Sale Date"
            type="date"
          />
          <v-text-field
            v-model.number="newExemption.exemptionClaimed"
            label="Exemption Amount Claimed"
            type="number"
            prefix="₹"
          />
          <v-text-field
            v-model.number="newExemption.amountUtilized"
            label="Amount Already Reinvested"
            type="number"
            prefix="₹"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showAddForm = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="addExemption">
            Track Exemption
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>
