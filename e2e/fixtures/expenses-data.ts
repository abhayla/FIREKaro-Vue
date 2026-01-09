/**
 * Expenses Test Data
 *
 * Monthly expenses: ~Rs. 70K
 * Budget: 50/30/20 allocation
 */

import { testUserProfile } from './unified-profile';

// ============================================
// Types
// ============================================

export interface ExpenseTestData {
  id?: string;
  category: string;
  subcategory?: string;
  description: string;
  amount: number;
  date: string;
  paymentMethod: 'cash' | 'upi' | 'credit_card' | 'debit_card' | 'net_banking';
  isRecurring: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  tags?: string[];
}

export interface BudgetTestData {
  category: string;
  monthlyLimit: number;
  currentSpent: number;
  // Calculated
  remaining: number;
  utilizationPercent: number;
  isOverBudget: boolean;
}

export interface ExpenseCategoryConfig {
  name: string;
  icon: string;
  color: string;
  budgetType: 'needs' | 'wants' | 'savings';
  subcategories: string[];
}

// ============================================
// Expense Categories
// ============================================

export const expenseCategories: ExpenseCategoryConfig[] = [
  {
    name: "Housing",
    icon: "mdi-home",
    color: "#4CAF50",
    budgetType: "needs",
    subcategories: ["Rent", "Maintenance", "Society Charges", "Property Tax"],
  },
  {
    name: "Utilities",
    icon: "mdi-flash",
    color: "#2196F3",
    budgetType: "needs",
    subcategories: ["Electricity", "Water", "Gas", "Internet", "Mobile"],
  },
  {
    name: "Groceries",
    icon: "mdi-cart",
    color: "#FF9800",
    budgetType: "needs",
    subcategories: ["Vegetables", "Fruits", "Dairy", "Groceries", "Meat"],
  },
  {
    name: "Transportation",
    icon: "mdi-car",
    color: "#9C27B0",
    budgetType: "needs",
    subcategories: ["Fuel", "Cab/Auto", "Metro", "Car Maintenance", "Insurance"],
  },
  {
    name: "Healthcare",
    icon: "mdi-hospital",
    color: "#F44336",
    budgetType: "needs",
    subcategories: ["Doctor", "Medicine", "Tests", "Insurance Premium"],
  },
  {
    name: "Education",
    icon: "mdi-school",
    color: "#3F51B5",
    budgetType: "needs",
    subcategories: ["School Fees", "Books", "Courses", "Tuition"],
  },
  {
    name: "Dining Out",
    icon: "mdi-food",
    color: "#E91E63",
    budgetType: "wants",
    subcategories: ["Restaurants", "Cafes", "Food Delivery", "Takeaway"],
  },
  {
    name: "Entertainment",
    icon: "mdi-movie",
    color: "#00BCD4",
    budgetType: "wants",
    subcategories: ["Movies", "OTT", "Games", "Events", "Hobbies"],
  },
  {
    name: "Shopping",
    icon: "mdi-shopping",
    color: "#795548",
    budgetType: "wants",
    subcategories: ["Clothing", "Electronics", "Home", "Personal Care"],
  },
  {
    name: "Travel",
    icon: "mdi-airplane",
    color: "#607D8B",
    budgetType: "wants",
    subcategories: ["Flights", "Hotels", "Local Transport", "Activities"],
  },
  {
    name: "Personal Care",
    icon: "mdi-face-woman",
    color: "#FF5722",
    budgetType: "wants",
    subcategories: ["Salon", "Spa", "Gym", "Cosmetics"],
  },
  {
    name: "Gifts & Donations",
    icon: "mdi-gift",
    color: "#8BC34A",
    budgetType: "wants",
    subcategories: ["Gifts", "Charity", "Religious"],
  },
];

// ============================================
// Monthly Expenses Data (Sample Month)
// ============================================

export const monthlyExpensesData: ExpenseTestData[] = [
  // Housing - Rs. 5,000 (Property is let out, so minimal expenses)
  {
    category: "Housing",
    subcategory: "Maintenance",
    description: "Society Maintenance Charges",
    amount: 3500,
    date: "2025-06-01",
    paymentMethod: "net_banking",
    isRecurring: true,
    recurringFrequency: "monthly",
  },
  {
    category: "Housing",
    subcategory: "Society Charges",
    description: "Parking Charges",
    amount: 1500,
    date: "2025-06-01",
    paymentMethod: "net_banking",
    isRecurring: true,
    recurringFrequency: "monthly",
  },

  // Utilities - Rs. 8,000
  {
    category: "Utilities",
    subcategory: "Electricity",
    description: "BESCOM Bill",
    amount: 3500,
    date: "2025-06-05",
    paymentMethod: "upi",
    isRecurring: true,
    recurringFrequency: "monthly",
  },
  {
    category: "Utilities",
    subcategory: "Internet",
    description: "ACT Fibernet",
    amount: 1199,
    date: "2025-06-10",
    paymentMethod: "credit_card",
    isRecurring: true,
    recurringFrequency: "monthly",
  },
  {
    category: "Utilities",
    subcategory: "Mobile",
    description: "Jio Postpaid (Family)",
    amount: 999,
    date: "2025-06-15",
    paymentMethod: "credit_card",
    isRecurring: true,
    recurringFrequency: "monthly",
  },
  {
    category: "Utilities",
    subcategory: "Gas",
    description: "LPG Cylinder",
    amount: 950,
    date: "2025-06-12",
    paymentMethod: "upi",
    isRecurring: false,
  },
  {
    category: "Utilities",
    subcategory: "Water",
    description: "BWSSB Water Bill",
    amount: 350,
    date: "2025-06-08",
    paymentMethod: "upi",
    isRecurring: true,
    recurringFrequency: "monthly",
  },

  // Groceries - Rs. 15,000
  {
    category: "Groceries",
    subcategory: "Groceries",
    description: "BigBasket Monthly",
    amount: 8000,
    date: "2025-06-02",
    paymentMethod: "credit_card",
    isRecurring: false,
    tags: ["essentials"],
  },
  {
    category: "Groceries",
    subcategory: "Vegetables",
    description: "Weekly Vegetables",
    amount: 4000,
    date: "2025-06-07",
    paymentMethod: "upi",
    isRecurring: true,
    recurringFrequency: "weekly",
  },
  {
    category: "Groceries",
    subcategory: "Dairy",
    description: "Milk & Dairy (Monthly)",
    amount: 3000,
    date: "2025-06-01",
    paymentMethod: "cash",
    isRecurring: true,
    recurringFrequency: "monthly",
  },

  // Transportation - Rs. 8,000
  {
    category: "Transportation",
    subcategory: "Fuel",
    description: "Petrol",
    amount: 5000,
    date: "2025-06-10",
    paymentMethod: "credit_card",
    isRecurring: false,
  },
  {
    category: "Transportation",
    subcategory: "Cab/Auto",
    description: "Uber/Ola Rides",
    amount: 2500,
    date: "2025-06-30",
    paymentMethod: "upi",
    isRecurring: false,
  },
  {
    category: "Transportation",
    subcategory: "Car Maintenance",
    description: "Car Service",
    amount: 500,
    date: "2025-06-15",
    paymentMethod: "credit_card",
    isRecurring: false,
  },

  // Healthcare - Rs. 5,000
  {
    category: "Healthcare",
    subcategory: "Insurance Premium",
    description: "Health Insurance EMI",
    amount: 3000,
    date: "2025-06-05",
    paymentMethod: "net_banking",
    isRecurring: true,
    recurringFrequency: "monthly",
  },
  {
    category: "Healthcare",
    subcategory: "Medicine",
    description: "Monthly Medicines (Parents)",
    amount: 2000,
    date: "2025-06-01",
    paymentMethod: "upi",
    isRecurring: true,
    recurringFrequency: "monthly",
  },

  // Education - Rs. 8,000
  {
    category: "Education",
    subcategory: "School Fees",
    description: "Child School Fees",
    amount: 6000,
    date: "2025-06-10",
    paymentMethod: "net_banking",
    isRecurring: true,
    recurringFrequency: "monthly",
  },
  {
    category: "Education",
    subcategory: "Courses",
    description: "Online Course Subscription",
    amount: 2000,
    date: "2025-06-01",
    paymentMethod: "credit_card",
    isRecurring: true,
    recurringFrequency: "monthly",
  },

  // Dining Out - Rs. 6,000
  {
    category: "Dining Out",
    subcategory: "Restaurants",
    description: "Family Dinner",
    amount: 3500,
    date: "2025-06-14",
    paymentMethod: "credit_card",
    isRecurring: false,
  },
  {
    category: "Dining Out",
    subcategory: "Food Delivery",
    description: "Swiggy/Zomato Orders",
    amount: 2500,
    date: "2025-06-30",
    paymentMethod: "upi",
    isRecurring: false,
  },

  // Entertainment - Rs. 3,000
  {
    category: "Entertainment",
    subcategory: "OTT",
    description: "Netflix + Prime + Hotstar",
    amount: 1500,
    date: "2025-06-01",
    paymentMethod: "credit_card",
    isRecurring: true,
    recurringFrequency: "monthly",
  },
  {
    category: "Entertainment",
    subcategory: "Movies",
    description: "Movie Tickets",
    amount: 1000,
    date: "2025-06-20",
    paymentMethod: "upi",
    isRecurring: false,
  },
  {
    category: "Entertainment",
    subcategory: "Hobbies",
    description: "Books",
    amount: 500,
    date: "2025-06-15",
    paymentMethod: "credit_card",
    isRecurring: false,
  },

  // Shopping - Rs. 5,000
  {
    category: "Shopping",
    subcategory: "Clothing",
    description: "Kids Clothing",
    amount: 3000,
    date: "2025-06-08",
    paymentMethod: "credit_card",
    isRecurring: false,
  },
  {
    category: "Shopping",
    subcategory: "Personal Care",
    description: "Toiletries & Personal Care",
    amount: 2000,
    date: "2025-06-05",
    paymentMethod: "upi",
    isRecurring: false,
  },

  // Personal Care - Rs. 4,000
  {
    category: "Personal Care",
    subcategory: "Gym",
    description: "Gym Membership",
    amount: 3000,
    date: "2025-06-01",
    paymentMethod: "credit_card",
    isRecurring: true,
    recurringFrequency: "monthly",
  },
  {
    category: "Personal Care",
    subcategory: "Salon",
    description: "Salon Visit",
    amount: 1000,
    date: "2025-06-18",
    paymentMethod: "upi",
    isRecurring: false,
  },

  // Gifts & Donations - Rs. 3,000
  {
    category: "Gifts & Donations",
    subcategory: "Charity",
    description: "Monthly Charity",
    amount: 2000,
    date: "2025-06-01",
    paymentMethod: "upi",
    isRecurring: true,
    recurringFrequency: "monthly",
  },
  {
    category: "Gifts & Donations",
    subcategory: "Gifts",
    description: "Birthday Gift",
    amount: 1000,
    date: "2025-06-25",
    paymentMethod: "credit_card",
    isRecurring: false,
  },
];

// ============================================
// Budget Data (50/30/20 Rule)
// ============================================

const monthlyIncome = testUserProfile.monthlyNet;

export const budgetData: BudgetTestData[] = [
  // Needs (50%) - Rs. 77,725
  {
    category: "Housing",
    monthlyLimit: 5000,
    currentSpent: 5000,
    remaining: 0,
    utilizationPercent: 100,
    isOverBudget: false,
  },
  {
    category: "Utilities",
    monthlyLimit: 8000,
    currentSpent: 6998,
    remaining: 1002,
    utilizationPercent: 87.5,
    isOverBudget: false,
  },
  {
    category: "Groceries",
    monthlyLimit: 15000,
    currentSpent: 15000,
    remaining: 0,
    utilizationPercent: 100,
    isOverBudget: false,
  },
  {
    category: "Transportation",
    monthlyLimit: 10000,
    currentSpent: 8000,
    remaining: 2000,
    utilizationPercent: 80,
    isOverBudget: false,
  },
  {
    category: "Healthcare",
    monthlyLimit: 5000,
    currentSpent: 5000,
    remaining: 0,
    utilizationPercent: 100,
    isOverBudget: false,
  },
  {
    category: "Education",
    monthlyLimit: 10000,
    currentSpent: 8000,
    remaining: 2000,
    utilizationPercent: 80,
    isOverBudget: false,
  },

  // Wants (30%) - Rs. 46,635
  {
    category: "Dining Out",
    monthlyLimit: 8000,
    currentSpent: 6000,
    remaining: 2000,
    utilizationPercent: 75,
    isOverBudget: false,
  },
  {
    category: "Entertainment",
    monthlyLimit: 5000,
    currentSpent: 3000,
    remaining: 2000,
    utilizationPercent: 60,
    isOverBudget: false,
  },
  {
    category: "Shopping",
    monthlyLimit: 8000,
    currentSpent: 5000,
    remaining: 3000,
    utilizationPercent: 62.5,
    isOverBudget: false,
  },
  {
    category: "Personal Care",
    monthlyLimit: 5000,
    currentSpent: 4000,
    remaining: 1000,
    utilizationPercent: 80,
    isOverBudget: false,
  },
  {
    category: "Gifts & Donations",
    monthlyLimit: 5000,
    currentSpent: 3000,
    remaining: 2000,
    utilizationPercent: 60,
    isOverBudget: false,
  },
];

// ============================================
// Expense Summary
// ============================================

export const expenseSummary = {
  month: "June 2025",

  totalSpent: monthlyExpensesData.reduce((sum, e) => sum + e.amount, 0),

  byCategory: expenseCategories.map(cat => ({
    category: cat.name,
    amount: monthlyExpensesData
      .filter(e => e.category === cat.name)
      .reduce((sum, e) => sum + e.amount, 0),
    budgetType: cat.budgetType,
  })),

  byPaymentMethod: {
    cash: monthlyExpensesData.filter(e => e.paymentMethod === 'cash').reduce((s, e) => s + e.amount, 0),
    upi: monthlyExpensesData.filter(e => e.paymentMethod === 'upi').reduce((s, e) => s + e.amount, 0),
    credit_card: monthlyExpensesData.filter(e => e.paymentMethod === 'credit_card').reduce((s, e) => s + e.amount, 0),
    debit_card: monthlyExpensesData.filter(e => e.paymentMethod === 'debit_card').reduce((s, e) => s + e.amount, 0),
    net_banking: monthlyExpensesData.filter(e => e.paymentMethod === 'net_banking').reduce((s, e) => s + e.amount, 0),
  },

  recurring: monthlyExpensesData.filter(e => e.isRecurring).reduce((s, e) => s + e.amount, 0),
  nonRecurring: monthlyExpensesData.filter(e => !e.isRecurring).reduce((s, e) => s + e.amount, 0),

  // 50/30/20 breakdown
  needs: monthlyExpensesData
    .filter(e => ['Housing', 'Utilities', 'Groceries', 'Transportation', 'Healthcare', 'Education'].includes(e.category))
    .reduce((s, e) => s + e.amount, 0),
  wants: monthlyExpensesData
    .filter(e => ['Dining Out', 'Entertainment', 'Shopping', 'Personal Care', 'Gifts & Donations', 'Travel'].includes(e.category))
    .reduce((s, e) => s + e.amount, 0),
};

// ============================================
// Test Helpers
// ============================================

export function getExpensesByCategory(category: string): ExpenseTestData[] {
  return monthlyExpensesData.filter(e => e.category === category);
}

export function getRecurringExpenses(): ExpenseTestData[] {
  return monthlyExpensesData.filter(e => e.isRecurring);
}

export function getExpensesByPaymentMethod(method: ExpenseTestData['paymentMethod']): ExpenseTestData[] {
  return monthlyExpensesData.filter(e => e.paymentMethod === method);
}

export function getBudgetUtilization(category: string): BudgetTestData | undefined {
  return budgetData.find(b => b.category === category);
}

export function getOverBudgetCategories(): BudgetTestData[] {
  return budgetData.filter(b => b.isOverBudget);
}

// ============================================
// Expense Rules Test Data
// ============================================

export interface ExpenseRuleTestData {
  name: string;
  isActive: boolean;
  priority: number;
  conditions: Array<{
    field: 'merchant' | 'description' | 'amount' | 'paymentMethod';
    operator: 'equals' | 'contains' | 'startsWith' | 'greaterThan' | 'lessThan';
    value: string | number;
  }>;
  targetCategory: string;
  targetSubcategory?: string;
}

export const expenseRulesData: ExpenseRuleTestData[] = [
  {
    name: "Swiggy Food Orders",
    isActive: true,
    priority: 1,
    conditions: [
      { field: "merchant", operator: "contains", value: "Swiggy" },
    ],
    targetCategory: "Dining Out",
    targetSubcategory: "Food Delivery",
  },
  {
    name: "Zomato Food Orders",
    isActive: true,
    priority: 2,
    conditions: [
      { field: "merchant", operator: "contains", value: "Zomato" },
    ],
    targetCategory: "Dining Out",
    targetSubcategory: "Food Delivery",
  },
  {
    name: "Amazon Shopping",
    isActive: true,
    priority: 3,
    conditions: [
      { field: "merchant", operator: "contains", value: "Amazon" },
    ],
    targetCategory: "Shopping",
  },
  {
    name: "Uber/Ola Rides",
    isActive: true,
    priority: 4,
    conditions: [
      { field: "description", operator: "contains", value: "Uber" },
    ],
    targetCategory: "Transportation",
    targetSubcategory: "Cab/Auto",
  },
  {
    name: "High Value Purchases",
    isActive: true,
    priority: 10,
    conditions: [
      { field: "amount", operator: "greaterThan", value: 10000 },
    ],
    targetCategory: "Shopping",
  },
  {
    name: "Petrol Expenses",
    isActive: true,
    priority: 5,
    conditions: [
      { field: "description", operator: "contains", value: "Petrol" },
    ],
    targetCategory: "Transportation",
    targetSubcategory: "Fuel",
  },
];

export function getActiveRules(): ExpenseRuleTestData[] {
  return expenseRulesData.filter(r => r.isActive);
}

export function getRulesByCategory(category: string): ExpenseRuleTestData[] {
  return expenseRulesData.filter(r => r.targetCategory === category);
}
