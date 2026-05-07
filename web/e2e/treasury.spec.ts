import { test, expect } from '@playwright/test'

test.use({ storageState: 'playwright/.auth/user.json' })

test.describe('Treasury page (board)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/treasury')
  })

  test('renders the Treasury heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Treasury' })).toBeVisible()
  })

  test('shows summary totals', async ({ page }) => {
    // Total Income = $1500, Total Expenses = $300, Net = $1200
    await expect(page.getByText('$1,500')).toBeVisible()
    await expect(page.getByText('$300')).toBeVisible()
    await expect(page.getByText('$1,200')).toBeVisible()
  })

  test('shows sponsor Acme Corp', async ({ page }) => {
    await expect(page.getByText('Acme Corp')).toBeVisible()
  })

  test('shows expense entry', async ({ page }) => {
    await expect(page.getByText('Cricket bats')).toBeVisible()
  })

  test('shows Add Sponsor button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /add sponsor/i })).toBeVisible()
  })

  test('shows Add Expense button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /add expense/i })).toBeVisible()
  })
})
