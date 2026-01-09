<script setup lang="ts">
import { ref, computed } from "vue";
import { formatINR } from "@/composables/useIncome";

// Relative categories that are exempt
const EXEMPT_RELATIVES = [
  { value: "spouse", label: "Spouse", description: "Husband/Wife" },
  { value: "parent", label: "Parent", description: "Father/Mother" },
  { value: "child", label: "Child", description: "Son/Daughter" },
  { value: "sibling", label: "Sibling", description: "Brother/Sister" },
  { value: "spouse_sibling", label: "Spouse's Sibling", description: "Brother/Sister of Spouse" },
  { value: "sibling_spouse", label: "Sibling's Spouse", description: "Spouse of Brother/Sister" },
  { value: "parent_sibling", label: "Parent's Sibling", description: "Uncle/Aunt (paternal/maternal)" },
  { value: "grandparent", label: "Grandparent", description: "Grandfather/Grandmother" },
  { value: "grandchild", label: "Grandchild", description: "Grandson/Granddaughter" },
  { value: "spouse_parent", label: "Spouse's Parent", description: "Father-in-law/Mother-in-law" },
];

// Gift types
const GIFT_TYPES = [
  { value: "cash", label: "Cash/Bank Transfer" },
  { value: "property", label: "Immovable Property" },
  { value: "jewelry", label: "Jewelry/Gold" },
  { value: "shares", label: "Shares/Securities" },
  { value: "other", label: "Other Movable Property" },
];

// Form data
const giftAmount = ref<number>(0);
const giftType = ref("cash");
const giverRelationship = ref("");
const isFromRelative = ref<boolean | null>(null);
const occasion = ref("");

// Exemption limit for non-relatives
const NON_RELATIVE_EXEMPTION_LIMIT = 50000;

// Calculate tax implication
const taxImplication = computed(() => {
  if (giftAmount.value <= 0) return null;

  // Check if from relative (fully exempt)
  if (isFromRelative.value === true && giverRelationship.value) {
    return {
      isExempt: true,
      exemptAmount: giftAmount.value,
      taxableAmount: 0,
      reason: `Gift from ${EXEMPT_RELATIVES.find(r => r.value === giverRelationship.value)?.label || 'relative'} is fully exempt under Section 56(2)(x)`,
      section: "56(2)(x)",
      itrDisclosure: "No disclosure required for gifts from relatives",
    };
  }

  // Non-relative gift
  if (isFromRelative.value === false) {
    if (giftAmount.value <= NON_RELATIVE_EXEMPTION_LIMIT) {
      return {
        isExempt: true,
        exemptAmount: giftAmount.value,
        taxableAmount: 0,
        reason: `Gift up to ₹${NON_RELATIVE_EXEMPTION_LIMIT.toLocaleString('en-IN')} from non-relatives is exempt`,
        section: "56(2)(x)",
        itrDisclosure: "No disclosure required",
      };
    } else {
      // Entire amount is taxable (not just excess)
      return {
        isExempt: false,
        exemptAmount: 0,
        taxableAmount: giftAmount.value,
        reason: `Gifts exceeding ₹${NON_RELATIVE_EXEMPTION_LIMIT.toLocaleString('en-IN')} from non-relatives are FULLY taxable`,
        section: "56(2)(x)",
        itrDisclosure: "Must be disclosed under 'Income from Other Sources'",
        warning: "The ENTIRE gift amount is taxable, not just the excess over ₹50,000",
      };
    }
  }

  return null;
});

// Special exemptions
const specialExemptions = computed(() => {
  const exemptions = [];

  // Marriage gift
  if (occasion.value === "marriage") {
    exemptions.push({
      applicable: true,
      description: "Gifts received on marriage are exempt (regardless of amount or giver)",
      icon: "mdi-ring",
    });
  }

  // Inheritance
  if (occasion.value === "inheritance") {
    exemptions.push({
      applicable: true,
      description: "Property received by inheritance/will is not considered a gift and is exempt",
      icon: "mdi-script-text",
    });
  }

  // Death contemplation
  if (occasion.value === "death") {
    exemptions.push({
      applicable: true,
      description: "Gifts received in contemplation of death of the donor are exempt",
      icon: "mdi-account-clock",
    });
  }

  return exemptions;
});

function reset() {
  giftAmount.value = 0;
  giftType.value = "cash";
  giverRelationship.value = "";
  isFromRelative.value = null;
  occasion.value = "";
}
</script>

<template>
  <v-card class="mb-4">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2" color="pink">mdi-gift</v-icon>
      Gift Exemption Calculator
    </v-card-title>

    <v-card-text>
      <!-- Info Alert -->
      <v-alert type="info" variant="tonal" density="compact" class="mb-4">
        <div class="d-flex align-center">
          <v-icon class="mr-2">mdi-information</v-icon>
          <div>
            Under <strong>Section 56(2)(x)</strong>, gifts received are taxable as
            "Income from Other Sources" unless they fall under specific exemptions.
          </div>
        </div>
      </v-alert>

      <v-row>
        <v-col cols="12" md="6">
          <!-- Gift Details -->
          <v-text-field
            v-model.number="giftAmount"
            label="Gift Value/Amount"
            type="number"
            prefix="₹"
            hint="Fair market value of the gift"
            persistent-hint
            class="mb-4"
          />

          <v-select
            v-model="giftType"
            label="Type of Gift"
            :items="GIFT_TYPES"
            item-title="label"
            item-value="value"
            class="mb-4"
          />

          <v-select
            v-model="occasion"
            label="Occasion (if applicable)"
            :items="[
              { title: 'No specific occasion', value: '' },
              { title: 'Marriage', value: 'marriage' },
              { title: 'Inheritance/Will', value: 'inheritance' },
              { title: 'In contemplation of death', value: 'death' },
              { title: 'Birthday/Anniversary', value: 'birthday' },
            ]"
            item-title="title"
            item-value="value"
            class="mb-4"
          />
        </v-col>

        <v-col cols="12" md="6">
          <!-- Relationship Section -->
          <div class="text-subtitle-2 mb-2">Who is the gift from?</div>

          <v-radio-group v-model="isFromRelative" class="mb-4">
            <v-radio :value="true" label="From a Relative (listed below)" />
            <v-radio :value="false" label="From Non-Relative (friend, colleague, etc.)" />
          </v-radio-group>

          <v-select
            v-if="isFromRelative === true"
            v-model="giverRelationship"
            label="Select Relationship"
            :items="EXEMPT_RELATIVES"
            item-title="label"
            item-value="value"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props">
                <template #subtitle>{{ item.raw.description }}</template>
              </v-list-item>
            </template>
          </v-select>
        </v-col>
      </v-row>

      <!-- Special Exemptions -->
      <v-expand-transition>
        <div v-if="specialExemptions.length > 0" class="mb-4">
          <v-alert type="success" variant="tonal">
            <div class="font-weight-medium mb-2">Special Exemption Applies!</div>
            <v-list density="compact" class="bg-transparent">
              <v-list-item
                v-for="(exemption, index) in specialExemptions"
                :key="index"
                class="px-0"
              >
                <template #prepend>
                  <v-icon :icon="exemption.icon" color="success" size="small" />
                </template>
                <v-list-item-title class="text-body-2">
                  {{ exemption.description }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-alert>
        </div>
      </v-expand-transition>

      <!-- Result -->
      <v-expand-transition>
        <div v-if="taxImplication">
          <v-divider class="my-4" />

          <v-card
            :color="taxImplication.isExempt ? 'success' : 'error'"
            variant="tonal"
            class="mb-4"
          >
            <v-card-text>
              <div class="d-flex align-center mb-3">
                <v-avatar
                  :color="taxImplication.isExempt ? 'success' : 'error'"
                  size="48"
                  class="mr-3"
                >
                  <v-icon>
                    {{ taxImplication.isExempt ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                  </v-icon>
                </v-avatar>
                <div>
                  <div class="text-h6">
                    {{ taxImplication.isExempt ? 'Gift is Exempt' : 'Gift is Taxable' }}
                  </div>
                  <div class="text-body-2">{{ taxImplication.reason }}</div>
                </div>
              </div>

              <v-table density="compact" class="bg-transparent">
                <tbody>
                  <tr>
                    <td>Gift Value</td>
                    <td class="text-end text-currency">{{ formatINR(giftAmount) }}</td>
                  </tr>
                  <tr>
                    <td>Exempt Amount</td>
                    <td class="text-end text-currency text-success">{{ formatINR(taxImplication.exemptAmount) }}</td>
                  </tr>
                  <tr class="font-weight-bold">
                    <td>Taxable Amount</td>
                    <td class="text-end text-currency" :class="taxImplication.taxableAmount > 0 ? 'text-error' : ''">
                      {{ formatINR(taxImplication.taxableAmount) }}
                    </td>
                  </tr>
                </tbody>
              </v-table>

              <v-alert
                v-if="taxImplication.warning"
                type="warning"
                variant="outlined"
                density="compact"
                class="mt-3"
              >
                <strong>Important:</strong> {{ taxImplication.warning }}
              </v-alert>
            </v-card-text>
          </v-card>

          <!-- ITR Disclosure -->
          <v-card variant="outlined" class="mb-4">
            <v-card-text>
              <div class="d-flex align-center">
                <v-icon class="mr-2" color="info">mdi-file-document</v-icon>
                <div>
                  <div class="text-subtitle-2">ITR Disclosure</div>
                  <div class="text-body-2 text-medium-emphasis">
                    {{ taxImplication.itrDisclosure }}
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <v-btn variant="outlined" @click="reset">Calculate Another Gift</v-btn>
        </div>
      </v-expand-transition>

      <!-- Relative Reference -->
      <v-divider class="my-4" />

      <div class="text-subtitle-2 mb-2">
        <v-icon size="small" class="mr-1">mdi-account-group</v-icon>
        Relatives Exempt Under Section 56(2)(x)
      </div>

      <v-chip-group>
        <v-chip
          v-for="relative in EXEMPT_RELATIVES"
          :key="relative.value"
          size="small"
          variant="tonal"
          color="success"
        >
          {{ relative.label }}
        </v-chip>
      </v-chip-group>

      <v-alert type="warning" variant="tonal" density="compact" class="mt-4">
        <strong>Note:</strong> Friends, colleagues, neighbors, and distant relatives
        (like cousins) are NOT considered relatives for tax purposes. Gifts from
        them exceeding ₹50,000 are fully taxable.
      </v-alert>
    </v-card-text>
  </v-card>
</template>
