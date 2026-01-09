<script setup lang="ts">
import { ref, computed } from "vue";
import { formatINR } from "@/composables/useIncome";

// Supported broker formats
const SUPPORTED_BROKERS = [
  {
    value: "zerodha",
    label: "Zerodha",
    icon: "mdi-alpha-z-circle",
    color: "orange",
    description: "P&L reports from Console",
    columns: ["symbol", "isin", "trade_date", "exchange", "segment", "trade_type", "quantity", "price", "trade_value"],
  },
  {
    value: "groww",
    label: "Groww",
    icon: "mdi-alpha-g-circle",
    color: "green",
    description: "Transaction history export",
    columns: ["Stock Name", "Symbol", "Transaction Type", "Quantity", "Price", "Date", "Exchange"],
  },
  {
    value: "upstox",
    label: "Upstox",
    icon: "mdi-alpha-u-circle",
    color: "purple",
    description: "Trade book export",
    columns: ["symbol", "trade_date", "trade_type", "quantity", "price", "exchange"],
  },
  {
    value: "angel",
    label: "Angel One",
    icon: "mdi-alpha-a-circle",
    color: "red",
    description: "Contract note export",
    columns: ["Symbol", "Trade Date", "Buy/Sell", "Qty", "Rate", "Exchange"],
  },
];

interface ParsedTransaction {
  id: string;
  symbol: string;
  assetName: string;
  transactionType: "BUY" | "SELL";
  quantity: number;
  price: number;
  date: string;
  exchange: string;
  totalValue: number;
  selected: boolean;
}

interface CapitalGainPreview {
  id: string;
  assetName: string;
  symbol: string;
  purchaseDate: string;
  purchasePrice: number;
  saleDate: string;
  salePrice: number;
  quantity: number;
  holdingPeriodMonths: number;
  gainType: "STCG" | "LTCG";
  gain: number;
  selected: boolean;
}

const emit = defineEmits<{
  (e: "import", gains: CapitalGainPreview[]): void;
}>();

// State
const selectedBroker = ref("zerodha");
const fileInput = ref<HTMLInputElement | null>(null);
const uploadedFile = ref<File | null>(null);
const isProcessing = ref(false);
const parseError = ref<string | null>(null);
const currentStep = ref(1);

// Parsed data
const parsedTransactions = ref<ParsedTransaction[]>([]);
const calculatedGains = ref<CapitalGainPreview[]>([]);

// File upload handling
function triggerFileUpload() {
  fileInput.value?.click();
}

async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  if (!file.name.endsWith(".csv")) {
    parseError.value = "Please upload a CSV file";
    return;
  }

  uploadedFile.value = file;
  parseError.value = null;
  isProcessing.value = true;

  try {
    const text = await file.text();
    parseCSV(text);
    currentStep.value = 2;
  } catch (error) {
    parseError.value = "Failed to read file. Please try again.";
  } finally {
    isProcessing.value = false;
  }
}

function parseCSV(content: string) {
  const lines = content.trim().split("\n");
  if (lines.length < 2) {
    parseError.value = "CSV file appears to be empty";
    return;
  }

  const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
  const transactions: ParsedTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 4) continue;

    const transaction = mapToTransaction(headers, values, selectedBroker.value);
    if (transaction) {
      transactions.push(transaction);
    }
  }

  parsedTransactions.value = transactions;

  if (transactions.length === 0) {
    parseError.value = "No valid transactions found in the CSV file. Please check the format.";
  }
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());

  return values;
}

function mapToTransaction(headers: string[], values: string[], broker: string): ParsedTransaction | null {
  try {
    let symbol = "";
    let transactionType: "BUY" | "SELL" = "BUY";
    let quantity = 0;
    let price = 0;
    let date = "";
    let exchange = "NSE";

    // Map based on broker format
    switch (broker) {
      case "zerodha":
        symbol = getValue(headers, values, ["symbol", "tradingsymbol"]);
        transactionType = getValue(headers, values, ["trade_type", "type"]).toUpperCase().includes("BUY") ? "BUY" : "SELL";
        quantity = parseFloat(getValue(headers, values, ["quantity", "qty"])) || 0;
        price = parseFloat(getValue(headers, values, ["price", "avg_price", "average_price"])) || 0;
        date = getValue(headers, values, ["trade_date", "date"]);
        exchange = getValue(headers, values, ["exchange"]) || "NSE";
        break;

      case "groww":
        symbol = getValue(headers, values, ["Symbol", "symbol", "Stock Symbol"]);
        transactionType = getValue(headers, values, ["Transaction Type", "type"]).toUpperCase().includes("BUY") ? "BUY" : "SELL";
        quantity = parseFloat(getValue(headers, values, ["Quantity", "quantity", "Qty"])) || 0;
        price = parseFloat(getValue(headers, values, ["Price", "price", "Rate"])) || 0;
        date = getValue(headers, values, ["Date", "date", "Trade Date"]);
        exchange = getValue(headers, values, ["Exchange", "exchange"]) || "NSE";
        break;

      case "upstox":
        symbol = getValue(headers, values, ["symbol", "scrip", "instrument"]);
        transactionType = getValue(headers, values, ["trade_type", "type", "side"]).toUpperCase().includes("BUY") ? "BUY" : "SELL";
        quantity = parseFloat(getValue(headers, values, ["quantity", "qty", "traded_qty"])) || 0;
        price = parseFloat(getValue(headers, values, ["price", "trade_price", "avg_price"])) || 0;
        date = getValue(headers, values, ["trade_date", "date", "order_date"]);
        exchange = getValue(headers, values, ["exchange"]) || "NSE";
        break;

      case "angel":
        symbol = getValue(headers, values, ["Symbol", "Scrip", "Script Name"]);
        transactionType = getValue(headers, values, ["Buy/Sell", "Type", "Transaction"]).toUpperCase().includes("BUY") ? "BUY" : "SELL";
        quantity = parseFloat(getValue(headers, values, ["Qty", "Quantity"])) || 0;
        price = parseFloat(getValue(headers, values, ["Rate", "Price", "Avg Rate"])) || 0;
        date = getValue(headers, values, ["Trade Date", "Date"]);
        exchange = getValue(headers, values, ["Exchange"]) || "NSE";
        break;
    }

    if (!symbol || quantity === 0 || price === 0) {
      return null;
    }

    // Normalize date format
    date = normalizeDate(date);

    return {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      symbol: symbol.toUpperCase(),
      assetName: symbol.toUpperCase(),
      transactionType,
      quantity: Math.abs(quantity),
      price,
      date,
      exchange,
      totalValue: Math.abs(quantity) * price,
      selected: true,
    };
  } catch {
    return null;
  }
}

function getValue(headers: string[], values: string[], possibleKeys: string[]): string {
  for (const key of possibleKeys) {
    const index = headers.findIndex(h => h.toLowerCase() === key.toLowerCase());
    if (index >= 0 && values[index]) {
      return values[index].replace(/"/g, "").trim();
    }
  }
  return "";
}

function normalizeDate(dateStr: string): string {
  if (!dateStr) return "";

  // Try different date formats
  const formats = [
    /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
    /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
    /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
    /(\d{2})-(\w{3})-(\d{4})/, // DD-MMM-YYYY
  ];

  // If already in ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // Try to parse common formats
  const parts = dateStr.split(/[-\/]/);
  if (parts.length === 3) {
    // Assume DD/MM/YYYY or DD-MM-YYYY
    if (parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
    // YYYY-MM-DD
    if (parts[0].length === 4) {
      return dateStr;
    }
  }

  return dateStr;
}

// Calculate capital gains from buy/sell pairs
function calculateCapitalGains() {
  const selectedTransactions = parsedTransactions.value.filter(t => t.selected);

  // Group by symbol
  const bySymbol = new Map<string, ParsedTransaction[]>();
  for (const t of selectedTransactions) {
    const existing = bySymbol.get(t.symbol) || [];
    existing.push(t);
    bySymbol.set(t.symbol, existing);
  }

  const gains: CapitalGainPreview[] = [];

  for (const [symbol, transactions] of bySymbol) {
    const buys = transactions.filter(t => t.transactionType === "BUY").sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const sells = transactions.filter(t => t.transactionType === "SELL").sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // FIFO matching
    let buyIndex = 0;
    let remainingBuyQty = buys[buyIndex]?.quantity || 0;

    for (const sell of sells) {
      let sellQty = sell.quantity;

      while (sellQty > 0 && buyIndex < buys.length) {
        const buy = buys[buyIndex];
        const matchQty = Math.min(sellQty, remainingBuyQty);

        if (matchQty > 0) {
          const purchaseDate = new Date(buy.date);
          const saleDate = new Date(sell.date);
          const holdingMonths = Math.floor((saleDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
          const gain = (sell.price - buy.price) * matchQty;

          gains.push({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            assetName: symbol,
            symbol,
            purchaseDate: buy.date,
            purchasePrice: buy.price * matchQty,
            saleDate: sell.date,
            salePrice: sell.price * matchQty,
            quantity: matchQty,
            holdingPeriodMonths: holdingMonths,
            gainType: holdingMonths >= 12 ? "LTCG" : "STCG",
            gain,
            selected: true,
          });
        }

        sellQty -= matchQty;
        remainingBuyQty -= matchQty;

        if (remainingBuyQty <= 0) {
          buyIndex++;
          remainingBuyQty = buys[buyIndex]?.quantity || 0;
        }
      }
    }
  }

  calculatedGains.value = gains;
  currentStep.value = 3;
}

function toggleAllTransactions(selected: boolean) {
  parsedTransactions.value.forEach(t => (t.selected = selected));
}

function toggleAllGains(selected: boolean) {
  calculatedGains.value.forEach(g => (g.selected = selected));
}

function importSelectedGains() {
  const selected = calculatedGains.value.filter(g => g.selected);
  emit("import", selected);
  resetForm();
}

function resetForm() {
  currentStep.value = 1;
  uploadedFile.value = null;
  parsedTransactions.value = [];
  calculatedGains.value = [];
  parseError.value = null;
  if (fileInput.value) {
    fileInput.value.value = "";
  }
}

// Summary computations
const transactionsSummary = computed(() => {
  const selected = parsedTransactions.value.filter(t => t.selected);
  const buys = selected.filter(t => t.transactionType === "BUY");
  const sells = selected.filter(t => t.transactionType === "SELL");
  return {
    total: selected.length,
    buys: buys.length,
    sells: sells.length,
    buyValue: buys.reduce((sum, t) => sum + t.totalValue, 0),
    sellValue: sells.reduce((sum, t) => sum + t.totalValue, 0),
  };
});

const gainsSummary = computed(() => {
  const selected = calculatedGains.value.filter(g => g.selected);
  const stcg = selected.filter(g => g.gainType === "STCG");
  const ltcg = selected.filter(g => g.gainType === "LTCG");
  return {
    total: selected.length,
    totalGain: selected.reduce((sum, g) => sum + g.gain, 0),
    stcgCount: stcg.length,
    stcgGain: stcg.reduce((sum, g) => sum + g.gain, 0),
    ltcgCount: ltcg.length,
    ltcgGain: ltcg.reduce((sum, g) => sum + g.gain, 0),
  };
});
</script>

<template>
  <v-card class="mb-4">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2" color="primary">mdi-file-upload</v-icon>
      Import from Broker
      <v-chip class="ml-2" size="small" color="info" variant="tonal">
        CSV Import
      </v-chip>
    </v-card-title>

    <v-card-text>
      <!-- Stepper -->
      <v-stepper v-model="currentStep" :items="['Select Broker', 'Review Transactions', 'Preview Gains']" alt-labels class="mb-4">
        <!-- Step 1: Select Broker & Upload -->
        <template #item.1>
          <div class="pa-4">
            <div class="text-subtitle-2 mb-3">Select Your Broker</div>
            <v-chip-group v-model="selectedBroker" mandatory selected-class="text-primary">
              <v-chip
                v-for="broker in SUPPORTED_BROKERS"
                :key="broker.value"
                :value="broker.value"
                filter
                variant="outlined"
              >
                <v-icon start :color="broker.color">{{ broker.icon }}</v-icon>
                {{ broker.label }}
              </v-chip>
            </v-chip-group>

            <v-alert type="info" variant="tonal" density="compact" class="my-4">
              <template #prepend>
                <v-icon>mdi-information</v-icon>
              </template>
              <div class="text-body-2">
                <strong>{{ SUPPORTED_BROKERS.find(b => b.value === selectedBroker)?.label }}:</strong>
                {{ SUPPORTED_BROKERS.find(b => b.value === selectedBroker)?.description }}
              </div>
            </v-alert>

            <v-divider class="my-4" />

            <div class="text-subtitle-2 mb-3">Upload CSV File</div>

            <input
              ref="fileInput"
              type="file"
              accept=".csv"
              hidden
              @change="handleFileUpload"
            />

            <v-card
              variant="outlined"
              class="pa-6 text-center cursor-pointer"
              :class="{ 'border-primary': uploadedFile }"
              @click="triggerFileUpload"
            >
              <v-icon size="48" :color="uploadedFile ? 'primary' : 'grey'">
                {{ uploadedFile ? 'mdi-file-check' : 'mdi-cloud-upload' }}
              </v-icon>
              <div class="text-body-1 mt-2">
                {{ uploadedFile ? uploadedFile.name : 'Click to upload CSV file' }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ uploadedFile ? `${(uploadedFile.size / 1024).toFixed(1)} KB` : 'Supported: .csv files' }}
              </div>
            </v-card>

            <v-alert v-if="parseError" type="error" variant="tonal" density="compact" class="mt-4">
              {{ parseError }}
            </v-alert>

            <v-progress-linear v-if="isProcessing" indeterminate color="primary" class="mt-4" />
          </div>
        </template>

        <!-- Step 2: Review Transactions -->
        <template #item.2>
          <div class="pa-4">
            <div class="d-flex align-center mb-4">
              <div class="text-subtitle-2">Review Parsed Transactions</div>
              <v-spacer />
              <v-btn size="small" variant="text" @click="toggleAllTransactions(true)">Select All</v-btn>
              <v-btn size="small" variant="text" @click="toggleAllTransactions(false)">Deselect All</v-btn>
            </div>

            <!-- Summary -->
            <v-row class="mb-4">
              <v-col cols="6" md="3">
                <v-card variant="tonal" color="info">
                  <v-card-text class="text-center py-2">
                    <div class="text-h6">{{ transactionsSummary.total }}</div>
                    <div class="text-caption">Selected</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="6" md="3">
                <v-card variant="tonal" color="success">
                  <v-card-text class="text-center py-2">
                    <div class="text-h6">{{ transactionsSummary.buys }}</div>
                    <div class="text-caption">Buys</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="6" md="3">
                <v-card variant="tonal" color="error">
                  <v-card-text class="text-center py-2">
                    <div class="text-h6">{{ transactionsSummary.sells }}</div>
                    <div class="text-caption">Sells</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="6" md="3">
                <v-card variant="tonal" color="warning">
                  <v-card-text class="text-center py-2">
                    <div class="text-h6 text-currency">{{ formatINR(transactionsSummary.sellValue - transactionsSummary.buyValue) }}</div>
                    <div class="text-caption">Net Value</div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Transactions Table -->
            <v-data-table
              :headers="[
                { title: '', key: 'selected', width: 50 },
                { title: 'Symbol', key: 'symbol' },
                { title: 'Type', key: 'transactionType' },
                { title: 'Qty', key: 'quantity', align: 'end' },
                { title: 'Price', key: 'price', align: 'end' },
                { title: 'Date', key: 'date' },
                { title: 'Value', key: 'totalValue', align: 'end' },
              ]"
              :items="parsedTransactions"
              :items-per-page="10"
              density="compact"
            >
              <template #item.selected="{ item }">
                <v-checkbox v-model="item.selected" hide-details density="compact" />
              </template>
              <template #item.transactionType="{ item }">
                <v-chip size="x-small" :color="item.transactionType === 'BUY' ? 'success' : 'error'">
                  {{ item.transactionType }}
                </v-chip>
              </template>
              <template #item.price="{ item }">
                <span class="text-currency">{{ formatINR(item.price) }}</span>
              </template>
              <template #item.totalValue="{ item }">
                <span class="text-currency">{{ formatINR(item.totalValue) }}</span>
              </template>
            </v-data-table>

            <div class="d-flex gap-2 mt-4">
              <v-btn variant="outlined" @click="currentStep = 1">Back</v-btn>
              <v-spacer />
              <v-btn
                color="primary"
                :disabled="transactionsSummary.total === 0"
                @click="calculateCapitalGains"
              >
                Calculate Gains
              </v-btn>
            </div>
          </div>
        </template>

        <!-- Step 3: Preview Capital Gains -->
        <template #item.3>
          <div class="pa-4">
            <div class="d-flex align-center mb-4">
              <div class="text-subtitle-2">Preview Capital Gains</div>
              <v-spacer />
              <v-btn size="small" variant="text" @click="toggleAllGains(true)">Select All</v-btn>
              <v-btn size="small" variant="text" @click="toggleAllGains(false)">Deselect All</v-btn>
            </div>

            <!-- Summary -->
            <v-row class="mb-4">
              <v-col cols="6" md="3">
                <v-card variant="tonal" color="info">
                  <v-card-text class="text-center py-2">
                    <div class="text-h6">{{ gainsSummary.total }}</div>
                    <div class="text-caption">Total Trades</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="6" md="3">
                <v-card variant="tonal" :color="gainsSummary.totalGain >= 0 ? 'success' : 'error'">
                  <v-card-text class="text-center py-2">
                    <div class="text-h6 text-currency">{{ formatINR(gainsSummary.totalGain) }}</div>
                    <div class="text-caption">Total Gain/Loss</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="6" md="3">
                <v-card variant="tonal" color="warning">
                  <v-card-text class="text-center py-2">
                    <div class="text-h6 text-currency">{{ formatINR(gainsSummary.stcgGain) }}</div>
                    <div class="text-caption">STCG ({{ gainsSummary.stcgCount }})</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="6" md="3">
                <v-card variant="tonal" color="success">
                  <v-card-text class="text-center py-2">
                    <div class="text-h6 text-currency">{{ formatINR(gainsSummary.ltcgGain) }}</div>
                    <div class="text-caption">LTCG ({{ gainsSummary.ltcgCount }})</div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Gains Table -->
            <v-data-table
              :headers="[
                { title: '', key: 'selected', width: 50 },
                { title: 'Asset', key: 'assetName' },
                { title: 'Buy Date', key: 'purchaseDate' },
                { title: 'Buy Price', key: 'purchasePrice', align: 'end' },
                { title: 'Sell Date', key: 'saleDate' },
                { title: 'Sell Price', key: 'salePrice', align: 'end' },
                { title: 'Holding', key: 'holdingPeriodMonths', align: 'center' },
                { title: 'Type', key: 'gainType', align: 'center' },
                { title: 'Gain/Loss', key: 'gain', align: 'end' },
              ]"
              :items="calculatedGains"
              :items-per-page="10"
              density="compact"
            >
              <template #item.selected="{ item }">
                <v-checkbox v-model="item.selected" hide-details density="compact" />
              </template>
              <template #item.purchasePrice="{ item }">
                <span class="text-currency">{{ formatINR(item.purchasePrice) }}</span>
              </template>
              <template #item.salePrice="{ item }">
                <span class="text-currency">{{ formatINR(item.salePrice) }}</span>
              </template>
              <template #item.holdingPeriodMonths="{ item }">
                {{ item.holdingPeriodMonths }} mo
              </template>
              <template #item.gainType="{ item }">
                <v-chip size="x-small" :color="item.gainType === 'LTCG' ? 'success' : 'warning'">
                  {{ item.gainType }}
                </v-chip>
              </template>
              <template #item.gain="{ item }">
                <span class="text-currency" :class="item.gain >= 0 ? 'text-success' : 'text-error'">
                  {{ formatINR(item.gain) }}
                </span>
              </template>
            </v-data-table>

            <v-alert v-if="calculatedGains.length === 0" type="warning" variant="tonal" class="mt-4">
              <v-icon class="mr-2">mdi-alert</v-icon>
              No matching buy-sell pairs found. Make sure you have both buy and sell transactions for the same symbol.
            </v-alert>

            <div class="d-flex gap-2 mt-4">
              <v-btn variant="outlined" @click="currentStep = 2">Back</v-btn>
              <v-btn variant="outlined" @click="resetForm">Start Over</v-btn>
              <v-spacer />
              <v-btn
                color="primary"
                :disabled="gainsSummary.total === 0"
                @click="importSelectedGains"
              >
                <v-icon start>mdi-import</v-icon>
                Import {{ gainsSummary.total }} Gains
              </v-btn>
            </div>
          </div>
        </template>
      </v-stepper>

      <!-- Help Section -->
      <v-expansion-panels class="mt-4">
        <v-expansion-panel>
          <v-expansion-panel-title>
            <v-icon class="mr-2" size="small">mdi-help-circle</v-icon>
            How to export from your broker
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-tabs density="compact">
              <v-tab v-for="broker in SUPPORTED_BROKERS" :key="broker.value">
                {{ broker.label }}
              </v-tab>
            </v-tabs>
            <div class="pa-4">
              <div class="text-body-2">
                <strong>Zerodha:</strong>
                <ol class="ml-4 mt-2">
                  <li>Login to <a href="https://console.zerodha.com" target="_blank">Console</a></li>
                  <li>Go to Reports → Tax P&L</li>
                  <li>Select the financial year</li>
                  <li>Click "Download" to get CSV</li>
                </ol>
              </div>
              <div class="text-body-2 mt-4">
                <strong>Groww:</strong>
                <ol class="ml-4 mt-2">
                  <li>Login to Groww app/website</li>
                  <li>Go to Stocks → Transactions</li>
                  <li>Click "Download Statement"</li>
                  <li>Select date range and download CSV</li>
                </ol>
              </div>
              <div class="text-body-2 mt-4">
                <strong>Upstox:</strong>
                <ol class="ml-4 mt-2">
                  <li>Login to Upstox Pro</li>
                  <li>Go to Portfolio → Trade Book</li>
                  <li>Select date range</li>
                  <li>Export as CSV</li>
                </ol>
              </div>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
