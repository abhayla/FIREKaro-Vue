/**
 * Liabilities Test Data
 *
 * Debts: Home loan, Car loan, Credit cards
 * Total Debt: ~Rs. 37.2L
 */

import { testUserProfile } from './unified-profile';

// ============================================
// Types
// ============================================

export interface LoanTestData {
  id?: string;
  loanType: 'home' | 'car' | 'personal' | 'education' | 'gold';
  lenderName: string;
  loanAccountNumber: string;
  principalAmount: number;
  outstandingPrincipal: number;
  interestRate: number;
  tenure: number; // in months
  remainingTenure: number;
  emiAmount: number;
  emiDate: number; // day of month (1-28)
  startDate: string;
  endDate: string;
  // Tax benefits
  section80C?: number; // Principal repayment
  section24?: number; // Interest deduction
  // Calculated
  totalInterestPaid: number;
  totalInterestRemaining: number;
}

export interface CreditCardTestData {
  id?: string;
  cardName: string;
  bankName: string;
  cardNumber: string; // Last 4 digits
  creditLimit: number;
  currentOutstanding: number;
  minimumDue: number;
  dueDate: number; // day of month
  interestRate: number; // APR
  rewardPoints?: number;
  // Calculated
  utilizationPercent: number;
  availableCredit: number;
}

export interface DebtPayoffStrategy {
  strategy: 'snowball' | 'avalanche';
  debts: Array<{
    name: string;
    balance: number;
    interestRate: number;
    minPayment: number;
    payoffOrder: number;
  }>;
  totalDebt: number;
  totalMonthlyPayment: number;
  payoffMonths: number;
  totalInterestPaid: number;
}

// ============================================
// Loans Data
// ============================================

export const loansData: LoanTestData[] = [
  {
    id: "home-loan-1",
    loanType: "home",
    lenderName: "HDFC Bank",
    loanAccountNumber: "HLOAN123456789",
    principalAmount: 5000000, // Rs. 50L
    outstandingPrincipal: 3200000, // Rs. 32L
    interestRate: 8.5,
    tenure: 240, // 20 years
    remainingTenure: 156, // 13 years
    emiAmount: 43391,
    emiDate: 5,
    startDate: "2020-06-15",
    endDate: "2040-06-15",
    section80C: 150000, // Principal component (capped at 1.5L)
    section24: 200000, // Interest component (capped at 2L for self-occupied, unlimited for let out)
    totalInterestPaid: 1800000, // Already paid
    totalInterestRemaining: 2600000, // Remaining interest
  },
  {
    id: "car-loan-1",
    loanType: "car",
    lenderName: "ICICI Bank",
    loanAccountNumber: "CLOAN987654321",
    principalAmount: 800000, // Rs. 8L
    outstandingPrincipal: 450000, // Rs. 4.5L
    interestRate: 9.5,
    tenure: 60, // 5 years
    remainingTenure: 28, // ~2.3 years
    emiAmount: 16765,
    emiDate: 10,
    startDate: "2022-08-01",
    endDate: "2027-08-01",
    totalInterestPaid: 95000,
    totalInterestRemaining: 65000,
  },
];

// ============================================
// Credit Cards Data
// ============================================

export const creditCardsData: CreditCardTestData[] = [
  {
    id: "cc-1",
    cardName: "HDFC Regalia",
    bankName: "HDFC Bank",
    cardNumber: "4532",
    creditLimit: 500000,
    currentOutstanding: 45000,
    minimumDue: 4500,
    dueDate: 15,
    interestRate: 42, // 3.5% per month = 42% APR
    rewardPoints: 15000,
    utilizationPercent: 9,
    availableCredit: 455000,
  },
  {
    id: "cc-2",
    cardName: "SBI SimplyCLICK",
    bankName: "SBI Card",
    cardNumber: "8821",
    creditLimit: 300000,
    currentOutstanding: 25000,
    minimumDue: 2500,
    dueDate: 20,
    interestRate: 39.6, // 3.3% per month
    rewardPoints: 8500,
    utilizationPercent: 8.33,
    availableCredit: 275000,
  },
];

// ============================================
// Liabilities Summary
// ============================================

export const liabilitiesSummary = {
  loans: {
    count: loansData.length,
    totalPrincipal: loansData.reduce((sum, l) => sum + l.principalAmount, 0),
    totalOutstanding: loansData.reduce((sum, l) => sum + l.outstandingPrincipal, 0),
    monthlyEMI: loansData.reduce((sum, l) => sum + l.emiAmount, 0),
    homeLoan: loansData.filter(l => l.loanType === 'home').reduce((sum, l) => sum + l.outstandingPrincipal, 0),
    carLoan: loansData.filter(l => l.loanType === 'car').reduce((sum, l) => sum + l.outstandingPrincipal, 0),
  },

  creditCards: {
    count: creditCardsData.length,
    totalLimit: creditCardsData.reduce((sum, c) => sum + c.creditLimit, 0),
    totalOutstanding: creditCardsData.reduce((sum, c) => sum + c.currentOutstanding, 0),
    totalMinDue: creditCardsData.reduce((sum, c) => sum + c.minimumDue, 0),
    avgUtilization: creditCardsData.reduce((sum, c) => sum + c.utilizationPercent, 0) / creditCardsData.length,
  },

  get totalDebt() {
    return this.loans.totalOutstanding + this.creditCards.totalOutstanding;
  },

  get monthlyPayment() {
    return this.loans.monthlyEMI + this.creditCards.totalMinDue;
  },

  get debtToIncomeRatio() {
    // DTI = Monthly Debt Payment / Monthly Gross Income
    return Math.round((this.monthlyPayment / testUserProfile.monthlyGross) * 100 * 100) / 100;
  },
};

// ============================================
// Debt Payoff Strategies
// ============================================

// Combine all debts for payoff analysis
const allDebts = [
  ...loansData.map(l => ({
    name: `${l.loanType} Loan - ${l.lenderName}`,
    balance: l.outstandingPrincipal,
    interestRate: l.interestRate,
    minPayment: l.emiAmount,
  })),
  ...creditCardsData.map(c => ({
    name: `${c.cardName}`,
    balance: c.currentOutstanding,
    interestRate: c.interestRate,
    minPayment: c.minimumDue,
  })),
];

// Snowball: Smallest balance first
export const snowballStrategy: DebtPayoffStrategy = {
  strategy: 'snowball',
  debts: [...allDebts]
    .sort((a, b) => a.balance - b.balance)
    .map((d, i) => ({ ...d, payoffOrder: i + 1 })),
  totalDebt: allDebts.reduce((sum, d) => sum + d.balance, 0),
  totalMonthlyPayment: allDebts.reduce((sum, d) => sum + d.minPayment, 0),
  payoffMonths: 156, // Approximate
  totalInterestPaid: 2800000, // Approximate
};

// Avalanche: Highest interest first
export const avalancheStrategy: DebtPayoffStrategy = {
  strategy: 'avalanche',
  debts: [...allDebts]
    .sort((a, b) => b.interestRate - a.interestRate)
    .map((d, i) => ({ ...d, payoffOrder: i + 1 })),
  totalDebt: allDebts.reduce((sum, d) => sum + d.balance, 0),
  totalMonthlyPayment: allDebts.reduce((sum, d) => sum + d.minPayment, 0),
  payoffMonths: 150, // Slightly faster due to less interest
  totalInterestPaid: 2650000, // Less interest paid
};

// ============================================
// Amortization Schedule (Sample for Home Loan)
// ============================================

export function generateAmortizationSchedule(loan: LoanTestData, months: number = 12) {
  const schedule: Array<{
    month: number;
    emi: number;
    principal: number;
    interest: number;
    balance: number;
  }> = [];

  let balance = loan.outstandingPrincipal;
  const monthlyRate = loan.interestRate / 100 / 12;

  for (let i = 1; i <= months && balance > 0; i++) {
    const interest = Math.round(balance * monthlyRate);
    const principal = Math.min(loan.emiAmount - interest, balance);
    balance = Math.max(0, balance - principal);

    schedule.push({
      month: i,
      emi: loan.emiAmount,
      principal,
      interest,
      balance,
    });
  }

  return schedule;
}

// ============================================
// Upcoming Payments
// ============================================

export const upcomingPayments = {
  // Next 30 days
  loans: loansData.map(l => ({
    name: `${l.loanType} Loan EMI`,
    lender: l.lenderName,
    amount: l.emiAmount,
    dueDate: l.emiDate,
  })),

  creditCards: creditCardsData.map(c => ({
    name: `${c.cardName} Payment`,
    bank: c.bankName,
    minDue: c.minimumDue,
    totalDue: c.currentOutstanding,
    dueDate: c.dueDate,
  })),

  get totalUpcoming() {
    return (
      this.loans.reduce((sum, l) => sum + l.amount, 0) +
      this.creditCards.reduce((sum, c) => sum + c.minDue, 0)
    );
  },
};

// ============================================
// Test Helpers
// ============================================

export function getLoansByType(type: LoanTestData['loanType']): LoanTestData[] {
  return loansData.filter(l => l.loanType === type);
}

export function getHighUtilizationCards(threshold: number = 30): CreditCardTestData[] {
  return creditCardsData.filter(c => c.utilizationPercent > threshold);
}

export function calculatePayoffDate(loan: LoanTestData): Date {
  const today = new Date();
  const months = loan.remainingTenure;
  return new Date(today.setMonth(today.getMonth() + months));
}

export function getTaxBenefits(): { section80C: number; section24: number; total: number } {
  const section80C = loansData.reduce((sum, l) => sum + (l.section80C || 0), 0);
  const section24 = loansData.reduce((sum, l) => sum + (l.section24 || 0), 0);
  return {
    section80C,
    section24,
    total: section80C + section24,
  };
}
