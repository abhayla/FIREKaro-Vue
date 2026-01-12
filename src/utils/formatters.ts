/**
 * Currency and number formatting utilities for INR
 */

/**
 * Format amount in INR currency format with symbol
 * @example formatINR(150000) => "₹1,50,000"
 */
export function formatINR(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format amount in INR with lakhs/crores notation
 * @example formatINRLakhs(1500000) => "15.00L"
 * @example formatINRLakhs(15000000) => "1.50Cr"
 */
export function formatINRLakhs(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₹0';
  }
  if (amount >= 10000000) {
    return `${(amount / 10000000).toFixed(2)}Cr`;
  } else if (amount >= 100000) {
    return `${(amount / 100000).toFixed(2)}L`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return formatINR(amount);
}

/**
 * Format amount in compact INR notation
 * @example formatINRCompact(10000000) => "1.00 Cr"
 * @example formatINRCompact(500000) => "5.00 L"
 */
export function formatINRCompact(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₹0';
  }
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (absAmount >= 10000000) {
    return `${sign}${(absAmount / 10000000).toFixed(2)} Cr`;
  } else if (absAmount >= 100000) {
    return `${sign}${(absAmount / 100000).toFixed(2)} L`;
  } else if (absAmount >= 1000) {
    return `${sign}${(absAmount / 1000).toFixed(1)}K`;
  }
  return formatINR(amount);
}

/**
 * Format percentage with specified decimal places
 * @example formatPercent(45.678, 1) => "45.7%"
 */
export function formatPercent(value: number, decimals: number = 1): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0%';
  }
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format number with Indian comma notation (no currency symbol)
 * @example formatIndianNumber(1500000) => "15,00,000"
 */
export function formatIndianNumber(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0';
  }
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(amount);
}
