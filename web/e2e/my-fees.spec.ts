import { test, expect } from '@playwright/test'

test.use({ storageState: 'playwright/.auth/user.json' })

test.describe('My Fees page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/my-fees')
  })

  test('renders the My Fees heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'My Fees' })).toBeVisible()
  })

  test('shows summary stat cards', async ({ page }) => {
    await expect(page.getByText('Total Due')).toBeVisible()
    await expect(page.getByText('Paid')).toBeVisible()
    await expect(page.getByText('Outstanding')).toBeVisible()
  })

  test('shows fee rows for each assigned fee', async ({ page }) => {
    await expect(page.getByText('Registration Fee')).toBeVisible()
    await expect(page.getByText('Training Fee')).toBeVisible()
  })

  test('shows pending status badge', async ({ page }) => {
    await expect(page.getByText('pending')).toBeVisible()
  })

  test('shows paid status badge', async ({ page }) => {
    await expect(page.getByText('paid')).toBeVisible()
  })

  test('shows outstanding banner when fees are pending', async ({ page }) => {
    await expect(page.getByText(/outstanding/i)).toBeVisible()
    await expect(page.getByText(/"I paid"/)).toBeVisible()
  })

  test('shows I paid button for pending fee', async ({ page }) => {
    // SubmitPaymentRequestButton renders for non-paid fees
    await expect(page.getByRole('button', { name: /I paid/i })).toBeVisible()
  })

  test('shows payment history for paid fee', async ({ page }) => {
    await expect(page.getByText(/zelle/i)).toBeVisible()
  })

  test('shows $100 total due', async ({ page }) => {
    // FEE_PENDING($100) + FEE_PAID($50) = $150 total due
    await expect(page.getByText('$150')).toBeVisible()
  })
})
