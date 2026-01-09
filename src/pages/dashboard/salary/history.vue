<script setup lang="ts">
import { ref } from "vue";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import SalaryHistoryTable from "@/components/salary/SalaryHistoryTable.vue";
import SalaryHistoryForm from "@/components/salary/SalaryHistoryForm.vue";
import {
  useSalaryHistory,
  useAddSalaryHistory,
  useUpdateSalaryHistory,
  useDeleteSalaryHistory,
  useFinancialYear,
  useSyncSalary,
} from "@/composables/useSalary";
import type { SalaryHistoryRecord, SalaryHistoryInput } from "@/types/salary";
import { getFinancialYearOptions } from "@/types/salary";

const tabs = [
  { title: "Overview", route: "/dashboard/salary" },
  { title: "Current Salary", route: "/dashboard/salary/current" },
  { title: "Salary History", route: "/dashboard/salary/history" },
  { title: "Reports", route: "/dashboard/salary/reports" },
];

const { selectedFinancialYear, setFinancialYear } = useFinancialYear();
const fyOptions = getFinancialYearOptions();

const { data: salaryHistory, isLoading } = useSalaryHistory();
const addMutation = useAddSalaryHistory();
const updateMutation = useUpdateSalaryHistory();
const deleteMutation = useDeleteSalaryHistory();
const syncMutation = useSyncSalary();

// Sync state
const syncingId = ref<string | null>(null);

// Dialog state
const showFormDialog = ref(false);
const editingRecord = ref<SalaryHistoryRecord | null>(null);

// Delete confirmation dialog
const showDeleteDialog = ref(false);
const deletingRecord = ref<SalaryHistoryRecord | null>(null);

// Snackbar
const snackbar = ref({
  show: false,
  message: "",
  color: "success",
});

const showSnackbar = (message: string, color = "success") => {
  snackbar.value = { show: true, message, color };
};

// Handlers
const handleAdd = () => {
  editingRecord.value = null;
  showFormDialog.value = true;
};

const handleEdit = (record: SalaryHistoryRecord) => {
  editingRecord.value = record;
  showFormDialog.value = true;
};

const handleDelete = (record: SalaryHistoryRecord) => {
  deletingRecord.value = record;
  showDeleteDialog.value = true;
};

const confirmDelete = async () => {
  if (!deletingRecord.value) return;

  try {
    await deleteMutation.mutateAsync(deletingRecord.value.id);
    showSnackbar("Salary record deleted successfully");
  } catch (error) {
    showSnackbar("Failed to delete salary record", "error");
  } finally {
    showDeleteDialog.value = false;
    deletingRecord.value = null;
  }
};

const handleSave = async (data: SalaryHistoryInput) => {
  try {
    if (editingRecord.value) {
      await updateMutation.mutateAsync({
        id: editingRecord.value.id,
        data,
      });
      showSnackbar("Salary record updated successfully");
    } else {
      await addMutation.mutateAsync(data);
      showSnackbar("Salary record added successfully");
    }
  } catch (error) {
    showSnackbar("Failed to save salary record", "error");
  }
};

const handleSync = async (record: SalaryHistoryRecord) => {
  syncingId.value = record.id;
  try {
    const result = await syncMutation.mutateAsync(record.id);
    if (result.epf.synced || result.nps.synced) {
      const parts = [];
      if (result.epf.synced) parts.push("EPF");
      if (result.nps.synced) parts.push("NPS");
      showSnackbar(`Synced to ${parts.join(" & ")} successfully`);
    } else {
      showSnackbar("No contributions to sync", "info");
    }
  } catch (error) {
    showSnackbar("Failed to sync salary to retirement accounts", "error");
  } finally {
    syncingId.value = null;
  }
};
</script>

<template>
  <div>
    <SectionHeader
      title="Salary"
      subtitle="Monthly salary history"
      icon="mdi-cash-multiple"
      :tabs="tabs"
    />

    <!-- FY Selector -->
    <div class="d-flex justify-end mb-4">
      <v-select
        v-model="selectedFinancialYear"
        :items="fyOptions"
        label="Financial Year"
        density="compact"
        variant="outlined"
        style="max-width: 150px"
        hide-details
        @update:model-value="setFinancialYear"
      />
    </div>

    <!-- History Table -->
    <SalaryHistoryTable
      :records="salaryHistory || []"
      :loading="isLoading"
      :syncing="syncingId"
      @add="handleAdd"
      @edit="handleEdit"
      @delete="handleDelete"
      @sync="handleSync"
    />

    <!-- Add/Edit Form Dialog -->
    <SalaryHistoryForm
      v-model="showFormDialog"
      :record="editingRecord"
      :financial-year="selectedFinancialYear"
      @save="handleSave"
    />

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-alert" color="error" class="mr-2" />
          Confirm Delete
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete the salary record for
          <strong v-if="deletingRecord">
            {{ deletingRecord.financialYear }} - Month
            {{ deletingRecord.month }} </strong
          >? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDeleteDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="deleteMutation.isPending.value"
            @click="confirmDelete"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>
