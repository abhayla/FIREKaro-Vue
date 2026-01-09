import { prisma } from '../lib/prisma'

export interface SyncResult {
  salaryEntryId: string
  month: number
  year: number
  financialYear: string
  syncStatus: string
  lastSyncedAt: string
  epf: {
    synced: boolean
    message: string
    amount: number
  }
  nps: {
    synced: boolean
    message: string
    amount: number
  }
}

/**
 * Sync salary contributions to EPF and NPS accounts
 * Creates transactions in the respective accounts
 */
export async function syncSalaryToRetirementAccounts(salaryId: string, userId: string): Promise<SyncResult> {
  // Get the salary record
  const salary = await prisma.monthlySalary.findFirst({
    where: { id: salaryId, userId },
  })

  if (!salary) {
    throw new Error('Salary record not found')
  }

  if (salary.syncStatus === 'SYNCED') {
    return {
      salaryEntryId: salary.id,
      month: salary.month,
      year: salary.year,
      financialYear: salary.financialYear,
      syncStatus: 'SYNCED',
      lastSyncedAt: salary.lastSyncedAt?.toISOString() || new Date().toISOString(),
      epf: { synced: false, message: 'Already synced', amount: 0 },
      nps: { synced: false, message: 'Already synced', amount: 0 },
    }
  }

  const result: SyncResult = {
    salaryEntryId: salary.id,
    month: salary.month,
    year: salary.year,
    financialYear: salary.financialYear,
    syncStatus: 'PENDING',
    lastSyncedAt: new Date().toISOString(),
    epf: { synced: false, message: '', amount: 0 },
    nps: { synced: false, message: '', amount: 0 },
  }

  // Calculate EPF contribution (employee PF + voluntary PF + employer PF)
  const epfEmployeeAmount = salary.employeePF + salary.voluntaryPF
  const epfEmployerAmount = salary.employerPF + salary.pensionFund

  // Calculate NPS contribution
  const npsAmount = salary.npsContribution

  // Sync to EPF Account
  if (epfEmployeeAmount > 0 || epfEmployerAmount > 0) {
    try {
      // Get or create EPF account
      let epfAccount = await prisma.ePFAccount.findUnique({
        where: { userId },
      })

      if (!epfAccount) {
        epfAccount = await prisma.ePFAccount.create({
          data: {
            userId,
            currentBalance: 0,
            employeeShare: 0,
            employerShare: 0,
            pensionFund: 0,
          },
        })
      }

      // Create EPF transaction
      const transactionDate = new Date(salary.year, salary.month - 1 + 3, 1) // Adjust for FY month
      const newBalance = epfAccount.currentBalance + epfEmployeeAmount + epfEmployerAmount

      await prisma.ePFTransaction.create({
        data: {
          epfAccountId: epfAccount.id,
          transactionType: 'CONTRIBUTION',
          amount: epfEmployeeAmount + epfEmployerAmount,
          balance: newBalance,
          description: `Salary contribution for ${salary.financialYear} Month ${salary.month}`,
          transactionDate,
        },
      })

      // Update EPF account balance
      await prisma.ePFAccount.update({
        where: { id: epfAccount.id },
        data: {
          currentBalance: newBalance,
          employeeShare: epfAccount.employeeShare + epfEmployeeAmount,
          employerShare: epfAccount.employerShare + epfEmployerAmount,
          vpfContribution: epfAccount.vpfContribution + salary.voluntaryPF,
          lastUpdated: new Date(),
        },
      })

      result.epf = {
        synced: true,
        message: `Synced EPF contribution of ₹${epfEmployeeAmount + epfEmployerAmount}`,
        amount: epfEmployeeAmount + epfEmployerAmount,
      }
    } catch (error) {
      console.error('EPF sync error:', error)
      result.epf = { synced: false, message: 'Failed to sync EPF', amount: 0 }
    }
  } else {
    result.epf = { synced: false, message: 'No EPF contribution to sync', amount: 0 }
  }

  // Sync to NPS Account
  if (npsAmount > 0) {
    try {
      // Get or create NPS account (Tier I)
      let npsAccount = await prisma.nPSAccount.findFirst({
        where: { userId, tierType: 'Tier I' },
      })

      if (!npsAccount) {
        npsAccount = await prisma.nPSAccount.create({
          data: {
            userId,
            tierType: 'Tier I',
            currentCorpus: 0,
            monthlyContribution: npsAmount,
          },
        })
      }

      // Create NPS transaction
      const transactionDate = new Date(salary.year, salary.month - 1 + 3, 1)
      const newCorpus = npsAccount.currentCorpus + npsAmount

      await prisma.nPSTransaction.create({
        data: {
          npsAccountId: npsAccount.id,
          transactionType: 'CONTRIBUTION',
          amount: npsAmount,
          corpus: newCorpus,
          description: `Salary NPS contribution for ${salary.financialYear} Month ${salary.month}`,
          transactionDate,
        },
      })

      // Update NPS account
      await prisma.nPSAccount.update({
        where: { id: npsAccount.id },
        data: {
          currentCorpus: newCorpus,
          monthlyContribution: npsAmount,
          lastUpdated: new Date(),
        },
      })

      result.nps = {
        synced: true,
        message: `Synced NPS contribution of ₹${npsAmount}`,
        amount: npsAmount,
      }
    } catch (error) {
      console.error('NPS sync error:', error)
      result.nps = { synced: false, message: 'Failed to sync NPS', amount: 0 }
    }
  } else {
    result.nps = { synced: false, message: 'No NPS contribution to sync', amount: 0 }
  }

  // Update salary record sync status
  const syncStatus = result.epf.synced || result.nps.synced ? 'SYNCED' : 'SKIPPED'
  const syncError =
    !result.epf.synced && result.epf.message.includes('Failed')
      ? result.epf.message
      : !result.nps.synced && result.nps.message.includes('Failed')
        ? result.nps.message
        : null

  await prisma.monthlySalary.update({
    where: { id: salaryId },
    data: {
      syncStatus,
      lastSyncedAt: new Date(),
      syncedToEpf: result.epf.synced,
      syncedToNps: result.nps.synced,
      syncError,
    },
  })

  result.syncStatus = syncStatus

  return result
}

/**
 * Reset sync status for a salary record
 */
export async function resetSyncStatus(salaryId: string, userId: string): Promise<void> {
  const salary = await prisma.monthlySalary.findFirst({
    where: { id: salaryId, userId },
  })

  if (!salary) {
    throw new Error('Salary record not found')
  }

  await prisma.monthlySalary.update({
    where: { id: salaryId },
    data: {
      syncStatus: 'PENDING',
      lastSyncedAt: null,
      syncedToEpf: false,
      syncedToNps: false,
      syncError: null,
    },
  })
}

/**
 * Bulk sync all pending salary records for a user
 */
export async function bulkSyncPendingSalaries(
  userId: string,
  financialYear?: string
): Promise<SyncResult[]> {
  const whereClause: {
    userId: string
    syncStatus: string
    financialYear?: string
  } = {
    userId,
    syncStatus: 'PENDING',
  }

  if (financialYear) {
    whereClause.financialYear = financialYear
  }

  const pendingSalaries = await prisma.monthlySalary.findMany({
    where: whereClause,
    orderBy: [{ year: 'asc' }, { month: 'asc' }],
  })

  const results: SyncResult[] = []

  for (const salary of pendingSalaries) {
    try {
      const result = await syncSalaryToRetirementAccounts(salary.id, userId)
      results.push(result)
    } catch (error) {
      console.error(`Failed to sync salary ${salary.id}:`, error)
    }
  }

  return results
}
