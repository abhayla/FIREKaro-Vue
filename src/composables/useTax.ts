/**
 * Tax Planning Composables
 * Vue Query hooks for tax calculation and planning
 */

import { computed, type Ref } from "vue";
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { useFinancialYear } from "./useSalary";
import type {
  TaxRegime,
  TaxCalculationResult,
  RegimeComparison,
  Deduction,
  DeductionInput,
  DeductionSummary,
  Exemption,
  TaxOptimizationSuggestion,
  ITRRecommendation,
  TaxSummary,
  AdvanceTaxEstimate,
  TaxScenario,
  TaxSlab,
  DEDUCTION_LIMITS,
} from "@/types/tax";
import {
  getTaxSlabs,
  calculateTaxOnIncome,
  calculateSurcharge,
  calculateCess,
  OLD_REGIME_SLABS,
  NEW_REGIME_SLABS_2024,
  CESS_RATE,
} from "@/types/tax";

// Re-export formatting utilities
export { formatINR, formatINRLakhs } from "./useIncome";

// ============ Tax Calculation ============

interface TaxCalculationParams {
  grossIncome: number;
  deductions: number;
  regime: TaxRegime;
  isSenior?: boolean;
}

/**
 * Calculate tax for a given income and deductions
 */
export function calculateTax(
  params: TaxCalculationParams,
): TaxCalculationResult {
  const { grossIncome, deductions, regime, isSenior = false } = params;

  // Standard deduction
  const standardDeduction = regime === "NEW" ? 75000 : 50000;

  // Total deductions (only standard deduction for new regime)
  const totalDeductions =
    regime === "NEW" ? standardDeduction : deductions + standardDeduction;

  // Taxable income
  const taxableIncome = Math.max(0, grossIncome - totalDeductions);

  // Get slabs and calculate base tax
  const slabs = getTaxSlabs(regime);
  const taxOnIncome = calculateTaxOnIncome(taxableIncome, slabs);

  // Rebate u/s 87A (for income up to Rs.7L in new regime, Rs.5L in old regime)
  let rebate = 0;
  if (regime === "NEW" && taxableIncome <= 700000) {
    rebate = Math.min(taxOnIncome, 25000);
  } else if (regime === "OLD" && taxableIncome <= 500000) {
    rebate = Math.min(taxOnIncome, 12500);
  }

  const taxAfterRebate = taxOnIncome - rebate;

  // Surcharge
  const surcharge = calculateSurcharge(taxAfterRebate, taxableIncome, regime);

  // Health & Education Cess
  const healthEducationCess = calculateCess(taxAfterRebate + surcharge);

  // Total tax
  const totalTaxLiability = taxAfterRebate + surcharge + healthEducationCess;

  // Effective rate
  const effectiveRate =
    grossIncome > 0 ? (totalTaxLiability / grossIncome) * 100 : 0;

  // Slab breakdown
  const slabBreakdown = generateSlabBreakdown(taxableIncome, slabs);

  // Deduction breakdown
  const deductionBreakdown = generateDeductionBreakdown(deductions, regime);

  return {
    regime,
    grossTotalIncome: grossIncome,
    totalDeductions,
    taxableIncome,
    taxOnIncome,
    surcharge,
    healthEducationCess,
    totalTaxLiability,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    slabBreakdown,
    deductionBreakdown,
  };
}

function generateSlabBreakdown(taxableIncome: number, slabs: TaxSlab[]) {
  const breakdown = [];
  let remainingIncome = taxableIncome;
  let prevMax = 0;

  for (const slab of slabs) {
    if (remainingIncome <= 0) break;

    const slabMin = prevMax;
    const slabMax = slab.max || Infinity;
    const slabIncome = Math.min(remainingIncome, slabMax - slabMin);

    if (slabIncome > 0) {
      breakdown.push({
        slab: slab.max
          ? `${formatCurrency(slabMin)} - ${formatCurrency(slab.max)}`
          : `Above ${formatCurrency(slabMin)}`,
        income: slabIncome,
        rate: slab.rate * 100,
        tax: Math.round(slabIncome * slab.rate),
      });
    }

    remainingIncome -= slabIncome;
    prevMax = slab.max || prevMax;
  }

  return breakdown;
}

function generateDeductionBreakdown(
  totalDeductions: number,
  regime: TaxRegime,
) {
  if (regime === "NEW") {
    return [
      {
        section: "Standard",
        label: "Standard Deduction",
        claimed: 75000,
        limit: 75000,
        allowed: 75000,
      },
    ];
  }

  // For old regime, show detailed breakdown
  return [
    {
      section: "Standard",
      label: "Standard Deduction",
      claimed: 50000,
      limit: 50000,
      allowed: 50000,
    },
    {
      section: "80C",
      label: "Section 80C",
      claimed: 0,
      limit: 150000,
      allowed: 0,
    },
    {
      section: "80D",
      label: "Health Insurance",
      claimed: 0,
      limit: 25000,
      allowed: 0,
    },
    {
      section: "80CCD(1B)",
      label: "NPS (Additional)",
      claimed: 0,
      limit: 50000,
      allowed: 0,
    },
  ];
}

function formatCurrency(amount: number): string {
  if (amount >= 10000000) {
    return `${(amount / 10000000).toFixed(1)}Cr`;
  }
  if (amount >= 100000) {
    return `${(amount / 100000).toFixed(1)}L`;
  }
  return amount.toLocaleString("en-IN");
}

/**
 * Compare old and new tax regimes
 */
export function compareRegimes(
  grossIncome: number,
  oldRegimeDeductions: number,
): RegimeComparison {
  const oldRegime = calculateTax({
    grossIncome,
    deductions: oldRegimeDeductions,
    regime: "OLD",
  });

  const newRegime = calculateTax({
    grossIncome,
    deductions: 0, // New regime doesn't allow most deductions
    regime: "NEW",
  });

  const betterRegime =
    oldRegime.totalTaxLiability <= newRegime.totalTaxLiability ? "OLD" : "NEW";
  const savingsAmount = Math.abs(
    oldRegime.totalTaxLiability - newRegime.totalTaxLiability,
  );
  const maxTax = Math.max(
    oldRegime.totalTaxLiability,
    newRegime.totalTaxLiability,
  );
  const savingsPercentage = maxTax > 0 ? (savingsAmount / maxTax) * 100 : 0;

  return {
    financialYear: "", // Will be filled by caller
    oldRegime,
    newRegime,
    betterRegime,
    savingsAmount,
    savingsPercentage: Math.round(savingsPercentage * 100) / 100,
  };
}

// ============ API Hooks ============

/**
 * Fetch tax calculation from API
 */
export function useTaxCalculation(regime?: Ref<TaxRegime>) {
  const { selectedFinancialYear } = useFinancialYear();

  return useQuery({
    queryKey: ["tax", "calculation", selectedFinancialYear, regime?.value],
    queryFn: async () => {
      const params = new URLSearchParams({
        financialYear: selectedFinancialYear.value,
        ...(regime?.value && { regime: regime.value }),
      });
      const res = await fetch(`/api/tax-planning/calculate?${params}`);
      if (!res.ok) throw new Error("Failed to fetch tax calculation");
      return res.json() as Promise<TaxCalculationResult>;
    },
  });
}

/**
 * Fetch regime comparison
 */
export function useTaxComparison() {
  const { selectedFinancialYear } = useFinancialYear();

  return useQuery({
    queryKey: ["tax", "comparison", selectedFinancialYear],
    queryFn: async () => {
      const res = await fetch(
        `/api/tax-planning/comparison?financialYear=${selectedFinancialYear.value}`,
      );
      if (!res.ok) throw new Error("Failed to fetch tax comparison");
      return res.json() as Promise<RegimeComparison>;
    },
  });
}

/**
 * Fetch deductions list
 */
export function useDeductions() {
  const { selectedFinancialYear } = useFinancialYear();

  return useQuery({
    queryKey: ["tax", "deductions", selectedFinancialYear],
    queryFn: async () => {
      const res = await fetch(
        `/api/tax/deductions?financialYear=${selectedFinancialYear.value}`,
      );
      if (!res.ok) throw new Error("Failed to fetch deductions");
      return res.json() as Promise<Deduction[]>;
    },
  });
}

/**
 * Fetch deduction summary
 */
export function useDeductionSummary() {
  const { selectedFinancialYear } = useFinancialYear();

  return useQuery({
    queryKey: ["tax", "deductions", "summary", selectedFinancialYear],
    queryFn: async () => {
      const res = await fetch(
        `/api/tax/deductions/summary?financialYear=${selectedFinancialYear.value}`,
      );
      if (!res.ok) throw new Error("Failed to fetch deduction summary");
      return res.json() as Promise<DeductionSummary>;
    },
  });
}

/**
 * Add deduction mutation
 */
export function useAddDeduction() {
  const queryClient = useQueryClient();
  const { selectedFinancialYear } = useFinancialYear();

  return useMutation({
    mutationFn: async (data: DeductionInput) => {
      const res = await fetch("/api/tax/deductions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          financialYear: selectedFinancialYear.value,
        }),
      });
      if (!res.ok) throw new Error("Failed to add deduction");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax", "deductions"] });
      queryClient.invalidateQueries({ queryKey: ["tax", "calculation"] });
      queryClient.invalidateQueries({ queryKey: ["tax", "comparison"] });
    },
  });
}

/**
 * Update deduction mutation
 */
export function useUpdateDeduction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<DeductionInput>;
    }) => {
      const res = await fetch(`/api/tax/deductions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update deduction");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax", "deductions"] });
      queryClient.invalidateQueries({ queryKey: ["tax", "calculation"] });
      queryClient.invalidateQueries({ queryKey: ["tax", "comparison"] });
    },
  });
}

/**
 * Delete deduction mutation
 */
export function useDeleteDeduction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tax/deductions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete deduction");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax", "deductions"] });
      queryClient.invalidateQueries({ queryKey: ["tax", "calculation"] });
      queryClient.invalidateQueries({ queryKey: ["tax", "comparison"] });
    },
  });
}

/**
 * Fetch exemptions
 */
export function useExemptions() {
  const { selectedFinancialYear } = useFinancialYear();

  return useQuery({
    queryKey: ["tax", "exemptions", selectedFinancialYear],
    queryFn: async () => {
      const res = await fetch(
        `/api/tax/exemptions?financialYear=${selectedFinancialYear.value}`,
      );
      if (!res.ok) throw new Error("Failed to fetch exemptions");
      return res.json() as Promise<Exemption[]>;
    },
  });
}

/**
 * Fetch tax optimization suggestions
 */
export function useTaxOptimizations() {
  const { selectedFinancialYear } = useFinancialYear();

  return useQuery({
    queryKey: ["tax", "optimizations", selectedFinancialYear],
    queryFn: async () => {
      const res = await fetch(
        `/api/tax-planning/optimization?financialYear=${selectedFinancialYear.value}`,
      );
      if (!res.ok) throw new Error("Failed to fetch optimizations");
      return res.json() as Promise<TaxOptimizationSuggestion[]>;
    },
  });
}

/**
 * Fetch ITR recommendation
 */
export function useITRRecommendation() {
  const { selectedFinancialYear } = useFinancialYear();

  return useQuery({
    queryKey: ["tax", "itr", selectedFinancialYear],
    queryFn: async () => {
      const res = await fetch(
        `/api/tax-planning/itr-summary?financialYear=${selectedFinancialYear.value}`,
      );
      if (!res.ok) throw new Error("Failed to fetch ITR recommendation");
      return res.json() as Promise<ITRRecommendation>;
    },
  });
}

/**
 * Fetch tax summary for dashboard
 */
export function useTaxSummary() {
  const { selectedFinancialYear } = useFinancialYear();

  return useQuery({
    queryKey: ["tax", "summary", selectedFinancialYear],
    queryFn: async () => {
      const res = await fetch(
        `/api/tax-planning/summary?financialYear=${selectedFinancialYear.value}`,
      );
      if (!res.ok) throw new Error("Failed to fetch tax summary");
      return res.json() as Promise<TaxSummary>;
    },
  });
}

/**
 * Fetch advance tax estimate
 */
export function useAdvanceTaxEstimate() {
  const { selectedFinancialYear } = useFinancialYear();

  return useQuery({
    queryKey: ["tax", "advance-tax", selectedFinancialYear],
    queryFn: async () => {
      const res = await fetch(
        `/api/advance-tax?financialYear=${selectedFinancialYear.value}`,
      );
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to fetch advance tax estimate");
      }
      const data = await res.json();
      return data.estimates?.[0] ?? null;
    },
  });
}

/**
 * Create advance tax estimate
 */
export function useCreateAdvanceTaxEstimate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      financialYear: string;
      selectedRegime: string;
    }) => {
      const res = await fetch("/api/advance-tax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create advance tax estimate");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax", "advance-tax"] });
    },
  });
}

/**
 * Recalculate advance tax
 */
export function useRecalculateAdvanceTax() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (estimateId: string) => {
      const res = await fetch(`/api/advance-tax/${estimateId}/calculate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to recalculate advance tax");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax", "advance-tax"] });
    },
  });
}

/**
 * Fetch advance tax payments
 */
export function useAdvanceTaxPayments() {
  const { selectedFinancialYear } = useFinancialYear();
  const { data: estimate } = useAdvanceTaxEstimate();

  return useQuery({
    queryKey: computed(() => ["tax", "advance-tax", "payments", estimate.value?.id]),
    queryFn: async () => {
      if (!estimate.value?.id) return [];
      const res = await fetch(`/api/advance-tax/${estimate.value.id}/payments`);
      if (!res.ok) throw new Error("Failed to fetch payments");
      const data = await res.json();
      return data.payments ?? [];
    },
    enabled: computed(() => !!estimate.value?.id),
  });
}

/**
 * Add advance tax payment
 */
export function useAddAdvanceTaxPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      estimateId: string;
      paymentDate: string;
      amount: number;
      quarter: number;
      challanSerialNumber: string;
      bsrCode: string;
      bankName?: string;
      notes?: string;
    }) => {
      const { estimateId, ...paymentData } = data;
      const res = await fetch(`/api/advance-tax/${estimateId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });
      if (!res.ok) throw new Error("Failed to add payment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax", "advance-tax"] });
    },
  });
}

/**
 * Delete advance tax payment
 */
export function useDeleteAdvanceTaxPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { estimateId: string; paymentId: string }) => {
      const res = await fetch(
        `/api/advance-tax/${data.estimateId}/payments/${data.paymentId}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Failed to delete payment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax", "advance-tax"] });
    },
  });
}

/**
 * Fetch tax scenarios
 */
export function useTaxScenarios() {
  const { selectedFinancialYear } = useFinancialYear();

  return useQuery({
    queryKey: ["tax", "scenarios", selectedFinancialYear],
    queryFn: async () => {
      const res = await fetch(
        `/api/tax-planning/scenarios?financialYear=${selectedFinancialYear.value}`,
      );
      if (!res.ok) {
        if (res.status === 404) return [];
        throw new Error("Failed to fetch scenarios");
      }
      const data = await res.json();
      return data.scenarios ?? [];
    },
  });
}

/**
 * Fetch smart suggestions
 */
export function useSmartSuggestions() {
  const { selectedFinancialYear } = useFinancialYear();

  return useQuery({
    queryKey: ["tax", "scenarios", "suggestions", selectedFinancialYear],
    queryFn: async () => {
      const res = await fetch(
        `/api/tax-planning/scenarios/smart-suggestions?financialYear=${selectedFinancialYear.value}`,
      );
      if (!res.ok) {
        if (res.status === 404) return [];
        throw new Error("Failed to fetch suggestions");
      }
      const data = await res.json();
      return data.suggestions ?? [];
    },
  });
}

/**
 * Create tax scenario
 */
export function useCreateScenario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      financialYear: string;
      name: string;
      description?: string;
      selectedRegime: string;
      incomeAdjustments?: Record<string, number>;
      deductionAdjustments?: Record<string, number>;
      isAutoGenerated?: boolean;
      suggestionReason?: string;
      optimizationCategory?: string;
    }) => {
      const res = await fetch("/api/tax-planning/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create scenario");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax", "scenarios"] });
    },
  });
}

/**
 * Update tax scenario
 */
export function useUpdateScenario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/tax-planning/scenarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update scenario");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax", "scenarios"] });
    },
  });
}

/**
 * Delete tax scenario
 */
export function useDeleteScenario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tax-planning/scenarios/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete scenario");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax", "scenarios"] });
    },
  });
}

/**
 * Create baseline scenario from current data
 */
export function useCreateBaseline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (financialYear: string) => {
      const res = await fetch("/api/tax-planning/scenarios/baseline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ financialYear }),
      });
      if (!res.ok) throw new Error("Failed to create baseline");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax", "scenarios"] });
    },
  });
}

// ============ Computed Helpers ============

/**
 * Get regime recommendation based on comparison
 */
export function useRegimeRecommendation() {
  const { data: comparison, isLoading } = useTaxComparison();

  const recommendation = computed(() => {
    if (!comparison.value) return null;

    const { betterRegime, savingsAmount, savingsPercentage } = comparison.value;

    return {
      regime: betterRegime,
      label: betterRegime === "NEW" ? "New Regime" : "Old Regime",
      savings: savingsAmount,
      savingsPercent: savingsPercentage,
      reason:
        betterRegime === "NEW"
          ? "Lower tax rates and simplified structure benefit you more than available deductions."
          : "Your deductions under 80C, 80D, HRA, etc. result in lower tax liability.",
    };
  });

  return { recommendation, isLoading };
}

/**
 * Format tax amount with sign
 */
export function formatTaxAmount(amount: number): string {
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));

  return amount < 0 ? `-${formatted}` : formatted;
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Get tax slab label
 */
export function getSlabLabel(min: number, max: number | null): string {
  const minStr = formatCurrency(min);
  if (max === null) return `Above ${minStr}`;
  const maxStr = formatCurrency(max);
  return `${minStr} - ${maxStr}`;
}

/**
 * Get deduction section info
 */
export function getDeductionSectionInfo(section: string) {
  const sectionInfo: Record<
    string,
    { label: string; description: string; limit: number }
  > = {
    "80C": {
      label: "Section 80C",
      description: "Investments in PPF, ELSS, LIC, NSC, etc.",
      limit: 150000,
    },
    "80D": {
      label: "Section 80D",
      description: "Health insurance premiums",
      limit: 25000,
    },
    "80CCD(1B)": {
      label: "Section 80CCD(1B)",
      description: "Additional NPS contribution",
      limit: 50000,
    },
    "80E": {
      label: "Section 80E",
      description: "Education loan interest",
      limit: Infinity,
    },
    "80G": {
      label: "Section 80G",
      description: "Donations to approved funds/charities",
      limit: Infinity,
    },
    "80TTA": {
      label: "Section 80TTA",
      description: "Savings account interest",
      limit: 10000,
    },
    "80TTB": {
      label: "Section 80TTB",
      description: "Interest income for senior citizens",
      limit: 50000,
    },
    "24": {
      label: "Section 24",
      description: "Home loan interest",
      limit: 200000,
    },
  };

  return sectionInfo[section] || { label: section, description: "", limit: 0 };
}

// ============ Aggregated Income & Data Completion ============

/**
 * Aggregated tax data from all income sources
 */
export interface AggregatedTaxData {
  // Income by source
  salaryIncome: number;
  businessIncome: number;
  rentalIncome: number;
  capitalGainsSTCG: number;
  capitalGainsLTCG: number;
  interestIncome: number;
  dividendIncome: number;
  otherIncome: number;

  // Totals
  grossTotalIncome: number;

  // TDS
  tdsFromSalary: number;
  tdsFromOther: number;
  totalTDS: number;

  // Deductions utilized
  section80C: number;
  section80D: number;
  section80DSelf: number;
  section80DParents: number;
  section80CCD1B: number;
  section80CCD2: number;
  section24: number;
  section80E: number;
  section80G: number;
  section80TTA: number;
  hraExemption: number;
  totalDeductions: number;

  // Additional data for scenarios
  rentPaid: number;
  hraClaimed: boolean;
  homeLoanExists: boolean;
  homeLoanInterestPaid: number;
  npsEmployeeContribution: number;
  npsEmployerContribution: number;
  unrealizedEquityGains: number;

  // Source counts
  incomeSourceCount: number;
  hasMultipleEmployers: boolean;
  hasForeignIncome: boolean;
  hasBusinessIncome: boolean;
  hasCapitalGains: boolean;
}

/**
 * Data completion status for tax planning
 */
export interface DataCompletionStatus {
  items: DataCompletionItem[];
  completedCount: number;
  totalCount: number;
  percentComplete: number;
}

export interface DataCompletionItem {
  id: string;
  label: string;
  category: 'income' | 'deduction' | 'exemption';
  isComplete: boolean;
  value?: number;
  description?: string;
}

/**
 * Smart suggestion with priority
 */
export interface SmartSuggestionWithPriority {
  id: string;
  type: 'regime' | '80C' | '80D' | '80CCD' | 'hra' | 'sec24' | 'ltcg' | 'advance_tax';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  currentValue: number;
  suggestedValue: number;
  potentialSavings: number;
  basedOn: string;
  action: string;
  actionLabel: string;
  isDismissed?: boolean;
}

/**
 * Hook to aggregate income from all sources for tax calculation
 */
export function useAggregatedIncome() {
  const { selectedFinancialYear } = useFinancialYear();

  // Import data from all sources
  // Note: These hooks need to be imported at the top of the file
  // For now, we'll fetch via API to avoid circular dependencies

  return useQuery({
    queryKey: computed(() => ["tax", "aggregated-income", selectedFinancialYear.value]),
    queryFn: async () => {
      const fy = selectedFinancialYear.value;

      // Fetch all income sources in parallel
      const [
        salaryRes,
        incomeRes,
        investmentsRes,
        insuranceRes,
        liabilitiesRes,
        deductionsRes,
      ] = await Promise.all([
        fetch(`/api/salary/summary?financialYear=${fy}`).then(r => r.ok ? r.json() : null),
        fetch(`/api/income/summary?financialYear=${fy}`).then(r => r.ok ? r.json() : null),
        fetch(`/api/investments/tax-report?financialYear=${fy}`).then(r => r.ok ? r.json() : null),
        fetch(`/api/insurance/summary`).then(r => r.ok ? r.json() : null),
        fetch(`/api/liabilities/overview`).then(r => r.ok ? r.json() : null),
        fetch(`/api/tax/deductions/summary?financialYear=${fy}`).then(r => r.ok ? r.json() : null),
      ]);

      // Aggregate salary data
      const salaryIncome = salaryRes?.totalGross ?? 0;
      const tdsFromSalary = salaryRes?.totalTDS ?? 0;
      const epfContribution = salaryRes?.totalEPF ?? 0;
      const npsEmployerContribution = salaryRes?.npsEmployer ?? 0;
      const hraReceived = salaryRes?.totalHRA ?? 0;

      // Aggregate non-salary income
      const businessIncome = incomeRes?.businessIncome ?? 0;
      const rentalIncome = incomeRes?.rentalIncome ?? 0;
      const capitalGainsSTCG = incomeRes?.capitalGains?.stcg ?? 0;
      const capitalGainsLTCG = incomeRes?.capitalGains?.ltcg ?? 0;
      const interestIncome = incomeRes?.interestIncome ?? 0;
      const dividendIncome = incomeRes?.dividendIncome ?? 0;
      const otherIncome = incomeRes?.otherIncome ?? 0;
      const tdsFromOther = incomeRes?.totalTDS ?? 0;

      // Investment-based deductions
      const ppfContribution = investmentsRes?.ppf?.currentYearContribution ?? 0;
      const npsContribution = investmentsRes?.nps?.currentYearContribution ?? 0;
      const elssInvestment = investmentsRes?.elss?.currentYearInvestment ?? 0;

      // Insurance-based deductions
      const lifeInsurancePremium = insuranceRes?.totalLifePremium ?? 0;
      const healthInsuranceSelf = insuranceRes?.healthInsurance?.selfPremium ?? 0;
      const healthInsuranceParents = insuranceRes?.healthInsurance?.parentsPremium ?? 0;

      // Liabilities-based deductions
      const homeLoan = liabilitiesRes?.loans?.find((l: any) => l.type === 'HOME_LOAN');
      const homeLoanInterestPaid = homeLoan?.interestPaidThisYear ?? 0;
      const educationLoanInterest = liabilitiesRes?.loans
        ?.filter((l: any) => l.type === 'EDUCATION_LOAN')
        ?.reduce((sum: number, l: any) => sum + (l.interestPaidThisYear ?? 0), 0) ?? 0;

      // Calculate totals
      const grossTotalIncome = salaryIncome + businessIncome + rentalIncome +
        capitalGainsSTCG + capitalGainsLTCG + interestIncome + dividendIncome + otherIncome;

      // 80C calculation (max 1.5L)
      const section80CRaw = epfContribution + ppfContribution + lifeInsurancePremium + elssInvestment;
      const section80C = Math.min(section80CRaw, 150000);

      // 80D calculation (self: 25K, parents: 50K for seniors)
      const section80DSelf = Math.min(healthInsuranceSelf, 25000);
      const section80DParents = Math.min(healthInsuranceParents, 50000);
      const section80D = section80DSelf + section80DParents;

      // 80CCD(1B) - Additional NPS (max 50K)
      const section80CCD1B = Math.min(npsContribution, 50000);

      // Section 24 - Home loan interest (max 2L for self-occupied)
      const section24 = Math.min(homeLoanInterestPaid, 200000);

      // 80E - Education loan interest (no limit)
      const section80E = educationLoanInterest;

      // Other deductions from deductions API
      const section80G = deductionsRes?.section80G?.total ?? 0;
      const section80TTA = Math.min(interestIncome * 0.1, 10000); // Simplified

      // HRA exemption (simplified - needs actual rent data)
      const hraExemption = deductionsRes?.hraExemption ?? 0;

      const totalDeductions = section80C + section80D + section80CCD1B + section24 +
        section80E + section80G + section80TTA + hraExemption;

      // Determine source characteristics
      const incomeSourceCount = [
        salaryIncome > 0,
        businessIncome > 0,
        rentalIncome > 0,
        (capitalGainsSTCG + capitalGainsLTCG) > 0,
        interestIncome > 0,
        dividendIncome > 0,
        otherIncome > 0,
      ].filter(Boolean).length;

      const aggregatedData: AggregatedTaxData = {
        salaryIncome,
        businessIncome,
        rentalIncome,
        capitalGainsSTCG,
        capitalGainsLTCG,
        interestIncome,
        dividendIncome,
        otherIncome,
        grossTotalIncome,
        tdsFromSalary,
        tdsFromOther,
        totalTDS: tdsFromSalary + tdsFromOther,
        section80C,
        section80D,
        section80DSelf,
        section80DParents,
        section80CCD1B,
        section80CCD2: npsEmployerContribution,
        section24,
        section80E,
        section80G,
        section80TTA,
        hraExemption,
        totalDeductions,
        rentPaid: deductionsRes?.rentPaid ?? 0,
        hraClaimed: hraExemption > 0,
        homeLoanExists: !!homeLoan,
        homeLoanInterestPaid,
        npsEmployeeContribution: npsContribution,
        npsEmployerContribution,
        unrealizedEquityGains: investmentsRes?.unrealizedGains?.equity ?? 0,
        incomeSourceCount,
        hasMultipleEmployers: salaryRes?.employerCount > 1,
        hasForeignIncome: false, // Would need additional flag
        hasBusinessIncome: businessIncome > 0,
        hasCapitalGains: (capitalGainsSTCG + capitalGainsLTCG) > 0,
      };

      return aggregatedData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get data completion status for tax planning
 */
export function useDataCompletionStatus() {
  const { data: aggregated, isLoading } = useAggregatedIncome();

  const completionStatus = computed<DataCompletionStatus>(() => {
    const data = aggregated.value;

    const items: DataCompletionItem[] = [
      {
        id: 'salary',
        label: 'Salary',
        category: 'income',
        isComplete: (data?.salaryIncome ?? 0) > 0,
        value: data?.salaryIncome,
        description: 'Salary income and TDS details',
      },
      {
        id: '80c',
        label: '80C',
        category: 'deduction',
        isComplete: (data?.section80C ?? 0) > 0,
        value: data?.section80C,
        description: `₹${((data?.section80C ?? 0) / 1000).toFixed(0)}K of ₹1.5L utilized`,
      },
      {
        id: '80d',
        label: '80D',
        category: 'deduction',
        isComplete: (data?.section80D ?? 0) > 0,
        value: data?.section80D,
        description: 'Health insurance premiums',
      },
      {
        id: 'nps',
        label: 'NPS',
        category: 'deduction',
        isComplete: (data?.section80CCD1B ?? 0) > 0,
        value: data?.section80CCD1B,
        description: 'Additional NPS contribution (80CCD-1B)',
      },
      {
        id: 'hra',
        label: 'HRA',
        category: 'exemption',
        isComplete: data?.hraClaimed ?? false,
        value: data?.hraExemption,
        description: 'House rent allowance exemption',
      },
      {
        id: 'home_loan',
        label: 'Home Loan',
        category: 'deduction',
        isComplete: data?.homeLoanExists ?? false,
        value: data?.section24,
        description: 'Home loan interest (Section 24)',
      },
      {
        id: 'capital_gains',
        label: 'Capital Gains',
        category: 'income',
        isComplete: data?.hasCapitalGains ?? false,
        value: (data?.capitalGainsSTCG ?? 0) + (data?.capitalGainsLTCG ?? 0),
        description: 'STCG and LTCG from investments',
      },
      {
        id: 'other_income',
        label: 'Other Income',
        category: 'income',
        isComplete: (data?.interestIncome ?? 0) + (data?.dividendIncome ?? 0) + (data?.otherIncome ?? 0) > 0,
        value: (data?.interestIncome ?? 0) + (data?.dividendIncome ?? 0) + (data?.otherIncome ?? 0),
        description: 'Interest, dividends, and other income',
      },
    ];

    const completedCount = items.filter(i => i.isComplete).length;
    const totalCount = items.length;
    const percentComplete = Math.round((completedCount / totalCount) * 100);

    return {
      items,
      completedCount,
      totalCount,
      percentComplete,
    };
  });

  return { completionStatus, isLoading };
}

/**
 * Scenario trigger conditions for smart suggestions
 */
const SCENARIO_TRIGGERS = {
  regimeComparison: (data: AggregatedTaxData) => data.grossTotalIncome > 500000,
  section80CGap: (data: AggregatedTaxData) => data.section80C < 150000,
  nps80CCD: (data: AggregatedTaxData) => data.section80CCD1B < 50000,
  section80D: (data: AggregatedTaxData) => data.section80DParents === 0 || data.section80DSelf < 25000,
  hraOptimization: (data: AggregatedTaxData) => data.rentPaid > 0 && !data.hraClaimed,
  homeLoanSec24: (data: AggregatedTaxData) => data.homeLoanExists && data.section24 < 200000,
  ltcgHarvesting: (data: AggregatedTaxData) => data.unrealizedEquityGains > 50000,
  advanceTaxAlert: (data: AggregatedTaxData, taxLiability: number) => (taxLiability - data.totalTDS) > 10000,
};

/**
 * Calculate potential savings for each scenario
 */
function calculateScenarioSavings(
  data: AggregatedTaxData,
  scenarioType: string,
  marginalRate: number = 0.312 // 30% + 4% cess
): { savings: number; suggestedValue: number } {
  switch (scenarioType) {
    case '80C':
      const gap80C = 150000 - data.section80C;
      return { savings: Math.round(gap80C * marginalRate), suggestedValue: 150000 };

    case '80CCD':
      const gapNPS = 50000 - data.section80CCD1B;
      return { savings: Math.round(gapNPS * marginalRate), suggestedValue: 50000 };

    case '80D':
      const gap80DSelf = 25000 - data.section80DSelf;
      const gap80DParents = 50000 - data.section80DParents;
      return {
        savings: Math.round((gap80DSelf + gap80DParents) * marginalRate),
        suggestedValue: data.section80DSelf + gap80DSelf + gap80DParents,
      };

    case 'sec24':
      const gapSec24 = 200000 - data.section24;
      return { savings: Math.round(gapSec24 * marginalRate), suggestedValue: 200000 };

    case 'ltcg':
      const harvestable = Math.min(data.unrealizedEquityGains, 125000);
      return { savings: Math.round(harvestable * 0.125), suggestedValue: harvestable }; // 12.5% LTCG

    default:
      return { savings: 0, suggestedValue: 0 };
  }
}

/**
 * Enhanced smart suggestions with priority and transparency
 */
export function useSmartSuggestionsEnhanced() {
  const { selectedFinancialYear } = useFinancialYear();
  const { data: aggregated, isLoading: aggregatedLoading } = useAggregatedIncome();
  const { data: comparison, isLoading: comparisonLoading } = useTaxComparison();
  const { data: advanceTax, isLoading: advanceTaxLoading } = useAdvanceTaxEstimate();

  const suggestions = computed<SmartSuggestionWithPriority[]>(() => {
    const data = aggregated.value;
    if (!data) return [];

    const results: SmartSuggestionWithPriority[] = [];
    const taxLiability = comparison.value?.newRegime?.totalTaxLiability ?? 0;

    // Determine marginal tax rate based on income
    let marginalRate = 0.052; // 5% + cess
    if (data.grossTotalIncome > 1500000) marginalRate = 0.312;
    else if (data.grossTotalIncome > 1200000) marginalRate = 0.208;
    else if (data.grossTotalIncome > 1000000) marginalRate = 0.156;
    else if (data.grossTotalIncome > 700000) marginalRate = 0.104;

    // 1. Regime Comparison (always high priority if income > 5L)
    if (SCENARIO_TRIGGERS.regimeComparison(data) && comparison.value) {
      const savings = comparison.value.savingsAmount;
      if (savings > 0) {
        results.push({
          id: 'regime',
          type: 'regime',
          priority: savings > 25000 ? 'high' : 'medium',
          title: `Switch to ${comparison.value.betterRegime === 'NEW' ? 'New' : 'Old'} Regime`,
          description: `Save ₹${savings.toLocaleString('en-IN')} by choosing ${comparison.value.betterRegime === 'NEW' ? 'New' : 'Old'} tax regime`,
          currentValue: comparison.value.betterRegime === 'NEW'
            ? comparison.value.oldRegime.totalTaxLiability
            : comparison.value.newRegime.totalTaxLiability,
          suggestedValue: comparison.value.betterRegime === 'NEW'
            ? comparison.value.newRegime.totalTaxLiability
            : comparison.value.oldRegime.totalTaxLiability,
          potentialSavings: savings,
          basedOn: 'Your income and deduction data from all sections',
          action: 'view_comparison',
          actionLabel: 'Compare Regimes',
        });
      }
    }

    // 2. 80C Gap Analysis
    if (SCENARIO_TRIGGERS.section80CGap(data)) {
      const gap = 150000 - data.section80C;
      const { savings } = calculateScenarioSavings(data, '80C', marginalRate);

      if (gap > 10000) {
        results.push({
          id: '80c',
          type: '80C',
          priority: gap > 50000 ? 'high' : 'medium',
          title: `Invest ₹${(gap / 1000).toFixed(0)}K more in 80C`,
          description: 'Maximize your 80C limit with PPF, ELSS, or NPS',
          currentValue: data.section80C,
          suggestedValue: 150000,
          potentialSavings: savings,
          basedOn: `Your current 80C: ₹${data.section80C.toLocaleString('en-IN')} (EPF + PPF + ELSS + LIC)`,
          action: 'add_80c',
          actionLabel: 'Add Investment',
        });
      }
    }

    // 3. NPS 80CCD(1B) Opportunity
    if (SCENARIO_TRIGGERS.nps80CCD(data)) {
      const gap = 50000 - data.section80CCD1B;
      const { savings } = calculateScenarioSavings(data, '80CCD', marginalRate);

      results.push({
        id: '80ccd',
        type: '80CCD',
        priority: 'medium',
        title: `Add ₹${(gap / 1000).toFixed(0)}K to NPS (80CCD-1B)`,
        description: 'Additional ₹50K NPS contribution beyond 80C limit',
        currentValue: data.section80CCD1B,
        suggestedValue: 50000,
        potentialSavings: savings,
        basedOn: `Your NPS contribution under 80CCD(1B): ₹${data.section80CCD1B.toLocaleString('en-IN')}`,
        action: 'add_nps',
        actionLabel: 'Add NPS',
      });
    }

    // 4. 80D Health Insurance
    if (SCENARIO_TRIGGERS.section80D(data)) {
      const { savings, suggestedValue } = calculateScenarioSavings(data, '80D', marginalRate);

      const description = data.section80DParents === 0
        ? 'Add health insurance for parents (up to ₹50K deduction)'
        : 'Increase health insurance coverage for more tax benefit';

      results.push({
        id: '80d',
        type: '80D',
        priority: 'medium',
        title: 'Optimize Health Insurance (80D)',
        description,
        currentValue: data.section80D,
        suggestedValue,
        potentialSavings: savings,
        basedOn: `Self: ₹${data.section80DSelf.toLocaleString('en-IN')}, Parents: ₹${data.section80DParents.toLocaleString('en-IN')}`,
        action: 'add_80d',
        actionLabel: 'Add Insurance',
      });
    }

    // 5. HRA Optimization
    if (SCENARIO_TRIGGERS.hraOptimization(data)) {
      // Simplified HRA calculation
      const potentialHRA = Math.min(data.rentPaid * 12, data.salaryIncome * 0.5);
      const savings = Math.round(potentialHRA * marginalRate);

      results.push({
        id: 'hra',
        type: 'hra',
        priority: 'high',
        title: 'Claim HRA Exemption',
        description: 'You pay rent but haven\'t claimed HRA exemption',
        currentValue: 0,
        suggestedValue: potentialHRA,
        potentialSavings: savings,
        basedOn: `Rent paid: ₹${data.rentPaid.toLocaleString('en-IN')}/month detected`,
        action: 'claim_hra',
        actionLabel: 'Claim HRA',
      });
    }

    // 6. Home Loan Section 24
    if (SCENARIO_TRIGGERS.homeLoanSec24(data)) {
      const { savings } = calculateScenarioSavings(data, 'sec24', marginalRate);

      results.push({
        id: 'sec24',
        type: 'sec24',
        priority: 'medium',
        title: 'Claim Full Home Loan Interest',
        description: 'Claim up to ₹2L interest deduction under Section 24',
        currentValue: data.section24,
        suggestedValue: 200000,
        potentialSavings: savings,
        basedOn: `Home loan interest paid: ₹${data.homeLoanInterestPaid.toLocaleString('en-IN')}`,
        action: 'update_sec24',
        actionLabel: 'Update Claim',
      });
    }

    // 7. LTCG Tax Harvesting
    if (SCENARIO_TRIGGERS.ltcgHarvesting(data)) {
      const { savings, suggestedValue } = calculateScenarioSavings(data, 'ltcg', marginalRate);

      results.push({
        id: 'ltcg',
        type: 'ltcg',
        priority: 'low',
        title: 'Book Tax-Free LTCG',
        description: 'Book up to ₹1.25L long-term gains tax-free this year',
        currentValue: 0,
        suggestedValue,
        potentialSavings: savings,
        basedOn: `Unrealized equity gains: ₹${data.unrealizedEquityGains.toLocaleString('en-IN')}`,
        action: 'view_ltcg',
        actionLabel: 'View Gains',
      });
    }

    // 8. Advance Tax Alert
    if (SCENARIO_TRIGGERS.advanceTaxAlert(data, taxLiability)) {
      const netTaxDue = taxLiability - data.totalTDS;
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();

      // Determine next due date
      let nextDueDate = '';
      let quarterLabel = '';
      if (currentMonth <= 6) {
        nextDueDate = `Jun 15, ${currentYear}`;
        quarterLabel = 'Q1';
      } else if (currentMonth <= 9) {
        nextDueDate = `Sep 15, ${currentYear}`;
        quarterLabel = 'Q2';
      } else if (currentMonth <= 12) {
        nextDueDate = `Dec 15, ${currentYear}`;
        quarterLabel = 'Q3';
      } else {
        nextDueDate = `Mar 15, ${currentYear + 1}`;
        quarterLabel = 'Q4';
      }

      // Advance tax payments would need a separate query; for now use 0 if not available
      const paidSoFar = (advanceTax.value as any)?.totalPaid ?? 0;
      const remaining = netTaxDue - paidSoFar;

      if (remaining > 10000) {
        results.push({
          id: 'advance_tax',
          type: 'advance_tax',
          priority: 'high',
          title: `Pay Advance Tax by ${nextDueDate}`,
          description: `${quarterLabel} advance tax due to avoid Section 234B/C interest`,
          currentValue: paidSoFar,
          suggestedValue: netTaxDue,
          potentialSavings: Math.round(remaining * 0.01 * 3), // ~1% per month for 3 months
          basedOn: `Tax liability: ₹${taxLiability.toLocaleString('en-IN')}, TDS: ₹${data.totalTDS.toLocaleString('en-IN')}`,
          action: 'pay_advance_tax',
          actionLabel: 'Pay Now',
        });
      }
    }

    // Sort by priority and potential savings
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return results.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.potentialSavings - a.potentialSavings;
    });
  });

  const isLoading = computed(() => aggregatedLoading.value || comparisonLoading.value || advanceTaxLoading.value);

  const topSuggestions = computed(() => suggestions.value.slice(0, 3));
  const highPrioritySuggestions = computed(() => suggestions.value.filter(s => s.priority === 'high'));

  return {
    suggestions,
    topSuggestions,
    highPrioritySuggestions,
    isLoading,
  };
}
