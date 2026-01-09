// Salary Vue Query Composables
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { ref, computed, type Ref, type ComputedRef } from "vue";
import type {
  CurrentSalary,
  SalaryHistoryRecord,
  SalaryHistoryInput,
  SalarySummary,
  IncomeSource,
  SyncStatus,
  SalaryComponentDefinition,
  SalaryGridData,
  SalaryGridRow,
  EmployerSalarySummary,
  SalaryComponentType,
} from "@/types/salary";
import { getCurrentFinancialYear, DEFAULT_COMPONENT_DEFINITIONS, FY_MONTHS } from "@/types/salary";

// Format INR currency
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format INR with lakhs notation (e.g., 14.91L)
export function formatINRLakhs(amount: number): string {
  if (amount >= 10000000) {
    return `${(amount / 10000000).toFixed(2)}Cr`;
  } else if (amount >= 100000) {
    return `${(amount / 100000).toFixed(2)}L`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return formatINR(amount);
}

// Current Financial Year state
const selectedFinancialYear = ref(getCurrentFinancialYear());

// Generate financial year options (current + 3 previous years for 4 total)
function generateFinancialYearOptions(): string[] {
  const current = getCurrentFinancialYear();
  const [startYear] = current.split("-").map(Number);
  const options: string[] = [];

  for (let i = 0; i < 4; i++) {
    const year = startYear - i;
    options.push(`${year}-${(year + 1).toString().slice(-2)}`);
  }

  return options;
}

const financialYearOptions = generateFinancialYearOptions();

export function useFinancialYear() {
  return {
    selectedFinancialYear,
    financialYearOptions,
    setFinancialYear: (fy: string) => {
      selectedFinancialYear.value = fy;
    },
  };
}

// Fetch current salary breakdown
export function useCurrentSalary() {
  return useQuery({
    queryKey: ["salary", "current"],
    queryFn: async (): Promise<CurrentSalary> => {
      const res = await fetch("/api/salary/current");
      if (!res.ok) {
        throw new Error("Failed to fetch current salary");
      }
      return res.json();
    },
  });
}

// Transform backend response to Vue app format
function transformFromBackendFormat(entry: Record<string, unknown>): SalaryHistoryRecord {
  return {
    id: entry.id as string,
    month: entry.month as number,
    year: entry.year as number,
    financialYear: entry.financialYear as string,
    // Multi-employer support
    incomeSourceId: entry.incomeSourceId as string | undefined,
    employerName: entry.employerName as string | undefined,
    incomeSource: entry.incomeSource as { id: string; sourceName: string; sourceType: string } | undefined,
    // Earnings
    basicSalary: (entry.basicSalary as number) || 0,
    hra: (entry.houseRentAllowance as number) || 0,
    conveyanceAllowance: (entry.conveyanceAllowance as number) || 0,
    medicalAllowance: (entry.medicalAllowance as number) || 0,
    specialAllowance: ((entry.otherEarnings as Record<string, number>)?.specialAllowance) || 0,
    specialPay: ((entry.otherEarnings as Record<string, number>)?.specialPay) || 0,
    otherAllowances: ((entry.otherEarnings as Record<string, number>)?.otherAllowances) || 0,
    grossEarnings: (entry.grossSalary as number) || 0,
    // Deductions
    epfDeduction: (entry.employeePF as number) || 0,
    vpfDeduction: (entry.voluntaryPF as number) || 0,
    professionalTax: (entry.professionalTax as number) || 0,
    tdsDeduction: (entry.incomeTax as number) || 0,
    otherDeductions: ((entry.otherDeductions as Record<string, number>)?.other) || 0,
    totalDeductions: (entry.totalDeductions as number) || 0,
    netSalary: (entry.netSalary as number) || 0,
    paidDays: (entry.paidDays as number) || 30,
    // Employer contributions
    employerPf: (entry.employerPF as number) || 0,
    employerNps: (entry.npsContribution as number) || 0,
    pensionFund: (entry.pensionFund as number) || 0,
    superannuation: (entry.superannuation as number) || 0,
    // Sync tracking
    syncStatus: (entry.syncStatus as SyncStatus) || "PENDING",
    lastSyncedAt: entry.lastSyncedAt as string | undefined,
    syncedToEpf: (entry.syncedToEpf as boolean) || false,
    syncedToNps: (entry.syncedToNps as boolean) || false,
    syncError: entry.syncError as string | undefined,
    // Metadata
    createdAt: (entry.createdAt as string) || "",
    updatedAt: (entry.updatedAt as string) || "",
  };
}

// Fetch salary history
export function useSalaryHistory(financialYear?: string) {
  // Use computed to make query reactive to FY changes
  const fyRef = computed(() => financialYear || selectedFinancialYear.value);

  return useQuery({
    queryKey: computed(() => ["salary", "history", fyRef.value]),
    queryFn: async (): Promise<SalaryHistoryRecord[]> => {
      const fy = fyRef.value;
      const url = fy ? `/api/salary-history?financialYear=${fy}` : "/api/salary-history";
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to fetch salary history");
      }
      const json = await res.json();
      // Backend returns { success, data: { salaryEntries: [...] } }
      const entries = json.data?.salaryEntries || [];
      return entries.map(transformFromBackendFormat);
    },
  });
}

// Transform Vue app data to backend API format
function transformToBackendFormat(data: SalaryHistoryInput) {
  return {
    financialYear: data.financialYear,
    month: data.month,
    year: data.year,
    // Multi-employer support
    incomeSourceId: data.incomeSourceId,
    employerName: data.employerName,
    // Earnings - map Vue fields to backend fields
    basicSalary: data.basicSalary || 0,
    houseRentAllowance: data.hra || 0,
    conveyanceAllowance: data.conveyanceAllowance || 0,
    medicalAllowance: data.medicalAllowance || 0,
    // Use otherEarnings object for special allowances
    otherEarnings: {
      specialAllowance: data.specialAllowance || 0,
      specialPay: data.specialPay || 0,
      otherAllowances: data.otherAllowances || 0,
    },
    // Deductions - map Vue fields to backend fields
    employeePF: data.epfDeduction || 0,
    voluntaryPF: data.vpfDeduction || 0,
    professionalTax: data.professionalTax || 0,
    incomeTax: data.tdsDeduction || 0,
    otherDeductions: {
      other: data.otherDeductions || 0,
    },
    // Employer contributions
    employerPF: data.employerPf || 0,
    pensionFund: data.pensionFund || 0,
    npsContribution: data.employerNps || 0,
    superannuation: data.superannuation || 0,
  };
}

// Add salary history record
export function useAddSalaryHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: SalaryHistoryInput,
    ): Promise<SalaryHistoryRecord> => {
      const backendData = transformToBackendFormat(data);
      const res = await fetch("/api/salary-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backendData),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to add salary record");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary", "history"] });
      queryClient.invalidateQueries({ queryKey: ["salary", "summary"] });
    },
  });
}

// Update salary history record
export function useUpdateSalaryHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<SalaryHistoryInput>;
    }): Promise<SalaryHistoryRecord> => {
      const res = await fetch(`/api/salary-history/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update salary record");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary", "history"] });
      queryClient.invalidateQueries({ queryKey: ["salary", "summary"] });
    },
  });
}

// Delete salary history record
export function useDeleteSalaryHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(`/api/salary-history/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete salary record");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary", "history"] });
      queryClient.invalidateQueries({ queryKey: ["salary", "summary"] });
    },
  });
}

// Computed salary summary from history
export function useSalarySummary(financialYear?: string) {
  const fy = financialYear || selectedFinancialYear.value;
  const { data: history, isLoading, error } = useSalaryHistory(fy);

  const summary = computed((): SalarySummary | null => {
    if (!history.value || history.value.length === 0) {
      return null;
    }

    const records = history.value;
    const totalGrossEarnings = records.reduce(
      (sum, r) => sum + r.grossEarnings,
      0,
    );
    const totalDeductions = records.reduce(
      (sum, r) => sum + r.totalDeductions,
      0,
    );
    const totalNetSalary = records.reduce((sum, r) => sum + r.netSalary, 0);
    const totalTdsDeducted = records.reduce(
      (sum, r) => sum + r.tdsDeduction,
      0,
    );
    const totalEpfContribution = records.reduce(
      (sum, r) => sum + r.epfDeduction,
      0,
    );
    const totalVpfContribution = records.reduce(
      (sum, r) => sum + (r.vpfDeduction || 0),
      0,
    );

    return {
      financialYear: fy,
      totalGrossEarnings,
      totalDeductions,
      totalNetSalary,
      totalTdsDeducted,
      totalEpfContribution,
      totalVpfContribution,
      monthsRecorded: records.length,
      averageMonthlyGross: totalGrossEarnings / records.length,
      averageMonthlyNet: totalNetSalary / records.length,
    };
  });

  return {
    summary,
    isLoading,
    error,
  };
}

// Get latest salary record (most recent month)
export function useLatestSalary() {
  const { data: history, isLoading, error } = useSalaryHistory();

  const latestSalary = computed((): SalaryHistoryRecord | null => {
    if (!history.value || history.value.length === 0) {
      return null;
    }
    // Sort by year and month descending
    const sorted = [...history.value].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
    return sorted[0];
  });

  return {
    latestSalary,
    isLoading,
    error,
  };
}

// Calculate YoY comparison
export function useSalaryComparison(currentFY: string, previousFY: string) {
  const currentHistory = useSalaryHistory(currentFY);
  const previousHistory = useSalaryHistory(previousFY);

  const comparison = computed(() => {
    const current = currentHistory.data.value;
    const previous = previousHistory.data.value;

    if (!current || !previous) {
      return null;
    }

    const currentTotal = current.reduce((sum, r) => sum + r.grossEarnings, 0);
    const previousTotal = previous.reduce((sum, r) => sum + r.grossEarnings, 0);

    const currentNet = current.reduce((sum, r) => sum + r.netSalary, 0);
    const previousNet = previous.reduce((sum, r) => sum + r.netSalary, 0);

    const growthPercent =
      previousTotal > 0
        ? ((currentTotal - previousTotal) / previousTotal) * 100
        : 0;

    const netGrowthPercent =
      previousNet > 0 ? ((currentNet - previousNet) / previousNet) * 100 : 0;

    return {
      currentFY,
      previousFY,
      currentGross: currentTotal,
      previousGross: previousTotal,
      currentNet,
      previousNet,
      grossGrowth: currentTotal - previousTotal,
      netGrowth: currentNet - previousNet,
      grossGrowthPercent: growthPercent,
      netGrowthPercent: netGrowthPercent,
    };
  });

  return {
    comparison,
    isLoading: currentHistory.isLoading || previousHistory.isLoading,
    error: currentHistory.error || previousHistory.error,
  };
}

// ===== MULTI-EMPLOYER SUPPORT =====

// Fetch salary income sources (employers)
export function useSalaryIncomeSources(financialYear?: string) {
  const fyRef = computed(() => financialYear || selectedFinancialYear.value);

  return useQuery({
    queryKey: computed(() => ["income-sources", "salary", fyRef.value]),
    queryFn: async (): Promise<IncomeSource[]> => {
      const fy = fyRef.value;
      const url = `/api/income-sources?financialYear=${fy}&sourceType=SALARY`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to fetch income sources");
      }
      const json = await res.json();
      return json.data?.incomeSources || [];
    },
  });
}

// Create a new salary income source (employer)
export function useCreateIncomeSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      sourceName: string;
      description?: string;
      financialYear: string;
      isPrimary?: boolean;
    }): Promise<IncomeSource> => {
      const res = await fetch("/api/income-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          sourceType: "SALARY",
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create income source");
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income-sources"] });
    },
  });
}

// ===== SYNC TO EPF/NPS =====

// Sync result type
export interface SyncResult {
  salaryEntryId: string;
  month: number;
  year: number;
  financialYear: string;
  syncStatus: SyncStatus;
  lastSyncedAt: string;
  epf: {
    synced: boolean;
    message: string;
    amount: number;
  };
  nps: {
    synced: boolean;
    message: string;
    amount: number;
  };
}

// Sync salary to EPF/NPS accounts
export function useSyncSalary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (salaryId: string): Promise<SyncResult> => {
      const res = await fetch(`/api/salary-history/${salaryId}/sync`, {
        method: "POST",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to sync salary");
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["salary", "history"] });
      queryClient.invalidateQueries({ queryKey: ["epf"] });
      queryClient.invalidateQueries({ queryKey: ["nps"] });
    },
  });
}

// Reset sync status
export function useResetSyncStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (salaryId: string): Promise<void> => {
      const res = await fetch(`/api/salary-history/${salaryId}/sync`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to reset sync status");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary", "history"] });
    },
  });
}

// Bulk sync all pending salary records
export function useBulkSyncSalaries() {
  const queryClient = useQueryClient();
  const syncMutation = useSyncSalary();

  return useMutation({
    mutationFn: async (salaryIds: string[]): Promise<SyncResult[]> => {
      const results: SyncResult[] = [];
      for (const id of salaryIds) {
        try {
          const result = await syncMutation.mutateAsync(id);
          results.push(result);
        } catch (error) {
          console.error(`Failed to sync salary ${id}:`, error);
        }
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary", "history"] });
      queryClient.invalidateQueries({ queryKey: ["epf"] });
      queryClient.invalidateQueries({ queryKey: ["nps"] });
    },
  });
}

// ===== DYNAMIC SALARY COMPONENTS =====

// Fetch salary component definitions from API
export function useSalaryComponentDefinitions() {
  return useQuery({
    queryKey: ["salary-components"],
    queryFn: async (): Promise<SalaryComponentDefinition[]> => {
      try {
        const res = await fetch("/api/salary-components");
        if (!res.ok) {
          // Fallback to local defaults if API not available
          console.warn("Salary components API not available, using local defaults");
          return DEFAULT_COMPONENT_DEFINITIONS.map((def) => ({
            ...def,
            id: `system-${def.code}`,
            userId: null,
          }));
        }
        const json = await res.json();
        return json.data?.components || [];
      } catch (error) {
        // Fallback to local defaults on network error
        console.warn("Failed to fetch salary components, using local defaults:", error);
        return DEFAULT_COMPONENT_DEFINITIONS.map((def) => ({
          ...def,
          id: `system-${def.code}`,
          userId: null,
        }));
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hour - component definitions rarely change
  });
}

// Create custom salary component
export function useCreateSalaryComponent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<SalaryComponentDefinition, "id" | "createdAt" | "updatedAt">): Promise<SalaryComponentDefinition> => {
      const res = await fetch("/api/salary-components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create salary component");
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-components"] });
    },
  });
}

// Update salary component
export function useUpdateSalaryComponent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SalaryComponentDefinition> }): Promise<SalaryComponentDefinition> => {
      const res = await fetch(`/api/salary-components/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update salary component");
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-components"] });
    },
  });
}

// Delete custom salary component
export function useDeleteSalaryComponent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(`/api/salary-components/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete salary component");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-components"] });
    },
  });
}

// Get salary component definitions (uses API with local fallback)
export function useSalaryComponents(): {
  components: ComputedRef<SalaryComponentDefinition[]>;
  earnings: ComputedRef<SalaryComponentDefinition[]>;
  deductions: ComputedRef<SalaryComponentDefinition[]>;
  employerContributions: ComputedRef<SalaryComponentDefinition[]>;
  getComponent: (code: string) => SalaryComponentDefinition | undefined;
  isLoading: Ref<boolean>;
  error: Ref<Error | null>;
} {
  const { data, isLoading, error } = useSalaryComponentDefinitions();

  // Fallback to local defaults while loading or on error
  const components = computed<SalaryComponentDefinition[]>(() => {
    if (data.value && data.value.length > 0) {
      return data.value;
    }
    // Fallback to local defaults
    return DEFAULT_COMPONENT_DEFINITIONS.map((def) => ({
      ...def,
      id: `system-${def.code}`,
      userId: null,
    }));
  });

  const earnings = computed(() =>
    components.value.filter((c) => c.componentType === "EARNING" && !c.parentCode)
  );

  const deductions = computed(() =>
    components.value.filter((c) => c.componentType === "DEDUCTION" && !c.parentCode)
  );

  const employerContributions = computed(() =>
    components.value.filter((c) => c.componentType === "EMPLOYER_CONTRIBUTION")
  );

  const getComponent = (code: string) =>
    components.value.find((c) => c.code === code);

  return {
    components,
    earnings,
    deductions,
    employerContributions,
    getComponent,
    isLoading,
    error,
  };
}

// ===== 12-COLUMN FY GRID TRANSFORMATION =====

// Map old field names to component codes (matches Prisma seed script)
const FIELD_TO_COMPONENT_MAP: Record<string, string> = {
  // Earnings
  basicSalary: "BASIC",
  hra: "HRA",
  conveyanceAllowance: "CONVEYANCE",
  medicalAllowance: "MEDICAL",
  specialAllowance: "SPECIAL",
  specialPay: "SPECIAL_PAY",
  otherAllowances: "OTHER_ALLOWANCES", // Legacy - not in new schema
  // Deductions
  epfDeduction: "EPF",
  vpfDeduction: "VPF",
  professionalTax: "PT",
  tdsDeduction: "TDS",
  otherDeductions: "OTHER_DED",
  // Employer Contributions
  employerPf: "EPF_ER",
  pensionFund: "PENSION",
  employerNps: "NPS_ER",
  superannuation: "SUPERANN",
};

// Transform legacy salary record to component values map
function getComponentValuesFromRecord(record: SalaryHistoryRecord): Map<string, number> {
  const values = new Map<string, number>();
  const recordAsAny = record as unknown as Record<string, unknown>;

  // Map legacy fields to component codes
  for (const [field, code] of Object.entries(FIELD_TO_COMPONENT_MAP)) {
    const value = recordAsAny[field];
    if (typeof value === "number" && value > 0) {
      values.set(code, value);
    }
  }

  return values;
}

// Transform salary history to 12-column grid format
export function useEmployerSalaryGrid(
  incomeSourceId: Ref<string | undefined>,
  financialYear?: string
): {
  gridData: ComputedRef<SalaryGridData | null>;
  isLoading: Ref<boolean>;
  error: Ref<Error | null>;
} {
  const fyRef = computed(() => financialYear || selectedFinancialYear.value);
  const { data: history, isLoading, error } = useSalaryHistory(fyRef.value);
  const { components } = useSalaryComponents();

  const gridData = computed<SalaryGridData | null>(() => {
    if (!history.value || history.value.length === 0) {
      return null;
    }

    // Filter by income source if provided
    const records = incomeSourceId.value
      ? history.value.filter((r) => r.incomeSourceId === incomeSourceId.value)
      : history.value;

    if (records.length === 0) {
      return null;
    }

    // Get employer name from first record
    const employerName = records[0]?.incomeSource?.sourceName || records[0]?.employerName || "Unknown Employer";
    const sourceId = incomeSourceId.value || records[0]?.incomeSourceId || "";

    // Create month index map (1=Apr -> index 0, 12=Mar -> index 11)
    const monthToIndex = (fyMonth: number) => fyMonth - 1;

    // Initialize arrays for 12 months
    const paidDays: (number | null)[] = Array(12).fill(null);
    const grossEarnings: (number | null)[] = Array(12).fill(null);
    const totalDeductionsArr: (number | null)[] = Array(12).fill(null);
    const netSalaryArr: (number | null)[] = Array(12).fill(null);

    // Build component rows
    const componentValuesMap = new Map<string, (number | null)[]>();

    // Initialize all component arrays
    for (const comp of components.value) {
      if (!comp.parentCode) {
        componentValuesMap.set(comp.code, Array(12).fill(null));
      }
    }
    // Also initialize sub-components
    for (const comp of components.value) {
      if (comp.parentCode) {
        componentValuesMap.set(comp.code, Array(12).fill(null));
      }
    }

    // Fill in values from records
    for (const record of records) {
      const monthIndex = monthToIndex(record.month);
      if (monthIndex < 0 || monthIndex > 11) continue;

      paidDays[monthIndex] = record.paidDays;
      grossEarnings[monthIndex] = record.grossEarnings;
      totalDeductionsArr[monthIndex] = record.totalDeductions;
      netSalaryArr[monthIndex] = record.netSalary;

      const recordValues = getComponentValuesFromRecord(record);
      for (const [code, value] of recordValues) {
        const arr = componentValuesMap.get(code);
        if (arr) {
          arr[monthIndex] = value;
        }
      }
    }

    // Build rows
    const rows: SalaryGridRow[] = [];

    for (const comp of components.value.filter((c) => !c.parentCode)) {
      const values = componentValuesMap.get(comp.code) || Array(12).fill(null);
      const total = values.reduce((sum: number, v) => sum + (v || 0), 0);

      // Skip empty rows
      if (total === 0) continue;

      const row: SalaryGridRow = {
        componentCode: comp.code,
        componentName: comp.name,
        componentType: comp.componentType,
        isExpandable: comp.isExpandable,
        isExpanded: false,
        displayOrder: comp.displayOrder,
        values,
        total,
      };
      rows.push(row);

      // Add sub-components if this is expandable
      if (comp.isExpandable) {
        const subComponents = components.value.filter((c) => c.parentCode === comp.code);
        for (const sub of subComponents) {
          const subValues = componentValuesMap.get(sub.code) || Array(12).fill(null);
          const subTotal = subValues.reduce((sum: number, v) => sum + (v || 0), 0);

          if (subTotal === 0) continue;

          rows.push({
            componentCode: sub.code,
            componentName: sub.name,
            componentType: sub.componentType,
            isExpandable: false,
            isSubComponent: true,
            parentCode: comp.code,
            displayOrder: sub.displayOrder,
            values: subValues,
            total: subTotal,
          });
        }
      }
    }

    // Sort rows by component type then display order
    const typeOrder: Record<SalaryComponentType, number> = {
      EARNING: 1,
      DEDUCTION: 2,
      EMPLOYER_CONTRIBUTION: 3,
    };
    rows.sort((a, b) => {
      const typeA = typeOrder[a.componentType];
      const typeB = typeOrder[b.componentType];
      if (typeA !== typeB) return typeA - typeB;
      return a.displayOrder - b.displayOrder;
    });

    return {
      financialYear: fyRef.value,
      incomeSourceId: sourceId,
      employerName,
      rows,
      paidDays,
      totalPaidDays: paidDays.reduce((sum: number, v) => sum + (v || 0), 0),
      grossEarnings,
      totalGrossEarnings: grossEarnings.reduce((sum: number, v) => sum + (v || 0), 0),
      totalDeductions: totalDeductionsArr,
      totalTotalDeductions: totalDeductionsArr.reduce((sum: number, v) => sum + (v || 0), 0),
      netSalary: netSalaryArr,
      totalNetSalary: netSalaryArr.reduce((sum: number, v) => sum + (v || 0), 0),
    };
  });

  return {
    gridData,
    isLoading,
    error,
  };
}

// ===== EMPLOYER SUMMARY CARDS =====

// Get employer salary summaries for cards view
export function useEmployerSalarySummaries(financialYear?: string): {
  summaries: ComputedRef<EmployerSalarySummary[]>;
  isLoading: ComputedRef<boolean>;
  error: ComputedRef<Error | null>;
} {
  const fyRef = computed(() => financialYear || selectedFinancialYear.value);
  const { data: history, isLoading: historyLoading, error: historyError } = useSalaryHistory(fyRef.value);
  const { data: sources, isLoading: sourcesLoading, error: sourcesError } = useSalaryIncomeSources(fyRef.value);

  const isLoading = computed(() => historyLoading.value || sourcesLoading.value);
  const error = computed(() => historyError.value || sourcesError.value);

  const summaries = computed<EmployerSalarySummary[]>(() => {
    if (!sources.value) return [];

    return sources.value.map((source) => {
      const records = history.value?.filter((r) => r.incomeSourceId === source.id) || [];
      const grossEarnings = records.reduce((sum, r) => sum + r.grossEarnings, 0);
      const totalDeductions = records.reduce((sum, r) => sum + r.totalDeductions, 0);
      const netSalary = records.reduce((sum, r) => sum + r.netSalary, 0);

      return {
        incomeSource: source,
        monthsRecorded: records.length,
        totalMonths: 12,
        grossEarnings,
        totalDeductions,
        netSalary,
        completionPercentage: Math.round((records.length / 12) * 100),
      };
    });
  });

  return {
    summaries,
    isLoading,
    error,
  };
}

// ===== UTILITY FUNCTIONS =====

// Get FY month index from calendar month/year
export function getFYMonthIndex(calendarMonth: number, calendarYear: number, financialYear: string): number {
  // calendarMonth: 1-12 (Jan-Dec)
  // Returns: 0-11 (Apr-Mar FY index)
  const [fyStartYear] = financialYear.split("-").map(Number);

  if (calendarMonth >= 4) {
    // Apr-Dec: same year as FY start
    return calendarMonth - 4; // Apr=0, Dec=8
  } else {
    // Jan-Mar: next year (FY end year)
    return calendarMonth + 8; // Jan=9, Feb=10, Mar=11
  }
}

// Get calendar month/year from FY month index
export function getCalendarMonthYear(fyMonthIndex: number, financialYear: string): { month: number; year: number } {
  const [fyStartYear, fyEndYearShort] = financialYear.split("-").map(Number);
  const fyEndYear = fyEndYearShort < 100 ? 2000 + fyEndYearShort : fyEndYearShort;

  if (fyMonthIndex < 9) {
    // Apr-Dec (index 0-8)
    return { month: fyMonthIndex + 4, year: fyStartYear };
  } else {
    // Jan-Mar (index 9-11)
    return { month: fyMonthIndex - 8, year: fyEndYear };
  }
}

// Get FY month label with year
export function getFYMonthLabel(fyMonthIndex: number, financialYear: string): string {
  const { month, year } = getCalendarMonthYear(fyMonthIndex, financialYear);
  const monthInfo = FY_MONTHS.find((m) => m.value === fyMonthIndex + 1);
  return `${monthInfo?.shortLabel || ""}'${String(year).slice(-2)}`;
}
