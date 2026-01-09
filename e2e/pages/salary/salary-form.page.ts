import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

export interface SalaryFormData {
  employer?: string;
  financialYear?: string;
  month?: string;
  paidDays?: number;
  basicSalary?: number;
  hra?: number;
  conveyanceAllowance?: number;
  medicalAllowance?: number;
  specialAllowance?: number;
  specialPay?: number;
  otherAllowances?: number;
  epfDeduction?: number;
  vpfDeduction?: number;
  professionalTax?: number;
  tdsDeduction?: number;
  otherDeductions?: number;
  employerPf?: number;
  pensionFund?: number;
  employerNps?: number;
  superannuation?: number;
}

/**
 * Page Object for Salary Add/Edit Form Dialog
 * Updated for new card-based layout with expandable sections
 */
export class SalaryFormPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Dialog container - use data-testid for reliability
  get formDialog(): Locator {
    return this.page.locator("[data-testid='dialog-salary-form']");
  }

  // Header section - Employer + FY + Month
  get employerSelect(): Locator {
    return this.formDialog.locator(".v-select").first();
  }

  get financialYearSelect(): Locator {
    return this.formDialog.locator(".v-select").nth(1);
  }

  get monthSelect(): Locator {
    return this.formDialog.locator(".v-select").nth(2);
  }

  get paidDaysInput(): Locator {
    return this.formDialog.getByRole("spinbutton", { name: "Paid Days" });
  }

  // EARNINGS Section fields
  get earningsSection(): Locator {
    return this.formDialog.locator(".earnings-section");
  }

  get basicSalaryInput(): Locator {
    return this.formDialog.getByRole("spinbutton", { name: "Basic Salary *" });
  }

  get hraInput(): Locator {
    return this.formDialog.getByRole("spinbutton", {
      name: "House Rent Allowance (HRA)",
    });
  }

  get conveyanceInput(): Locator {
    return this.formDialog.getByRole("spinbutton", {
      name: "Conveyance Allowance",
    });
  }

  get medicalInput(): Locator {
    return this.formDialog.getByRole("spinbutton", {
      name: "Medical Allowance",
    });
  }

  get specialAllowanceInput(): Locator {
    return this.formDialog.getByRole("spinbutton", {
      name: "Special Allowance",
    });
  }

  // Expandable Other Allowances
  get otherAllowancesToggle(): Locator {
    return this.earningsSection.getByRole("textbox", {
      name: "Other Allowances",
    });
  }

  get specialPayInput(): Locator {
    return this.formDialog.getByRole("spinbutton", {
      name: "Special Pay / Arrears",
    });
  }

  get miscAllowancesInput(): Locator {
    return this.formDialog.getByRole("spinbutton", {
      name: "Misc Allowances",
    });
  }

  // DEDUCTIONS Section fields
  get deductionsSection(): Locator {
    return this.formDialog.locator(".deductions-section");
  }

  get epfInput(): Locator {
    return this.formDialog.getByRole("spinbutton", {
      name: "Provident Fund (EPF)",
    });
  }

  get professionalTaxInput(): Locator {
    return this.formDialog.getByRole("spinbutton", {
      name: "Professional Tax",
    });
  }

  get tdsInput(): Locator {
    return this.formDialog.getByRole("spinbutton", {
      name: "Income Tax (TDS)",
    });
  }

  // Expandable Other Deductions
  get otherDeductionsToggle(): Locator {
    return this.deductionsSection.getByRole("textbox", {
      name: "Other Deductions",
    });
  }

  get vpfInput(): Locator {
    return this.formDialog.getByRole("spinbutton", {
      name: "Voluntary PF (VPF)",
    });
  }

  get miscDeductionsInput(): Locator {
    return this.formDialog.getByRole("spinbutton", { name: "Misc Deductions" });
  }

  // Net Salary card
  get netSalaryCard(): Locator {
    return this.formDialog.locator(".net-salary-card");
  }

  // Employer Contributions Section (collapsible)
  get employerSection(): Locator {
    return this.formDialog.locator(".employer-section");
  }

  get employerContributionsToggle(): Locator {
    return this.employerSection.locator(".v-card-title");
  }

  get employerPfInput(): Locator {
    return this.formDialog.getByRole("spinbutton", {
      name: /Employer PF/,
    });
  }

  get pensionFundInput(): Locator {
    return this.formDialog.getByRole("spinbutton", {
      name: "Pension Fund (EPS)",
    });
  }

  get employerNpsInput(): Locator {
    return this.formDialog.getByRole("spinbutton", { name: "NPS (Employer)" });
  }

  get superannuationInput(): Locator {
    return this.formDialog.getByRole("spinbutton", { name: "Superannuation" });
  }

  // Calculated totals display - in chip next to section headers
  get grossEarningsDisplay(): Locator {
    return this.earningsSection.locator(".v-card-title .v-chip");
  }

  get totalDeductionsDisplay(): Locator {
    return this.deductionsSection.locator(".v-card-title .v-chip");
  }

  get netSalaryDisplay(): Locator {
    return this.netSalaryCard.locator(".text-h5");
  }

  // Action buttons - use data-testid for reliability
  get saveButton(): Locator {
    return this.page.locator("[data-testid='btn-save']");
  }

  get updateButton(): Locator {
    return this.page.locator("[data-testid='btn-save']"); // Same button, text changes
  }

  get cancelButton(): Locator {
    return this.page.locator("[data-testid='btn-cancel']");
  }

  get closeButton(): Locator {
    return this.formDialog.locator(".v-card-title button:has(.mdi-close)");
  }

  // New Employer Dialog
  get newEmployerDialog(): Locator {
    return this.page.locator(".v-dialog:has-text('Add New Employer')");
  }

  get newEmployerNameInput(): Locator {
    return this.newEmployerDialog.getByRole("textbox", {
      name: "Employer Name",
    });
  }

  get addEmployerButton(): Locator {
    return this.newEmployerDialog.getByRole("button", { name: "Add Employer" });
  }

  // Actions
  async isVisible(): Promise<boolean> {
    return await this.formDialog.isVisible();
  }

  async selectEmployer(employerName: string) {
    await this.employerSelect.click();
    await this.page.getByRole("option", { name: employerName }).click();
    await this.page.waitForTimeout(200);
  }

  async createNewEmployer(employerName: string) {
    await this.employerSelect.click();
    await this.page.getByRole("option", { name: "+ Add New Employer" }).click();
    await this.page.waitForTimeout(300);

    // Fill new employer dialog
    await this.newEmployerNameInput.fill(employerName);
    await this.addEmployerButton.click();
    await this.page.waitForTimeout(500);
  }

  async selectMonth(monthName: string) {
    await this.monthSelect.click();
    await this.page.getByRole("option", { name: monthName }).click();
    await this.page.waitForTimeout(200);
  }

  async selectFinancialYear(fy: string) {
    await this.financialYearSelect.click();
    // Match by FY format (e.g., "FY 2025-26" or just "25-26")
    await this.page.getByRole("option", { name: new RegExp(fy) }).click();
    await this.page.waitForTimeout(200);
  }

  async expandOtherAllowances() {
    const isExpanded = await this.specialPayInput.isVisible();
    if (!isExpanded) {
      await this.otherAllowancesToggle.click();
      await this.page.waitForTimeout(300);
    }
  }

  async expandOtherDeductions() {
    const isExpanded = await this.vpfInput.isVisible();
    if (!isExpanded) {
      await this.otherDeductionsToggle.click();
      await this.page.waitForTimeout(300);
    }
  }

  async expandEmployerContributions() {
    const isExpanded = await this.employerPfInput.isVisible();
    if (!isExpanded) {
      await this.employerContributionsToggle.click();
      await this.page.waitForTimeout(300);
    }
  }

  async fillForm(data: SalaryFormData) {
    // Employer selection
    if (data.employer) {
      await this.selectEmployer(data.employer);
    }

    if (data.financialYear) {
      await this.selectFinancialYear(data.financialYear);
    }
    if (data.month) {
      await this.selectMonth(data.month);
    }

    // Earnings
    if (data.basicSalary !== undefined) {
      await this.basicSalaryInput.fill(data.basicSalary.toString());
    }
    if (data.hra !== undefined) {
      await this.hraInput.fill(data.hra.toString());
    }
    if (data.conveyanceAllowance !== undefined) {
      await this.conveyanceInput.fill(data.conveyanceAllowance.toString());
    }
    if (data.medicalAllowance !== undefined) {
      await this.medicalInput.fill(data.medicalAllowance.toString());
    }
    if (data.specialAllowance !== undefined) {
      await this.specialAllowanceInput.fill(data.specialAllowance.toString());
    }

    // Expandable Other Allowances
    if (data.specialPay !== undefined || data.otherAllowances !== undefined) {
      await this.expandOtherAllowances();

      if (data.specialPay !== undefined) {
        await this.specialPayInput.fill(data.specialPay.toString());
      }
      if (data.otherAllowances !== undefined) {
        await this.miscAllowancesInput.fill(data.otherAllowances.toString());
      }
    }

    // Deductions
    if (data.epfDeduction !== undefined) {
      await this.epfInput.fill(data.epfDeduction.toString());
    }
    if (data.professionalTax !== undefined) {
      await this.professionalTaxInput.fill(data.professionalTax.toString());
    }
    if (data.tdsDeduction !== undefined) {
      await this.tdsInput.fill(data.tdsDeduction.toString());
    }

    // Expandable Other Deductions
    if (data.vpfDeduction !== undefined || data.otherDeductions !== undefined) {
      await this.expandOtherDeductions();

      if (data.vpfDeduction !== undefined) {
        await this.vpfInput.fill(data.vpfDeduction.toString());
      }
      if (data.otherDeductions !== undefined) {
        await this.miscDeductionsInput.fill(data.otherDeductions.toString());
      }
    }

    // Paid days (at bottom now)
    if (data.paidDays !== undefined) {
      await this.paidDaysInput.fill(data.paidDays.toString());
    }

    // Employer contributions (if any provided)
    if (
      data.employerPf !== undefined ||
      data.pensionFund !== undefined ||
      data.employerNps !== undefined ||
      data.superannuation !== undefined
    ) {
      await this.expandEmployerContributions();

      if (data.employerPf !== undefined) {
        await this.employerPfInput.fill(data.employerPf.toString());
      }
      if (data.pensionFund !== undefined) {
        await this.pensionFundInput.fill(data.pensionFund.toString());
      }
      if (data.employerNps !== undefined) {
        await this.employerNpsInput.fill(data.employerNps.toString());
      }
      if (data.superannuation !== undefined) {
        await this.superannuationInput.fill(data.superannuation.toString());
      }
    }
  }

  async save() {
    await this.saveButton.click();
    await this.page.waitForTimeout(500);
  }

  async update() {
    await this.updateButton.click();
    await this.page.waitForTimeout(500);
  }

  async cancel() {
    await this.cancelButton.click();
  }

  async close() {
    await this.closeButton.click();
  }

  // Get calculated values
  async getGrossEarnings(): Promise<string> {
    return (await this.grossEarningsDisplay.textContent()) || "";
  }

  async getTotalDeductions(): Promise<string> {
    return (await this.totalDeductionsDisplay.textContent()) || "";
  }

  async getNetSalary(): Promise<string> {
    return (await this.netSalaryDisplay.textContent()) || "";
  }

  // Assertions
  async expectGrossEarnings(expected: string) {
    await expect(this.grossEarningsDisplay).toContainText(expected);
  }

  async expectTotalDeductions(expected: string) {
    await expect(this.totalDeductionsDisplay).toContainText(expected);
  }

  async expectNetSalary(expected: string) {
    await expect(this.netSalaryDisplay).toContainText(expected);
  }

  async expectDialogOpen() {
    await expect(this.formDialog).toBeVisible();
  }

  async expectDialogClosed() {
    await expect(this.formDialog).not.toBeVisible();
  }

  async expectSyncIndicatorVisible(fieldName: string) {
    const field = this.formDialog.locator(`text=${fieldName}`).locator("..");
    await expect(field.locator(".mdi-link")).toBeVisible();
  }
}
