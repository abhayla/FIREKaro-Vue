<script setup lang="ts">
import { ref } from "vue";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import FinancialYearSelector from "@/components/shared/FinancialYearSelector.vue";
import PropertyOverviewTab from "@/components/investments/tabs/PropertyOverviewTab.vue";
import PropertyDetailsTab from "@/components/investments/tabs/PropertyDetailsTab.vue";
import { useFinancialYear } from "@/composables/useSalary";
import {
  useCreateInvestment,
  useUpdateInvestment,
  type Property,
} from "@/composables/useInvestments";

const tabs = [
  { title: "Portfolio", route: "/dashboard/investments" },
  { title: "Stocks", route: "/dashboard/investments/stocks" },
  { title: "Mutual Funds", route: "/dashboard/investments/mutual-funds" },
  { title: "EPF", route: "/dashboard/investments/epf" },
  { title: "PPF", route: "/dashboard/investments/ppf" },
  { title: "NPS", route: "/dashboard/investments/nps" },
  { title: "ESOPs", route: "/dashboard/investments/esop" },
  { title: "Property", route: "/dashboard/investments/property" },
  { title: "Reports", route: "/dashboard/investments/reports" },
];

// Active tab state
const activeTab = ref("overview");

// Financial year selection
const { selectedFinancialYear, setFinancialYear } = useFinancialYear();

// Mutations
const createInvestment = useCreateInvestment();
const updateInvestment = useUpdateInvestment();

// Dialog state
const showAddDialog = ref(false);
const editingProperty = ref<Property | null>(null);

// Property type mapping
type PropertyType = "residential" | "commercial" | "land" | "other";

// Property form
const newProperty = ref<{
  name: string;
  type: PropertyType;
  address: string;
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  registrationCost: number;
  stampDuty: number;
  loanOutstanding: number;
  rentalIncome: number;
}>({
  name: "",
  type: "residential",
  address: "",
  purchaseDate: "",
  purchasePrice: 0,
  currentValue: 0,
  registrationCost: 0,
  stampDuty: 0,
  loanOutstanding: 0,
  rentalIncome: 0,
});

// Reset form
const resetPropertyForm = () => {
  newProperty.value = {
    name: "",
    type: "residential",
    address: "",
    purchaseDate: "",
    purchasePrice: 0,
    currentValue: 0,
    registrationCost: 0,
    stampDuty: 0,
    loanOutstanding: 0,
    rentalIncome: 0,
  };
};

// Handle add property
const handleAddProperty = () => {
  editingProperty.value = null;
  resetPropertyForm();
  showAddDialog.value = true;
};

// Handle edit property
const handleEditProperty = (property: Property) => {
  editingProperty.value = property;
  const propertyType = (
    ["residential", "commercial", "land", "other"].includes(property.type)
      ? property.type
      : "residential"
  ) as PropertyType;

  newProperty.value = {
    name: property.name,
    type: propertyType,
    address: property.address ?? "",
    purchaseDate: property.purchaseDate ?? "",
    purchasePrice: property.purchasePrice,
    currentValue: property.currentValue,
    registrationCost: property.registrationCost ?? 0,
    stampDuty: property.stampDuty ?? 0,
    loanOutstanding: property.loanOutstanding ?? 0,
    rentalIncome: property.rentalIncome ?? 0,
  };
  showAddDialog.value = true;
};

// Save property
const handleSaveProperty = async () => {
  const totalCost =
    newProperty.value.purchasePrice +
    newProperty.value.registrationCost +
    newProperty.value.stampDuty;

  const propertyData = {
    name: newProperty.value.name,
    type: "real_estate" as const,
    category: "real_estate" as const,
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
      rentalIncome: newProperty.value.rentalIncome,
    }),
  };

  try {
    if (editingProperty.value) {
      await updateInvestment.mutateAsync({
        id: editingProperty.value.id,
        data: propertyData,
      });
    } else {
      await createInvestment.mutateAsync(propertyData);
    }

    resetPropertyForm();
    editingProperty.value = null;
    showAddDialog.value = false;
  } catch (err) {
    console.error("Failed to save property:", err);
  }
};
</script>

<template>
  <div>
    <SectionHeader
      title="Investments"
      subtitle="Property Investments"
      icon="mdi-chart-line"
      :tabs="tabs"
    />

    <!-- Tab Navigation and FY Selector -->
    <div class="d-flex justify-space-between align-center mb-4 flex-wrap gap-3">
      <v-tabs v-model="activeTab" color="primary" density="compact">
        <v-tab value="overview">Overview</v-tab>
        <v-tab value="details">Item Details</v-tab>
      </v-tabs>

      <FinancialYearSelector v-model="selectedFinancialYear" :dense="true" />
    </div>

    <!-- Tab Content -->
    <v-window v-model="activeTab">
      <v-window-item value="overview">
        <PropertyOverviewTab
          :financial-year="selectedFinancialYear"
          @go-to-details="activeTab = 'details'"
          @add-property="handleAddProperty"
        />
      </v-window-item>

      <v-window-item value="details">
        <PropertyDetailsTab
          :financial-year="selectedFinancialYear"
          @add-property="handleAddProperty"
          @edit-property="handleEditProperty"
        />
      </v-window-item>
    </v-window>

    <!-- Add/Edit Property Dialog -->
    <v-dialog v-model="showAddDialog" max-width="600" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-home-plus" class="mr-2" />
          {{ editingProperty ? "Edit Property" : "Add Property" }}
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
                  { title: 'Other', value: 'other' },
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
          <v-btn color="primary" variant="flat" @click="handleSaveProperty">
            {{ editingProperty ? "Update" : "Add" }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
