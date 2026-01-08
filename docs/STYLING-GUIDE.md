# FIREKaro Vue 3 Styling Guide

> **Theme**: ProjectionLab-inspired design
> **Last Updated**: January 8, 2026

---

## Color System

### Primary Colors (Vuetify)
```vue
<v-btn color="primary">Button</v-btn>     <!-- #1867c0 -->
<v-btn color="secondary">Button</v-btn>   <!-- #26a69a -->
<v-btn color="success">Button</v-btn>     <!-- #4caf50 -->
<v-btn color="warning">Button</v-btn>     <!-- #fb8c00 -->
<v-btn color="error">Button</v-btn>       <!-- #ff5252 -->
```

### Custom FIREKaro Colors
```vue
<v-chip color="fire-orange">FIRE</v-chip>
<v-chip color="fire-green">Healthy</v-chip>
<v-chip color="fire-blue">Action</v-chip>
<v-chip color="fire-gold">Achievement</v-chip>
```

### Financial Status (CSS Classes)
```html
<!-- Positive/Negative values -->
<span class="text-positive">+₹50,000</span>
<span class="text-negative">-₹10,000</span>
<span class="text-neutral">₹0</span>

<!-- FIRE Progress -->
<span class="fire-progress-0">25%</span>    <!-- Red -->
<span class="fire-progress-25">40%</span>   <!-- Orange -->
<span class="fire-progress-50">60%</span>   <!-- Yellow -->
<span class="fire-progress-75">85%</span>   <!-- Light Green -->
<span class="fire-progress-100">100%</span> <!-- Green -->

<!-- Asset Classes -->
<span class="asset-equity">Stocks</span>
<span class="asset-debt">Bonds</span>
<span class="asset-gold">Gold</span>
<span class="asset-retirement">EPF/PPF</span>
```

---

## Typography

### Fonts
- **Primary**: Inter (body text, labels)
- **Monospace**: JetBrains Mono (numbers, currency)

### Currency Display
```html
<!-- Use monospace for currency values -->
<span class="text-currency">₹1,50,000</span>
<span class="text-large-currency">₹25,00,000</span>
<span class="text-xl-currency">₹1,00,00,000</span>
```

### INR Formatting (JavaScript)
```typescript
const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)

// Usage: formatINR(150000) → "₹1,50,000"
```

---

## Components

### Cards

```vue
<!-- Standard Card -->
<v-card>
  <v-card-title>Title</v-card-title>
  <v-card-text>Content</v-card-text>
</v-card>

<!-- Metric Card (for KPIs) -->
<v-card class="metric-card pa-4">
  <div class="metric-label">Total Savings</div>
  <div class="metric-value">₹25,00,000</div>
</v-card>
```

### Forms (Vuetify Defaults Applied)
```vue
<!-- All form fields use variant="outlined" density="comfortable" by default -->
<v-text-field label="Amount" type="number" />
<v-select label="Category" :items="categories" />
<v-autocomplete label="Search" :items="items" />
```

### Data Tables
```vue
<v-data-table
  :headers="headers"
  :items="items"
  hover
>
  <!-- Currency columns should be right-aligned -->
  <template #item.amount="{ item }">
    <span class="text-right text-currency">
      {{ formatINR(item.amount) }}
    </span>
  </template>
</v-data-table>
```

### Buttons
```vue
<!-- Primary actions -->
<v-btn color="primary">Save</v-btn>
<v-btn color="secondary">Export</v-btn>

<!-- Destructive actions -->
<v-btn color="error" variant="outlined">Delete</v-btn>

<!-- Icon buttons -->
<v-btn icon="mdi-plus" color="primary" />
```

---

## Charts (Chart.js)

### Import Theme
```typescript
import {
  chartColors,
  lineChartOptions,
  barChartOptions,
  doughnutChartOptions,
  createAssetAllocationDataset,
  formatINRForChart,
  getFireProgressColor
} from '@/utils/chartTheme'
```

### Line Chart Example
```vue
<template>
  <div class="chart-container">
    <Line :data="chartData" :options="lineChartOptions" />
  </div>
</template>

<script setup>
import { Line } from 'vue-chartjs'
import { lineChartOptions, chartColors } from '@/utils/chartTheme'

const chartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
  datasets: [{
    label: 'Net Worth',
    data: [100000, 120000, 115000, 140000, 160000],
    borderColor: chartColors.primary[0],
    fill: false
  }]
}
</script>
```

### Asset Allocation Doughnut
```typescript
import { createAssetAllocationDataset, doughnutChartOptions } from '@/utils/chartTheme'

const chartData = createAssetAllocationDataset({
  equity: 500000,
  debt: 300000,
  gold: 100000,
  retirement: 400000
})
```

### Chart Color Palette
| Index | Color | Use Case |
|-------|-------|----------|
| 0 | #1867c0 | Primary series |
| 1 | #26a69a | Secondary series |
| 2 | #4caf50 | Income / Positive |
| 3 | #ff9800 | Warning / Caution |
| 4 | #9c27b0 | Accent |
| 5 | #00bcd4 | Info |

---

## Layout

### Section Header
```vue
<SectionHeader
  title="Expenses"
  subtitle="Track and manage your spending"
  icon="mdi-cart-outline"
  :tabs="tabs"
/>
```

### Summary Cards Row
```vue
<v-row>
  <v-col cols="12" md="4">
    <v-card class="pa-4">
      <div class="text-body-2 text-medium-emphasis">This Month</div>
      <div class="text-h5 font-weight-bold text-currency">₹45,000</div>
    </v-card>
  </v-col>
  <!-- More cards... -->
</v-row>
```

### Chart Container
```vue
<!-- Standard height (300px) -->
<div class="chart-container">
  <Line :data="data" :options="options" />
</div>

<!-- Small (200px) -->
<div class="chart-container-sm">...</div>

<!-- Large (400px) -->
<div class="chart-container-lg">...</div>
```

---

## Dark Mode

Dark mode is automatic via Vuetify. Custom classes adapt:

```css
/* Light mode */
.v-theme--light .custom-element { color: #1a1a1a; }

/* Dark mode */
.v-theme--dark .custom-element { color: #e0e0e0; }
```

For charts, use dark mode overrides:
```typescript
import { darkModeOverrides } from '@/utils/chartTheme'

// Merge with your options when dark mode is active
const options = isDark ? { ...lineChartOptions, ...darkModeOverrides } : lineChartOptions
```

---

## Icons

Use Material Design Icons (`mdi-*`):

```vue
<v-icon>mdi-currency-inr</v-icon>
<v-icon>mdi-chart-line</v-icon>
<v-icon>mdi-fire</v-icon>
<v-icon>mdi-bank</v-icon>
<v-icon>mdi-wallet</v-icon>
<v-icon>mdi-shield-check</v-icon>
```

Common icons by section:
| Section | Icon |
|---------|------|
| Salary | mdi-cash |
| Non-Salary Income | mdi-cash-multiple |
| Tax Planning | mdi-calculator |
| Expenses | mdi-cart-outline |
| Investments | mdi-chart-line |
| Liabilities | mdi-credit-card-outline |
| Protection | mdi-shield-check |
| Financial Health | mdi-heart-pulse |
| FIRE & Goals | mdi-fire |

---

## Responsive Design

Vuetify grid breakpoints:
- `xs`: < 600px (mobile)
- `sm`: 600-960px (tablet)
- `md`: 960-1264px (laptop)
- `lg`: 1264-1904px (desktop)
- `xl`: > 1904px (large screens)

```vue
<v-row>
  <v-col cols="12" sm="6" md="4" lg="3">
    <!-- Responsive card -->
  </v-col>
</v-row>
```

---

## Best Practices

1. **Always use `text-currency` class** for monetary values
2. **Use `formatINR()` helper** for dynamic values
3. **Use Vuetify color props** (`color="primary"`) not inline styles
4. **Use CSS variables** for custom colors (`var(--asset-equity)`)
5. **Import chart theme** for consistent chart styling
6. **Use `getFireProgressColor()`** for FIRE progress indicators
7. **Keep charts in `.chart-container`** for proper sizing
