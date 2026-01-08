/**
 * FIREKaro Chart.js Theme Configuration
 * ProjectionLab-inspired chart styling
 */

// Chart color palette - Updated for ProjectionLab aesthetic
export const chartColors = {
  // Primary palette for general charts - more vibrant, modern
  primary: [
    '#1867c0', // Primary blue
    '#14b8a6', // Teal
    '#10b981', // Emerald
    '#f97316', // Orange
    '#a855f7', // Purple
    '#06b6d4', // Cyan
    '#f43f5e', // Rose
    '#78716c', // Stone
  ],

  // Asset class colors for portfolio charts
  assetClasses: {
    equity: '#3b82f6',      // Blue-500 - Stocks, MF
    debt: '#10b981',        // Emerald-500 - Bonds, FD
    gold: '#eab308',        // Yellow-500 - Gold
    realEstate: '#78716c',  // Stone-500 - Property
    cash: '#64748b',        // Slate-500 - Liquid
    crypto: '#a855f7',      // Purple-500
    retirement: '#06b6d4',  // Cyan-500 - EPF, PPF, NPS
  },

  // FIRE progress colors - Updated
  fireProgress: {
    0: '#ef4444',    // 0-25% - Red-500
    25: '#f97316',   // 25-50% - Orange-500
    50: '#eab308',   // 50-75% - Yellow-500
    75: '#84cc16',   // 75-99% - Lime-500
    100: '#10b981',  // 100% - Emerald-500
  },

  // Income vs Expense
  incomeExpense: {
    income: '#10b981',   // Emerald
    expense: '#ef4444',  // Red
    savings: '#3b82f6',  // Blue
    crossover: '#eab308', // Yellow
  },

  // Positive/Negative
  sentiment: {
    positive: '#10b981',
    negative: '#ef4444',
    neutral: '#64748b',
  },

  // Gradients for area charts
  gradients: {
    primary: ['rgba(24, 103, 192, 0.3)', 'rgba(24, 103, 192, 0.05)'],
    success: ['rgba(16, 185, 129, 0.3)', 'rgba(16, 185, 129, 0.05)'],
    warning: ['rgba(249, 115, 22, 0.3)', 'rgba(249, 115, 22, 0.05)'],
    danger: ['rgba(239, 68, 68, 0.3)', 'rgba(239, 68, 68, 0.05)'],
    purple: ['rgba(168, 85, 247, 0.3)', 'rgba(168, 85, 247, 0.05)'],
  },

  // Confidence bands for projections
  confidenceBands: {
    inner: 'rgba(24, 103, 192, 0.2)',
    outer: 'rgba(24, 103, 192, 0.08)',
  },
}

// Get color for FIRE progress percentage
export function getFireProgressColor(percentage: number): string {
  if (percentage >= 100) return chartColors.fireProgress[100]
  if (percentage >= 75) return chartColors.fireProgress[75]
  if (percentage >= 50) return chartColors.fireProgress[50]
  if (percentage >= 25) return chartColors.fireProgress[25]
  return chartColors.fireProgress[0]
}

// ProjectionLab-style tooltip options
const tooltipOptions = {
  enabled: true,
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  titleColor: '#f1f5f9',
  bodyColor: '#cbd5e1',
  borderColor: 'rgba(255, 255, 255, 0.1)',
  borderWidth: 1,
  cornerRadius: 12,
  padding: {
    top: 12,
    right: 16,
    bottom: 12,
    left: 16,
  },
  titleFont: {
    family: "'Inter', sans-serif",
    size: 13,
    weight: 600 as const,
  },
  bodyFont: {
    family: "'JetBrains Mono', monospace",
    size: 12,
    weight: 500 as const,
  },
  displayColors: true,
  boxPadding: 6,
  boxWidth: 8,
  boxHeight: 8,
  usePointStyle: true,
}

// Common legend options
const legendOptions = {
  position: 'bottom' as const,
  align: 'center' as const,
  labels: {
    font: {
      family: "'Inter', sans-serif",
      size: 12,
      weight: 500 as const,
    },
    padding: 20,
    usePointStyle: true,
    pointStyle: 'circle' as const,
    boxWidth: 8,
    boxHeight: 8,
  },
}

// Line chart specific options
export const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    legend: legendOptions,
    tooltip: tooltipOptions,
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(0, 0, 0, 0.06)',
        drawBorder: false,
      },
      border: {
        display: false,
      },
      ticks: {
        font: {
          family: "'Inter', sans-serif",
          size: 11,
        },
        color: '#64748b',
      },
    },
    y: {
      grid: {
        color: 'rgba(0, 0, 0, 0.06)',
        drawBorder: false,
      },
      border: {
        display: false,
      },
      ticks: {
        font: {
          family: "'JetBrains Mono', monospace",
          size: 11,
        },
        color: '#64748b',
      },
    },
  },
  elements: {
    line: {
      tension: 0.35,
      borderWidth: 2.5,
    },
    point: {
      radius: 0,
      hoverRadius: 6,
      hoverBorderWidth: 2,
      hoverBackgroundColor: '#ffffff',
    },
  },
}

// Bar chart specific options
export const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: legendOptions,
    tooltip: tooltipOptions,
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      border: {
        display: false,
      },
      ticks: {
        font: {
          family: "'Inter', sans-serif",
          size: 11,
        },
        color: '#64748b',
      },
    },
    y: {
      grid: {
        color: 'rgba(0, 0, 0, 0.06)',
        drawBorder: false,
      },
      border: {
        display: false,
      },
      ticks: {
        font: {
          family: "'JetBrains Mono', monospace",
          size: 11,
        },
        color: '#64748b',
      },
    },
  },
}

// Doughnut/Pie chart specific options
export const doughnutChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%',
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        font: {
          family: "'Inter', sans-serif",
          size: 12,
          weight: 500 as const,
        },
        padding: 16,
        usePointStyle: true,
        pointStyle: 'circle' as const,
        boxWidth: 8,
        boxHeight: 8,
      },
    },
    tooltip: tooltipOptions,
  },
}

// Dark mode chart options (merge with default)
export const darkModeOverrides = {
  scales: {
    x: {
      grid: {
        color: 'rgba(255, 255, 255, 0.06)',
      },
      ticks: {
        color: '#94a3b8',
      },
    },
    y: {
      grid: {
        color: 'rgba(255, 255, 255, 0.06)',
      },
      ticks: {
        color: '#94a3b8',
      },
    },
  },
  plugins: {
    legend: {
      labels: {
        color: '#e2e8f0',
      },
    },
    tooltip: {
      backgroundColor: 'rgba(30, 41, 59, 0.95)',
    },
  },
}

// INR currency formatter for chart tooltips
export function formatINRForChart(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

// Percentage formatter for chart tooltips
export function formatPercentForChart(value: number): string {
  return `${value.toFixed(1)}%`
}

// Create gradient fill for area charts
export function createGradientFill(
  ctx: CanvasRenderingContext2D,
  chartArea: { top: number; bottom: number },
  colorKey: keyof typeof chartColors.gradients = 'primary'
): CanvasGradient {
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
  const colors = chartColors.gradients[colorKey]
  gradient.addColorStop(0, colors[0])
  gradient.addColorStop(1, colors[1])
  return gradient
}

// Create dataset with consistent styling
export function createDataset(
  label: string,
  data: number[],
  colorIndex: number = 0,
  options: Partial<{
    fill: boolean
    borderDash: number[]
    tension: number
  }> = {}
) {
  const color = chartColors.primary[colorIndex % chartColors.primary.length]

  return {
    label,
    data,
    borderColor: color,
    backgroundColor: options.fill ? `${color}20` : color,
    fill: options.fill || false,
    borderDash: options.borderDash,
    tension: options.tension ?? 0.35,
    pointRadius: 0,
    pointHoverRadius: 6,
    pointHoverBackgroundColor: '#ffffff',
    pointHoverBorderColor: color,
    pointHoverBorderWidth: 2,
  }
}

// Create confidence band dataset for projections
export function createConfidenceBandDataset(
  label: string,
  upperBound: number[],
  lowerBound: number[],
  mainData: number[],
  color: string = chartColors.primary[0]
) {
  return [
    {
      label: `${label} (Upper)`,
      data: upperBound,
      borderColor: 'transparent',
      backgroundColor: chartColors.confidenceBands.outer,
      fill: '+1',
      pointRadius: 0,
      tension: 0.35,
    },
    {
      label,
      data: mainData,
      borderColor: color,
      backgroundColor: chartColors.confidenceBands.inner,
      fill: false,
      borderWidth: 2.5,
      pointRadius: 0,
      pointHoverRadius: 6,
      tension: 0.35,
    },
    {
      label: `${label} (Lower)`,
      data: lowerBound,
      borderColor: 'transparent',
      backgroundColor: chartColors.confidenceBands.outer,
      fill: '-1',
      pointRadius: 0,
      tension: 0.35,
    },
  ]
}

// Create asset allocation dataset for doughnut charts
export function createAssetAllocationDataset(data: {
  equity?: number
  debt?: number
  gold?: number
  realEstate?: number
  cash?: number
  crypto?: number
  retirement?: number
}) {
  const labels: string[] = []
  const values: number[] = []
  const colors: string[] = []

  const assetMapping: Record<string, { label: string; color: string }> = {
    equity: { label: 'Equity', color: chartColors.assetClasses.equity },
    debt: { label: 'Debt', color: chartColors.assetClasses.debt },
    gold: { label: 'Gold', color: chartColors.assetClasses.gold },
    realEstate: { label: 'Real Estate', color: chartColors.assetClasses.realEstate },
    cash: { label: 'Cash', color: chartColors.assetClasses.cash },
    crypto: { label: 'Crypto', color: chartColors.assetClasses.crypto },
    retirement: { label: 'Retirement', color: chartColors.assetClasses.retirement },
  }

  Object.entries(data).forEach(([key, value]) => {
    if (value && value > 0 && assetMapping[key]) {
      labels.push(assetMapping[key].label)
      values.push(value)
      colors.push(assetMapping[key].color)
    }
  })

  return {
    labels,
    datasets: [{
      data: values,
      backgroundColor: colors,
      borderColor: 'rgba(255, 255, 255, 0.8)',
      borderWidth: 2,
      hoverBorderWidth: 3,
      hoverOffset: 8,
    }],
  }
}

// Get line/bar chart options with dark mode applied
export function getChartOptionsWithDarkMode(
  baseOptions: typeof lineChartOptions | typeof barChartOptions,
  isDarkMode: boolean = false
) {
  if (!isDarkMode) return baseOptions

  return {
    ...baseOptions,
    scales: {
      ...baseOptions.scales,
      ...darkModeOverrides.scales,
    },
    plugins: {
      ...baseOptions.plugins,
      legend: {
        ...baseOptions.plugins?.legend,
        labels: {
          ...(baseOptions.plugins?.legend as { labels?: object })?.labels,
          ...darkModeOverrides.plugins.legend.labels,
        },
      },
      tooltip: {
        ...baseOptions.plugins?.tooltip,
        ...darkModeOverrides.plugins.tooltip,
      },
    },
  }
}

// Get doughnut chart options with dark mode applied
export function getDoughnutOptionsWithDarkMode(
  isDarkMode: boolean = false
) {
  if (!isDarkMode) return doughnutChartOptions

  return {
    ...doughnutChartOptions,
    plugins: {
      ...doughnutChartOptions.plugins,
      legend: {
        ...doughnutChartOptions.plugins?.legend,
        labels: {
          ...doughnutChartOptions.plugins?.legend?.labels,
          color: '#e2e8f0',
        },
      },
      tooltip: {
        ...doughnutChartOptions.plugins?.tooltip,
        ...darkModeOverrides.plugins.tooltip,
      },
    },
  }
}
