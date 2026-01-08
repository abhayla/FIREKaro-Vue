/**
 * FIREKaro Chart.js Theme Configuration
 * ProjectionLab-inspired chart styling
 */

// Chart color palette
export const chartColors = {
  // Primary palette for general charts
  primary: [
    "#1867c0", // Primary blue
    "#26a69a", // Teal
    "#4caf50", // Green
    "#ff9800", // Orange
    "#9c27b0", // Purple
    "#00bcd4", // Cyan
    "#f44336", // Red
    "#795548", // Brown
  ],

  // Asset class colors for portfolio charts
  assetClasses: {
    equity: "#1976d2", // Blue - Stocks, MF
    debt: "#7cb342", // Green - Bonds, FD
    gold: "#ffc107", // Gold/Amber
    realEstate: "#8d6e63", // Brown - Property
    cash: "#78909c", // Blue-gray - Liquid
    crypto: "#9c27b0", // Purple
    retirement: "#00acc1", // Cyan - EPF, PPF, NPS
  },

  // FIRE progress colors
  fireProgress: {
    0: "#ef5350", // 0-25% - Red
    25: "#ff9800", // 25-50% - Orange
    50: "#ffeb3b", // 50-75% - Yellow
    75: "#8bc34a", // 75-99% - Light Green
    100: "#4caf50", // 100% - Green
  },

  // Income vs Expense
  incomeExpense: {
    income: "#4caf50",
    expense: "#f44336",
    savings: "#2196f3",
    crossover: "#ffc107",
  },

  // Positive/Negative
  sentiment: {
    positive: "#4caf50",
    negative: "#f44336",
    neutral: "#9e9e9e",
  },
};

// Get color for FIRE progress percentage
export function getFireProgressColor(percentage: number): string {
  if (percentage >= 100) return chartColors.fireProgress[100];
  if (percentage >= 75) return chartColors.fireProgress[75];
  if (percentage >= 50) return chartColors.fireProgress[50];
  if (percentage >= 25) return chartColors.fireProgress[25];
  return chartColors.fireProgress[0];
}

// Shared tooltip configuration
const tooltipConfig = {
  backgroundColor: "rgba(33, 33, 33, 0.95)",
  titleColor: "#ffffff",
  bodyColor: "#e0e0e0",
  borderColor: "rgba(255, 255, 255, 0.1)",
  borderWidth: 1,
  cornerRadius: 8,
  padding: 12,
  titleFont: {
    family: "'Inter', sans-serif",
    size: 13,
    weight: 600 as const,
  },
  bodyFont: {
    family: "'JetBrains Mono', monospace",
    size: 12,
  },
  displayColors: true,
  boxPadding: 4,
};

// Shared legend configuration
const legendConfig = {
  position: "bottom" as const,
  labels: {
    font: {
      family: "'Inter', sans-serif",
      size: 12,
      weight: 500 as const,
    },
    padding: 16,
    usePointStyle: true,
    pointStyle: "circle" as const,
  },
};

// Line chart specific options (type-safe without spreading generic options)
export const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: legendConfig,
    tooltip: tooltipConfig,
  },
  scales: {
    x: {
      grid: {
        color: "rgba(0, 0, 0, 0.08)",
      },
      border: {
        display: false,
      },
      ticks: {
        font: {
          family: "'Inter', sans-serif",
          size: 11,
        },
      },
    },
    y: {
      grid: {
        color: "rgba(0, 0, 0, 0.08)",
      },
      border: {
        display: false,
      },
      ticks: {
        font: {
          family: "'JetBrains Mono', monospace",
          size: 11,
        },
      },
    },
  },
  elements: {
    line: {
      tension: 0.3,
      borderWidth: 2,
    },
    point: {
      radius: 3,
      hoverRadius: 5,
    },
  },
} as const;

// Bar chart specific options
export const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: legendConfig,
    tooltip: tooltipConfig,
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: {
          family: "'Inter', sans-serif",
          size: 11,
        },
      },
    },
    y: {
      grid: {
        color: "rgba(0, 0, 0, 0.08)",
      },
      border: {
        display: false,
      },
      ticks: {
        font: {
          family: "'JetBrains Mono', monospace",
          size: 11,
        },
      },
    },
  },
} as const;

// Doughnut/Pie chart specific options
export const doughnutChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "60%",
  plugins: {
    legend: {
      position: "right" as const,
      labels: {
        font: {
          family: "'Inter', sans-serif",
          size: 12,
          weight: 500 as const,
        },
        padding: 12,
        usePointStyle: true,
        pointStyle: "circle" as const,
      },
    },
    tooltip: {
      backgroundColor: "rgba(33, 33, 33, 0.95)",
      titleColor: "#ffffff",
      bodyColor: "#e0e0e0",
      borderColor: "rgba(255, 255, 255, 0.1)",
      borderWidth: 1,
      cornerRadius: 8,
      padding: 12,
    },
  },
} as const;

// Dark mode chart options (merge with default)
export const darkModeOverrides = {
  scales: {
    x: {
      grid: {
        color: "rgba(255, 255, 255, 0.1)",
      },
      ticks: {
        color: "#b3b3b3",
      },
    },
    y: {
      grid: {
        color: "rgba(255, 255, 255, 0.1)",
      },
      ticks: {
        color: "#b3b3b3",
      },
    },
  },
  plugins: {
    legend: {
      labels: {
        color: "#e0e0e0",
      },
    },
  },
};

// INR currency formatter for chart tooltips
export function formatINRForChart(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

// Percentage formatter for chart tooltips
export function formatPercentForChart(value: number): string {
  return `${value.toFixed(1)}%`;
}

// Create dataset with consistent styling
export function createDataset(
  label: string,
  data: number[],
  colorIndex: number = 0,
  options: Partial<{
    fill: boolean;
    borderDash: number[];
  }> = {},
) {
  const color = chartColors.primary[colorIndex % chartColors.primary.length];

  return {
    label,
    data,
    borderColor: color,
    backgroundColor: options.fill ? `${color}33` : color,
    fill: options.fill || false,
    borderDash: options.borderDash,
  };
}

// Create asset allocation dataset for doughnut charts
export function createAssetAllocationDataset(data: {
  equity?: number;
  debt?: number;
  gold?: number;
  realEstate?: number;
  cash?: number;
  crypto?: number;
  retirement?: number;
}) {
  const labels: string[] = [];
  const values: number[] = [];
  const colors: string[] = [];

  const assetMapping: Record<string, { label: string; color: string }> = {
    equity: { label: "Equity", color: chartColors.assetClasses.equity },
    debt: { label: "Debt", color: chartColors.assetClasses.debt },
    gold: { label: "Gold", color: chartColors.assetClasses.gold },
    realEstate: {
      label: "Real Estate",
      color: chartColors.assetClasses.realEstate,
    },
    cash: { label: "Cash", color: chartColors.assetClasses.cash },
    crypto: { label: "Crypto", color: chartColors.assetClasses.crypto },
    retirement: {
      label: "Retirement",
      color: chartColors.assetClasses.retirement,
    },
  };

  Object.entries(data).forEach(([key, value]) => {
    if (value && value > 0 && assetMapping[key]) {
      labels.push(assetMapping[key].label);
      values.push(value);
      colors.push(assetMapping[key].color);
    }
  });

  return {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        borderColor: "#ffffff",
        borderWidth: 2,
      },
    ],
  };
}
