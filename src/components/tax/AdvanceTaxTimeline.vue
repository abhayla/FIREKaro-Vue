<script setup lang="ts">
import { computed } from "vue";
import { formatINR } from "@/composables/useTax";

interface Schedule {
  id: string;
  quarter: number;
  dueDate: string | Date;
  cumulativePercentage: number;
  cumulativeAmountDue: number;
  quarterAmountDue: number;
  amountPaid: number;
  shortfall: number;
  status: string;
  interest234C: number;
}

const props = defineProps<{
  schedules: Schedule[];
  financialYear: string;
}>();

const quarterInfo = [
  { quarter: 1, label: "Q1", month: "June 15", percentage: 15 },
  { quarter: 2, label: "Q2", month: "Sep 15", percentage: 45 },
  { quarter: 3, label: "Q3", month: "Dec 15", percentage: 75 },
  { quarter: 4, label: "Q4", month: "Mar 15", percentage: 100 },
];

const sortedSchedules = computed(() => {
  return [...(props.schedules || [])].sort((a, b) => a.quarter - b.quarter);
});

function getScheduleByQuarter(quarter: number): Schedule | undefined {
  return sortedSchedules.value.find((s) => s.quarter === quarter);
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PAID: "success",
    PARTIAL: "warning",
    PENDING: "grey",
    OVERDUE: "error",
  };
  return colors[status] || "grey";
}

function getStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    PAID: "mdi-check-circle",
    PARTIAL: "mdi-circle-half-full",
    PENDING: "mdi-clock-outline",
    OVERDUE: "mdi-alert-circle",
  };
  return icons[status] || "mdi-help-circle";
}

function formatDueDate(dateStr: string | Date): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

function isQuarterDue(quarter: number): boolean {
  const schedule = getScheduleByQuarter(quarter);
  if (!schedule) return false;
  const dueDate = new Date(schedule.dueDate);
  return new Date() >= dueDate;
}

function getProgressPercentage(schedule: Schedule | undefined): number {
  if (!schedule || schedule.quarterAmountDue === 0) return 0;
  return Math.min(100, (schedule.amountPaid / schedule.quarterAmountDue) * 100);
}
</script>

<template>
  <v-card>
    <v-card-title>
      <v-icon class="mr-2">mdi-timeline-clock</v-icon>
      Quarterly Schedule
      <v-chip size="x-small" class="ml-2" color="primary" variant="tonal">
        {{ financialYear }}
      </v-chip>
    </v-card-title>

    <v-card-text>
      <div class="timeline-container">
        <div class="timeline-line" />

        <div class="d-flex justify-space-between">
          <div
            v-for="info in quarterInfo"
            :key="info.quarter"
            class="timeline-item"
          >
            <div
              class="timeline-node"
              :class="`bg-${getStatusColor(getScheduleByQuarter(info.quarter)?.status || 'PENDING')}`"
            >
              <v-icon size="small" color="white">
                {{ getStatusIcon(getScheduleByQuarter(info.quarter)?.status || 'PENDING') }}
              </v-icon>
            </div>

            <div class="timeline-content">
              <div class="text-subtitle-2 font-weight-medium">
                {{ info.label }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ info.month }}
              </div>
              <v-chip
                size="x-small"
                :color="getStatusColor(getScheduleByQuarter(info.quarter)?.status || 'PENDING')"
                class="mt-1"
              >
                {{ info.percentage }}%
              </v-chip>
            </div>
          </div>
        </div>
      </div>

      <v-divider class="my-4" />

      <!-- Detailed breakdown -->
      <v-expansion-panels variant="accordion">
        <v-expansion-panel
          v-for="info in quarterInfo"
          :key="`detail-${info.quarter}`"
        >
          <v-expansion-panel-title>
            <div class="d-flex align-center w-100">
              <v-icon
                :color="getStatusColor(getScheduleByQuarter(info.quarter)?.status || 'PENDING')"
                size="small"
                class="mr-2"
              >
                {{ getStatusIcon(getScheduleByQuarter(info.quarter)?.status || 'PENDING') }}
              </v-icon>
              <span class="font-weight-medium">{{ info.label }} - {{ info.month }}</span>
              <v-spacer />
              <v-chip
                size="small"
                :color="getStatusColor(getScheduleByQuarter(info.quarter)?.status || 'PENDING')"
                variant="tonal"
                class="mr-2"
              >
                {{ getScheduleByQuarter(info.quarter)?.status || 'PENDING' }}
              </v-chip>
            </div>
          </v-expansion-panel-title>

          <v-expansion-panel-text>
            <template v-if="getScheduleByQuarter(info.quarter)">
              <v-row dense>
                <v-col cols="6" sm="3">
                  <div class="text-caption text-medium-emphasis">Due Date</div>
                  <div class="font-weight-medium">
                    {{ formatDueDate(getScheduleByQuarter(info.quarter)!.dueDate) }}
                  </div>
                </v-col>
                <v-col cols="6" sm="3">
                  <div class="text-caption text-medium-emphasis">Quarter Amount</div>
                  <div class="font-weight-medium text-currency">
                    {{ formatINR(getScheduleByQuarter(info.quarter)!.quarterAmountDue) }}
                  </div>
                </v-col>
                <v-col cols="6" sm="3">
                  <div class="text-caption text-medium-emphasis">Amount Paid</div>
                  <div class="font-weight-medium text-currency text-success">
                    {{ formatINR(getScheduleByQuarter(info.quarter)!.amountPaid) }}
                  </div>
                </v-col>
                <v-col cols="6" sm="3">
                  <div class="text-caption text-medium-emphasis">Shortfall</div>
                  <div
                    class="font-weight-medium text-currency"
                    :class="getScheduleByQuarter(info.quarter)!.shortfall > 0 ? 'text-error' : 'text-success'"
                  >
                    {{ formatINR(getScheduleByQuarter(info.quarter)!.shortfall) }}
                  </div>
                </v-col>
              </v-row>

              <!-- Progress bar -->
              <div class="mt-3">
                <div class="d-flex justify-space-between text-caption text-medium-emphasis mb-1">
                  <span>Payment Progress</span>
                  <span>{{ getProgressPercentage(getScheduleByQuarter(info.quarter)).toFixed(0) }}%</span>
                </div>
                <v-progress-linear
                  :model-value="getProgressPercentage(getScheduleByQuarter(info.quarter))"
                  :color="getStatusColor(getScheduleByQuarter(info.quarter)!.status)"
                  height="8"
                  rounded
                />
              </div>

              <!-- Interest warning -->
              <v-alert
                v-if="getScheduleByQuarter(info.quarter)!.interest234C > 0"
                type="warning"
                variant="tonal"
                density="compact"
                class="mt-3"
              >
                <div class="text-caption">
                  Interest u/s 234C: {{ formatINR(getScheduleByQuarter(info.quarter)!.interest234C) }}
                </div>
              </v-alert>
            </template>

            <template v-else>
              <div class="text-body-2 text-medium-emphasis text-center py-4">
                No schedule data available for this quarter.
              </div>
            </template>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.timeline-container {
  position: relative;
  padding: 16px 0;
}

.timeline-line {
  position: absolute;
  top: 50%;
  left: 12%;
  right: 12%;
  height: 4px;
  background: rgb(var(--v-theme-surface-variant));
  border-radius: 2px;
  transform: translateY(-50%);
  z-index: 0;
}

.timeline-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
  width: 80px;
}

.timeline-node {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.timeline-content {
  text-align: center;
}
</style>
