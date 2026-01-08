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

// Generate financial year options (current + 2 previous years)
function generateFinancialYearOptions(): string[] {
  const current = getCurrentFinancialYear();
  const [startYear] = current.split("-").map(Number);
  const options: string[] = [];

  for (let i = 0; i < 3; i++) {
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

// Fetch salary history
export function useSalaryHistory(financialYear?: string) {
  const fy = financialYear || selectedFinancialYear.value;

  return useQuery({
    queryKey: ["salary", "history", fy],
    queryFn: async (): Promise<SalaryHistoryRecord[]> => {
      const url = fy ? `/api/salary-history?fy=${fy}` : "/api/salary-history";
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to fetch salary history");
      }
      return res.json();
    },
  });
}

// Add salary history record
export function useAddSalaryHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: SalaryHistoryInput,
    ): Promise<SalaryHistoryRecord> => {
      const res = await fetch("/api/salary-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
