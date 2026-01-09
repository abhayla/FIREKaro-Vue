/**
 * Seed Script for System Salary Components
 *
 * Run with: npx tsx prisma/seed-salary-components.ts
 *
 * This seeds 28 system-level salary component definitions that are available
 * to all users. Users can also create custom components linked to their userId.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// System Salary Components based on Salary-Section-Plan.md
const SYSTEM_COMPONENTS = [
  // ============================================
  // EARNINGS (12 components)
  // ============================================
  {
    code: 'BASIC',
    name: 'Basic Salary',
    componentType: 'EARNING',
    category: 'Fixed',
    isTaxable: true,
    taxSection: null,
    isExemptUpTo: null,
    syncTarget: 'NONE',
    syncDirection: 'FROM_SALARY',
    isExpandable: false,
    parentCode: null,
    isSystem: true,
    isActive: true,
    displayOrder: 1,
    userId: null,
  },
  {
    code: 'HRA',
    name: 'House Rent Allowance',
    componentType: 'EARNING',
    category: 'Fixed',
    isTaxable: true,
    taxSection: '10(13A)',
    isExemptUpTo: null, // Partial exemption based on rent paid
    syncTarget: 'NONE',
    syncDirection: 'FROM_SALARY',
    isExpandable: false,
    parentCode: null,
    isSystem: true,
    isActive: true,
    displayOrder: 2,
    userId: null,
  },
  {
    code: 'DA',
    name: 'Dearness Allowance',
    componentType: 'EARNING',
    category: 'Fixed',
    isTaxable: true,
    taxSection: null,
    isExemptUpTo: null,
    syncTarget: 'NONE',
    syncDirection: 'FROM_SALARY',
    isExpandable: false,
    parentCode: null,
    isSystem: true,
    isActive: true,
    displayOrder: 3,
    userId: null,
  },
  {
    code: 'CONVEYANCE',
    name: 'Conveyance Allowance',
    componentType: 'EARNING',
    category: 'Fixed',
    isTaxable: true,
    taxSection: null,
    isExemptUpTo: null,
    syncTarget: 'NONE',
    syncDirection: 'FROM_SALARY',
    isExpandable: false,
    parentCode: null,
    isSystem: true,
    isActive: true,
    displayOrder: 4,
    userId: null,
  },
  {
    code: 'MEDICAL',
    name: 'Medical Allowance',
    componentType: 'EARNING',
    category: 'Fixed',
    isTaxable: true,
    taxSection: null,
    isExemptUpTo: null,
    syncTarget: 'NONE',
    syncDirection: 'FROM_SALARY',
    isExpandable: false,
    parentCode: null,
    isSystem: true,
    isActive: true,
    displayOrder: 5,
    userId: null,
  },
  {
    code: 'SPECIAL',
    name: 'Special Allowance',
    componentType: 'EARNING',
    category: 'Fixed',
    isTaxable: true,
    taxSection: null,
    isExemptUpTo: null,
    syncTarget: 'NONE',
    syncDirection: 'FROM_SALARY',
    isExpandable: false,
    parentCode: null,
    isSystem: true,
    isActive: true,
    displayOrder: 6,
    userId: null,
  },
  {
    code: 'LTA',
    name: 'Leave Travel Allowance',
    componentType: 'EARNING',
    category: 'Variable',
    isTaxable: true,
    taxSection: '10(5)',
    isExemptUpTo: null, // Partial exemption based on actual travel
    syncTarget: 'NONE',
    syncDirection: 'FROM_SALARY',
    isExpandable: false,
    parentCode: null,
    isSystem: true,
    isActive: true,
    displayOrder: 7,
    userId: null,
  },
  {
    code: 'CEA',
    name: 'Children Education Allowance',
    componentType: 'EARNING',
    category: 'Fixed',
    isTaxable: true,
    taxSection: '10(14)',
    isExemptUpTo: 2400, // ₹100/month x 2 children x 12 months
    syncTarget: 'NONE',
    syncDirection: 'FROM_SALARY',
    isExpandable: false,
    parentCode: null,
    isSystem: true,
    isActive: true,
    displayOrder: 8,
    userId: null,
  },
  {
    code: 'CAR',
    name: 'Car Allowance',
    componentType: 'EARNING',
    category: 'Fixed',
    isTaxable: true,
    taxSection: null,
    isExemptUpTo: null,
    syncTarget: 'NONE',
    syncDirection: 'FROM_SALARY',
    isExpandable: false,
    parentCode: null,
    isSystem: true,
    isActive: true,
    displayOrder: 9,
    userId: null,
  },
  {
    code: 'BONUS',
    name: 'Bonus',
    componentType: 'EARNING',
    category: 'Variable',
    isTaxable: true,
    taxSection: null,
    isExemptUpTo: null,
    syncTarget: 'NONE',
    syncDirection: 'FROM_SALARY',
    isExpandable: false,
    parentCode: null,
    isSystem: true,
    isActive: true,
    displayOrder: 10,
    userId: null,
  },
  {
    code: 'INCENTIVE',
    name: 'Incentives',
    componentType: 'EARNING',
    category: 'Variable',
    isTaxable: true,
    taxSection: null,
    isExemptUpTo: null,
    syncTarget: 'NONE',
    syncDirection: 'FROM_SALARY',
    isExpandable: false,
    parentCode: null,
    isSystem: true,
    isActive: true,
    displayOrder: 11,
    userId: null,
  },
  {
    code: 'SPECIAL_PAY',
    name: 'Special Pay/Arrears',
    componentType: 'EARNING',
    category: 'Variable',
    isTaxable: true,
    taxSection: null,
    isExemptUpTo: null,
    syncTarget: 'NONE',
    syncDirection: 'FROM_SALARY',
    isExpandable: false,
    parentCode: null,
    isSystem: true,
    isActive: true,
    displayOrder: 12,
    userId: null,
  },

  // ============================================
  // DEDUCTIONS (10 components)
  // ============================================
  {
    code: 'EPF',
    name: 'Employee Provident Fund',
    componentType: 'DEDUCTION',
    category: 'Statutory',
    isTaxable: false,
    taxSection: '80C',
    isExemptUpTo: 150000, // 80C limit
    syncTarget: 'EPF',
    syncDirection: 'FROM_SALARY',
    isExpandable: false,
    parentCode: null,
    isSystem: true,
    isActive: true,
    displayOrder: 20,
    userId: null,
  },
  {
    code: 'VPF',
    name: 'Voluntary Provident Fund',
    componentType: 'DEDUCTION',
    category: 'Voluntary',
    isTaxable: false,
    taxSection: '80C',
    isExemptUpTo: null, // Part of 80C limit
    syncTarget: 'VPF',
    syncDirection: 'FROM_SALARY',
    isExpandable: false,
    parentCode: 'OTHER_DED', // Sub-component of Other Deductions
    isSystem: true,
    isActive: true,
    displayOrder: 21,
    userId: null,
  },
  {
    code: 'PT',
    name: 'Professional Tax',
    componentType: 'DEDUCTION',
    category: 'Statutory',
    isTaxable: false,
    taxSection: '16(iii)',
    isExemptUpTo: 2500, // Max deduction allowed
    syncTarget: 'NONE',
    syncDirection: 'FROM_SALARY',
    isExpandable: false,
    parentCode: null,
    isSystem: true,
    isActive: true,
    displayOrder: 22,
    userId: null,
  },
  {
    code: 'TDS',
    name: 'Income Tax (TDS)',
    componentType: 'DEDUCTION',
    category: 'Statutory',
    isTaxable: false,
    taxSection: null,
    isExemptUpTo: null,
    syncTarget: 'NONE',
    syncDirection: 'FROM_SALARY',
    isExpandable: false,
    parentCode: null,
    isSystem: true,
    isActive: true,
    displayOrder: 23,
    userId: null,
  },
  {
    code: 'NPS_EMP',
    name: 'NPS Employee Contribution',
    componentType: 'DEDUCTION',
    category: 'Voluntary',
    isTaxable: false,
    taxSection: '80CCD(1)',
    isExemptUpTo: 150000, // Part of 80C limit
    syncTarget: 'NPS_EMPLOYEE',
    syncDirection: 'FROM_SALARY',
    isExpandable: false,
    parentCode: 'OTHER_DED',
    isSystem: true,
    isActive: true,
    displayOrder: 24,
    userId: null,
  },
  {
    code: 'NPS_EMP_ADDL',
    name: 'NPS Additional (80CCD1B)',
    componentType: 'DEDUCTION',
    category: 'Voluntary',
    isTaxable: false,
    taxSection: '80CCD(1B)',
    isExemptUpTo: 50000, // Additional 50K deduction
    syncTarget: 'NPS_EMPLOYEE',
    syncDirection: 'FROM_SALARY',
    isExpandable: false,
    parentCode: 'OTHER_DED',
    isSystem: true,
    isActive: true,
    displayOrder: 25,
    userId: null,
  },
  {
    code: 'ESI',
    name: 'ESI Contribution',
    componentType: 'DEDUCTION',
    category: 'Statutory',
    isTaxable: false,
    taxSection: null,
    isExemptUpTo: null,
    syncTarget: 'NONE',
    syncDirection: 'FROM_SALARY',
    isExpandable: false,
    parentCode: 'OTHER_DED',
    isSystem: true,
    isActive: true,
    displayOrder: 26,
    userId: null,
  },
  {
    code: 'LWF',
    name: 'Labour Welfare Fund',
    componentType: 'DEDUCTION',
    category: 'Statutory',
    isTaxable: false,
    taxSection: null,
    isExemptUpTo: null,
    syncTarget: 'NONE',
    syncDirection: 'FROM_SALARY',
    isExpandable: false,
    parentCode: 'OTHER_DED',
    isSystem: true,
    isActive: true,
    displayOrder: 27,
    userId: null,
  },
  {
    code: 'LOAN_RECOVERY',
    name: 'Loan Recovery',
    componentType: 'DEDUCTION',
    category: 'Other',
    isTaxable: false,
    taxSection: null,
    isExemptUpTo: null,
    syncTarget: 'NONE',
    syncDirection: 'FROM_SALARY',
    isExpandable: false,
    parentCode: 'OTHER_DED',
    isSystem: true,
    isActive: true,
    displayOrder: 28,
    userId: null,
  },
  {
    code: 'OTHER_DED',
    name: 'Other Deductions',
    componentType: 'DEDUCTION',
    category: 'Other',
    isTaxable: false,
    taxSection: null,
    isExemptUpTo: null,
    syncTarget: 'NONE',
    syncDirection: 'FROM_SALARY',
    isExpandable: true, // Can expand to show VPF, NPS, ESI, etc.
    parentCode: null,
    isSystem: true,
    isActive: true,
    displayOrder: 29,
    userId: null,
  },

  // ============================================
  // EMPLOYER CONTRIBUTIONS (6 components)
  // ============================================
  {
    code: 'EPF_ER',
    name: 'Employer Provident Fund',
    componentType: 'EMPLOYER_CONTRIBUTION',
    category: 'Statutory',
    isTaxable: false,
    taxSection: null,
    isExemptUpTo: null,
    syncTarget: 'EPF',
    syncDirection: 'FROM_SALARY',
    isExpandable: false,
    parentCode: null,
    isSystem: true,
    isActive: true,
    displayOrder: 40,
    userId: null,
  },
  {
    code: 'PENSION',
    name: 'Pension Fund (EPS)',
    componentType: 'EMPLOYER_CONTRIBUTION',
    category: 'Statutory',
    isTaxable: false,
    taxSection: null,
    isExemptUpTo: null,
    syncTarget: 'PENSION_FUND',
    syncDirection: 'FROM_SALARY',
    isExpandable: false,
    parentCode: null,
    isSystem: true,
    isActive: true,
    displayOrder: 41,
    userId: null,
  },
  {
    code: 'NPS_ER',
    name: 'Employer NPS',
    componentType: 'EMPLOYER_CONTRIBUTION',
    category: 'Voluntary',
    isTaxable: false,
    taxSection: '80CCD(2)',
    isExemptUpTo: null, // 10% of Basic+DA (old regime) or 14% (new regime)
    syncTarget: 'NPS_EMPLOYER',
    syncDirection: 'FROM_SALARY',
    isExpandable: false,
    parentCode: null,
    isSystem: true,
    isActive: true,
    displayOrder: 42,
    userId: null,
  },
  {
    code: 'SUPERANN',
    name: 'Superannuation Fund',
    componentType: 'EMPLOYER_CONTRIBUTION',
    category: 'Voluntary',
    isTaxable: false,
    taxSection: null,
    isExemptUpTo: 150000, // Exempt up to ₹1.5L per year
    syncTarget: 'SUPERANNUATION',
    syncDirection: 'FROM_SALARY',
    isExpandable: false,
    parentCode: null,
    isSystem: true,
    isActive: true,
    displayOrder: 43,
    userId: null,
  },
  {
    code: 'GRATUITY',
    name: 'Gratuity Provision',
    componentType: 'EMPLOYER_CONTRIBUTION',
    category: 'Statutory',
    isTaxable: false,
    taxSection: null,
    isExemptUpTo: null,
    syncTarget: 'NONE',
    syncDirection: 'FROM_SALARY',
    isExpandable: false,
    parentCode: null,
    isSystem: true,
    isActive: true,
    displayOrder: 44,
    userId: null,
  },
  {
    code: 'ESI_ER',
    name: 'Employer ESI',
    componentType: 'EMPLOYER_CONTRIBUTION',
    category: 'Statutory',
    isTaxable: false,
    taxSection: null,
    isExemptUpTo: null,
    syncTarget: 'NONE',
    syncDirection: 'FROM_SALARY',
    isExpandable: false,
    parentCode: null,
    isSystem: true,
    isActive: true,
    displayOrder: 45,
    userId: null,
  },
] as const;

async function main() {
  console.log('🌱 Seeding salary component definitions...\n');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const component of SYSTEM_COMPONENTS) {
    try {
      // Check if component exists
      const existing = await prisma.salaryComponentDefinition.findFirst({
        where: {
          code: component.code,
          userId: null, // System components have null userId
        },
      });

      if (existing) {
        // Update existing component
        await prisma.salaryComponentDefinition.update({
          where: { id: existing.id },
          data: {
            name: component.name,
            componentType: component.componentType as any,
            category: component.category,
            isTaxable: component.isTaxable,
            taxSection: component.taxSection,
            isExemptUpTo: component.isExemptUpTo,
            syncTarget: component.syncTarget as any,
            syncDirection: component.syncDirection as any,
            isExpandable: component.isExpandable,
            parentCode: component.parentCode,
            isSystem: component.isSystem,
            isActive: component.isActive,
            displayOrder: component.displayOrder,
          },
        });
        updated++;
        console.log(`  ✏️  Updated: ${component.code} - ${component.name}`);
      } else {
        // Create new component
        await prisma.salaryComponentDefinition.create({
          data: {
            code: component.code,
            name: component.name,
            componentType: component.componentType as any,
            category: component.category,
            isTaxable: component.isTaxable,
            taxSection: component.taxSection,
            isExemptUpTo: component.isExemptUpTo,
            syncTarget: component.syncTarget as any,
            syncDirection: component.syncDirection as any,
            isExpandable: component.isExpandable,
            parentCode: component.parentCode,
            isSystem: component.isSystem,
            isActive: component.isActive,
            displayOrder: component.displayOrder,
            userId: null,
          },
        });
        created++;
        console.log(`  ✅ Created: ${component.code} - ${component.name}`);
      }
    } catch (error) {
      skipped++;
      console.error(`  ❌ Error with ${component.code}:`, error);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total:   ${SYSTEM_COMPONENTS.length}`);
  console.log('\n✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
