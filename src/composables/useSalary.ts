// Salary Vue Query Composables
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { ref, computed } from "vue";
import type {
  CurrentSalary,
  SalaryHistoryRecord,
  SalaryHistoryInput,
  SalarySummary,
} from "@/types/salary";
import { getCurrentFinancialYear } from "@/types/salary";

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
    basicSalary: (entry.basicSalary as number) || 0,
    hra: (entry.houseRentAllowance as number) || 0,
    conveyanceAllowance: (entry.conveyanceAllowance as number) || 0,
    medicalAllowance: (entry.medicalAllowance as number) || 0,
    specialAllowance: ((entry.otherEarnings as Record<string, number>)?.specialAllowance) || 0,
    specialPay: ((entry.otherEarnings as Record<string, number>)?.specialPay) || 0,
    otherAllowances: ((entry.otherEarnings as Record<string, number>)?.otherAllowances) || 0,
    grossEarnings: (entry.grossSalary as number) || 0,
    epfDeduction: (entry.employeePF as number) || 0,
    vpfDeduction: (entry.voluntaryPF as number) || 0,
    professionalTax: (entry.professionalTax as number) || 0,
    tdsDeduction: (entry.incomeTax as number) || 0,
    otherDeductions: ((entry.otherDeductions as Record<string, number>)?.other) || 0,
    totalDeductions: (entry.totalDeductions as number) || 0,
    netSalary: (entry.netSalary as number) || 0,
    paidDays: (entry.paidDays as number) || 30,
    employerPf: (entry.employerPF as number) || 0,
    employerNps: (entry.npsContribution as number) || 0,
    pensionFund: (entry.pensionFund as number) || 0,
    superannuation: (entry.superannuation as number) || 0,
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
