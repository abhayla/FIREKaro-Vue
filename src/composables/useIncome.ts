// Non-Salary Income Vue Query Composables
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { computed } from "vue";
import type {
  IncomeSource,
  BusinessIncome,
  BusinessIncomeInput,
  RentalIncome,
  RentalIncomeInput,
  CapitalGain,
  CapitalGainInput,
  OtherIncome,
  OtherIncomeInput,
  IncomeSummary,
  InterestIncome,
  InterestIncomeInput,
  InterestIncomeSummary,
  DividendIncome,
  DividendIncomeInput,
  DividendIncomeSummary,
} from "@/types/income";
import {
  useFinancialYear,
  formatINR,
  formatINRLakhs,
} from "@/composables/useSalary";

// Re-export formatting helpers
export { formatINR, formatINRLakhs };

// ============================================
// Income Sources (Generic)
// ============================================

export function useIncomeSources(financialYear?: string) {
  const { selectedFinancialYear } = useFinancialYear();
  const fy = financialYear || selectedFinancialYear.value;

  return useQuery({
    queryKey: ["income", "sources", fy],
    queryFn: async (): Promise<IncomeSource[]> => {
      const res = await fetch(`/api/income-sources?fy=${fy}`);
      if (!res.ok) {
        throw new Error("Failed to fetch income sources");
      }
      return res.json();
    },
  });
}

export function useAddIncomeSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<IncomeSource>): Promise<IncomeSource> => {
      const res = await fetch("/api/income-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to add income source");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income"] });
    },
  });
}

export function useUpdateIncomeSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<IncomeSource>;
    }): Promise<IncomeSource> => {
      const res = await fetch(`/api/income-sources/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update income source");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income"] });
    },
  });
}

export function useDeleteIncomeSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(`/api/income-sources/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete income source");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income"] });
    },
  });
}

// ============================================
// Business Income (44AD/44ADA)
// ============================================

export function useBusinessIncome(financialYear?: string) {
  const { selectedFinancialYear } = useFinancialYear();
  const fy = financialYear || selectedFinancialYear.value;

  return useQuery({
    queryKey: ["income", "business", fy],
    queryFn: async (): Promise<BusinessIncome[]> => {
      const res = await fetch(`/api/business-income?fy=${fy}`);
      if (!res.ok) {
        throw new Error("Failed to fetch business income");
      }
      return res.json();
    },
  });
}

export function useAddBusinessIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BusinessIncomeInput): Promise<BusinessIncome> => {
      const res = await fetch("/api/business-income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to add business income");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income", "business"] });
      queryClient.invalidateQueries({ queryKey: ["income", "summary"] });
    },
  });
}

export function useUpdateBusinessIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<BusinessIncomeInput>;
    }): Promise<BusinessIncome> => {
      const res = await fetch(`/api/business-income/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update business income");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income", "business"] });
      queryClient.invalidateQueries({ queryKey: ["income", "summary"] });
    },
  });
}

export function useDeleteBusinessIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(`/api/business-income/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete business income");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income", "business"] });
      queryClient.invalidateQueries({ queryKey: ["income", "summary"] });
    },
  });
}

// ============================================
// Rental Income (House Property)
// ============================================

export function useRentalIncome(financialYear?: string) {
  const { selectedFinancialYear } = useFinancialYear();
  const fy = financialYear || selectedFinancialYear.value;

  return useQuery({
    queryKey: ["income", "rental", fy],
    queryFn: async (): Promise<RentalIncome[]> => {
      const res = await fetch(`/api/rental-income?fy=${fy}`);
      if (!res.ok) {
        throw new Error("Failed to fetch rental income");
      }
      return res.json();
    },
  });
}

export function useAddRentalIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RentalIncomeInput): Promise<RentalIncome> => {
      const res = await fetch("/api/rental-income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to add rental income");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income", "rental"] });
      queryClient.invalidateQueries({ queryKey: ["income", "summary"] });
    },
  });
}

export function useUpdateRentalIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<RentalIncomeInput>;
    }): Promise<RentalIncome> => {
      const res = await fetch(`/api/rental-income/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update rental income");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income", "rental"] });
      queryClient.invalidateQueries({ queryKey: ["income", "summary"] });
    },
  });
}

export function useDeleteRentalIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(`/api/rental-income/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete rental income");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income", "rental"] });
      queryClient.invalidateQueries({ queryKey: ["income", "summary"] });
    },
  });
}

// ============================================
// Capital Gains
// ============================================

export function useCapitalGains(financialYear?: string) {
  const { selectedFinancialYear } = useFinancialYear();
  const fy = financialYear || selectedFinancialYear.value;

  return useQuery({
    queryKey: ["income", "capital-gains", fy],
    queryFn: async (): Promise<CapitalGain[]> => {
      const res = await fetch(`/api/capital-gains?fy=${fy}`);
      if (!res.ok) {
        throw new Error("Failed to fetch capital gains");
      }
      return res.json();
    },
  });
}

export function useAddCapitalGain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CapitalGainInput): Promise<CapitalGain> => {
      const res = await fetch("/api/capital-gains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to add capital gain");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income", "capital-gains"] });
      queryClient.invalidateQueries({ queryKey: ["income", "summary"] });
    },
  });
}

export function useUpdateCapitalGain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CapitalGainInput>;
    }): Promise<CapitalGain> => {
      const res = await fetch(`/api/capital-gains/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update capital gain");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income", "capital-gains"] });
      queryClient.invalidateQueries({ queryKey: ["income", "summary"] });
    },
  });
}

export function useDeleteCapitalGain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(`/api/capital-gains/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete capital gain");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income", "capital-gains"] });
      queryClient.invalidateQueries({ queryKey: ["income", "summary"] });
    },
  });
}

// Capital Gains Summary
export function useCapitalGainsSummary(financialYear?: string) {
  const {
    data: capitalGains,
    isLoading,
    error,
  } = useCapitalGains(financialYear);

  const summary = computed(() => {
    if (!capitalGains.value || capitalGains.value.length === 0) {
      return null;
    }

    const stcgGains = capitalGains.value
      .filter((cg) => cg.gainType === "STCG")
      .reduce((sum, cg) => sum + cg.taxableGain, 0);

    const ltcgGains = capitalGains.value
      .filter((cg) => cg.gainType === "LTCG")
      .reduce((sum, cg) => sum + cg.taxableGain, 0);

    const totalTax = capitalGains.value.reduce(
      (sum, cg) => sum + cg.estimatedTax,
      0,
    );

    return {
      totalTransactions: capitalGains.value.length,
      stcgTotal: stcgGains,
      ltcgTotal: ltcgGains,
      totalGains: stcgGains + ltcgGains,
      estimatedTax: totalTax,
    };
  });

  return { summary, isLoading, error };
}

// ============================================
// Other Income (Interest, Dividends, etc.)
// ============================================

export function useOtherIncome(financialYear?: string) {
  const { selectedFinancialYear } = useFinancialYear();
  const fy = financialYear || selectedFinancialYear.value;

  return useQuery({
    queryKey: ["income", "other", fy],
    queryFn: async (): Promise<OtherIncome[]> => {
      const res = await fetch(`/api/other-income?fy=${fy}`);
      if (!res.ok) {
        throw new Error("Failed to fetch other income");
      }
      return res.json();
    },
  });
}

export function useAddOtherIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: OtherIncomeInput): Promise<OtherIncome> => {
      const res = await fetch("/api/other-income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to add other income");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income", "other"] });
      queryClient.invalidateQueries({ queryKey: ["income", "summary"] });
    },
  });
}

export function useUpdateOtherIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<OtherIncomeInput>;
    }): Promise<OtherIncome> => {
      const res = await fetch(`/api/other-income/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update other income");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income", "other"] });
      queryClient.invalidateQueries({ queryKey: ["income", "summary"] });
    },
  });
}

export function useDeleteOtherIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(`/api/other-income/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete other income");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income", "other"] });
      queryClient.invalidateQueries({ queryKey: ["income", "summary"] });
    },
  });
}

// ============================================
// Income Summary (Aggregated)
// ============================================

export function useIncomeSummary(financialYear?: string) {
  const { selectedFinancialYear } = useFinancialYear();
  const fy = financialYear || selectedFinancialYear.value;

  // Fetch all income types
  const { data: businessData, isLoading: businessLoading } =
    useBusinessIncome(fy);
  const { data: rentalData, isLoading: rentalLoading } = useRentalIncome(fy);
  const { data: capitalGainsData, isLoading: cgLoading } = useCapitalGains(fy);
  const { data: otherData, isLoading: otherLoading } = useOtherIncome(fy);

  const isLoading = computed(
    () =>
      businessLoading.value ||
      rentalLoading.value ||
      cgLoading.value ||
      otherLoading.value,
  );

  const summary = computed((): IncomeSummary | null => {
    const businessIncome =
      businessData.value?.reduce((sum, b) => sum + b.deemedProfit, 0) || 0;
    const rentalIncome =
      rentalData.value?.reduce((sum, r) => sum + r.netAnnualValue, 0) || 0;
    const capitalGains =
      capitalGainsData.value?.reduce((sum, cg) => sum + cg.taxableGain, 0) || 0;

    // Categorize other income
    const interest =
      otherData.value
        ?.filter((o) => o.category === "interest")
        .reduce((sum, o) => sum + o.grossAmount, 0) || 0;

    const dividends =
      otherData.value
        ?.filter((o) => o.category === "dividend")
        .reduce((sum, o) => sum + o.grossAmount, 0) || 0;

    const otherIncome =
      otherData.value
        ?.filter((o) => !["interest", "dividend"].includes(o.category))
        .reduce((sum, o) => sum + o.grossAmount, 0) || 0;

    const totalTds =
      otherData.value?.reduce((sum, o) => sum + o.tdsDeducted, 0) || 0;

    const totalGross =
      businessIncome +
      rentalIncome +
      capitalGains +
      interest +
      dividends +
      otherIncome;

    return {
      financialYear: fy,
      salaryIncome: 0, // Will be populated from salary composable if needed
      businessIncome,
      rentalIncome,
      capitalGains,
      interestIncome: interest,
      dividendIncome: dividends,
      otherIncome,
      totalGrossIncome: totalGross,
      totalDeductions: 0, // Calculate from 80TTA, etc.
      totalTaxableIncome: totalGross,
      totalTdsDeducted: totalTds,
      businessCount: businessData.value?.length || 0,
      rentalCount: rentalData.value?.length || 0,
      capitalGainTransactions: capitalGainsData.value?.length || 0,
      otherSourcesCount: otherData.value?.length || 0,
    };
  });

  return { summary, isLoading };
}

// ============================================
// Interest Income (Dedicated API)
// ============================================

interface InterestIncomeResponse {
  success: boolean;
  data: {
    records: InterestIncome[];
    summary: InterestIncomeSummary;
  };
}

export function useInterestIncomeAPI(financialYear?: string) {
  const { selectedFinancialYear } = useFinancialYear();
  const fy = financialYear || selectedFinancialYear.value;

  return useQuery({
    queryKey: ["income", "interest", fy],
    queryFn: async (): Promise<InterestIncomeResponse["data"]> => {
      const res = await fetch(`/api/interest-income?financialYear=${fy}`);
      if (!res.ok) {
        throw new Error("Failed to fetch interest income");
      }
      const json: InterestIncomeResponse = await res.json();
      return json.data;
    },
  });
}

export function useAddInterestIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InterestIncomeInput): Promise<InterestIncome> => {
      const res = await fetch("/api/interest-income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to add interest income");
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income", "interest"] });
      queryClient.invalidateQueries({ queryKey: ["income", "summary"] });
    },
  });
}

export function useUpdateInterestIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<InterestIncomeInput>;
    }): Promise<InterestIncome> => {
      const res = await fetch(`/api/interest-income/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update interest income");
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income", "interest"] });
      queryClient.invalidateQueries({ queryKey: ["income", "summary"] });
    },
  });
}

export function useDeleteInterestIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(`/api/interest-income/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete interest income");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income", "interest"] });
      queryClient.invalidateQueries({ queryKey: ["income", "summary"] });
    },
  });
}

// FD Maturity Calendar
interface CalendarRecord {
  id: string;
  sourceType: string;
  institutionName: string;
  accountNumber?: string;
  principalAmount?: number;
  interestRate?: number;
  maturityDate: string;
  maturityAmount?: number;
  isAutoRenew: boolean;
}

interface CalendarResponse {
  success: boolean;
  data: {
    records: CalendarRecord[];
    byMonth: Record<string, CalendarRecord[]>;
  };
}

export function useFDMaturityCalendar(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["income", "interest", "calendar", startDate, endDate],
    queryFn: async (): Promise<CalendarResponse["data"]> => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(`/api/interest-income/calendar?${params}`);
      if (!res.ok) {
        throw new Error("Failed to fetch FD maturity calendar");
      }
      const json: CalendarResponse = await res.json();
      return json.data;
    },
  });
}

// ============================================
// Dividend Income (Dedicated API)
// ============================================

interface DividendIncomeResponse {
  success: boolean;
  data: {
    records: DividendIncome[];
    summary: DividendIncomeSummary;
  };
}

export function useDividendIncomeAPI(financialYear?: string) {
  const { selectedFinancialYear } = useFinancialYear();
  const fy = financialYear || selectedFinancialYear.value;

  return useQuery({
    queryKey: ["income", "dividend", fy],
    queryFn: async (): Promise<DividendIncomeResponse["data"]> => {
      const res = await fetch(`/api/dividend-income?financialYear=${fy}`);
      if (!res.ok) {
        throw new Error("Failed to fetch dividend income");
      }
      const json: DividendIncomeResponse = await res.json();
      return json.data;
    },
  });
}

export function useAddDividendIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DividendIncomeInput): Promise<DividendIncome> => {
      const res = await fetch("/api/dividend-income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to add dividend income");
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income", "dividend"] });
      queryClient.invalidateQueries({ queryKey: ["income", "summary"] });
    },
  });
}

export function useUpdateDividendIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<DividendIncomeInput>;
    }): Promise<DividendIncome> => {
      const res = await fetch(`/api/dividend-income/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update dividend income");
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income", "dividend"] });
      queryClient.invalidateQueries({ queryKey: ["income", "summary"] });
    },
  });
}

export function useDeleteDividendIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(`/api/dividend-income/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete dividend income");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income", "dividend"] });
      queryClient.invalidateQueries({ queryKey: ["income", "summary"] });
    },
  });
}

// ============================================
// Legacy: Other Income by Category (filters from other-income API)
// NOTE: These are kept for backwards compatibility with the 'other' income page
// For dedicated pages, use useInterestIncomeAPI and useDividendIncomeAPI
// ============================================

export function useInterestIncome(financialYear?: string) {
  const { data: otherData, isLoading, error } = useOtherIncome(financialYear);

  const interestIncome = computed(() => {
    if (!otherData.value) return [];
    return otherData.value.filter((o) => o.category === "interest");
  });

  const summary = computed(() => {
    if (!interestIncome.value.length) return null;

    const fdRd = interestIncome.value
      .filter((i) => i.subcategory === "fd" || i.subcategory === "rd")
      .reduce((sum, i) => sum + i.grossAmount, 0);

    const savings = interestIncome.value
      .filter((i) => i.subcategory === "savings")
      .reduce((sum, i) => sum + i.grossAmount, 0);

    const p2p = interestIncome.value
      .filter((i) => i.subcategory === "p2p")
      .reduce((sum, i) => sum + i.grossAmount, 0);

    const other = interestIncome.value
      .filter(
        (i) => !["fd", "rd", "savings", "p2p"].includes(i.subcategory || ""),
      )
      .reduce((sum, i) => sum + i.grossAmount, 0);

    const totalTds = interestIncome.value.reduce(
      (sum, i) => sum + i.tdsDeducted,
      0,
    );

    // 80TTA/80TTB eligible savings interest (capped)
    const eligible80TTA = Math.min(savings, 10000); // ₹10,000 cap
    const eligible80TTB = Math.min(savings, 50000); // ₹50,000 cap for seniors

    return {
      fdRdInterest: fdRd,
      savingsInterest: savings,
      p2pInterest: p2p,
      otherInterest: other,
      totalInterest: fdRd + savings + p2p + other,
      tdsDeducted: totalTds,
      deduction80TTA: eligible80TTA,
      deduction80TTB: eligible80TTB,
    };
  });

  return { interestIncome, summary, isLoading, error };
}

export function useDividendIncome(financialYear?: string) {
  const { data: otherData, isLoading, error } = useOtherIncome(financialYear);

  const dividendIncome = computed(() => {
    if (!otherData.value) return [];
    return otherData.value.filter((o) => o.category === "dividend");
  });

  const summary = computed(() => {
    if (!dividendIncome.value.length) return null;

    const stockDividends = dividendIncome.value
      .filter((d) => d.subcategory === "stock")
      .reduce((sum, d) => sum + d.grossAmount, 0);

    const mfDividends = dividendIncome.value
      .filter((d) => d.subcategory === "mf")
      .reduce((sum, d) => sum + d.grossAmount, 0);

    const totalTds = dividendIncome.value.reduce(
      (sum, d) => sum + d.tdsDeducted,
      0,
    );

    return {
      stockDividends,
      mfDividends,
      totalDividends: stockDividends + mfDividends,
      tdsDeducted: totalTds,
    };
  });

  return { dividendIncome, summary, isLoading, error };
}
