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
      if (!res.ok) throw new Error("Failed to fetch advance tax estimate");
      return res.json() as Promise<AdvanceTaxEstimate>;
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
      if (!res.ok) throw new Error("Failed to fetch scenarios");
      return res.json() as Promise<TaxScenario[]>;
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
