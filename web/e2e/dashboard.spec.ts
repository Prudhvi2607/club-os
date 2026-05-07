import { test, expect } from '@playwright/test'

test.use({ storageState: 'playwright/.auth/user.json' })

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
  })

  test('renders the Dashboard heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('shows active season name', async ({ page }) => {
    await expect(page.getByText(/2025 Season/)).toBeVisible()
  })

  test('shows fee summary cards', async ({ page }) => {
    await expect(page.getByText('My Fees Due')).toBeVisible()
    await expect(page.getByText('My Payment Status')).toBeVisible()
  })

  test('shows Upcoming Tournaments section', async ({ page }) => {
    await expect(page.getByText('Upcoming Tournaments')).toBeVisible()
    await expect(page.getByText('Summer Cup 2025')).toBeVisible()
  })

  test('shows Recent Announcements section with content', async ({ page }) => {
    await expect(page.getByText('Recent Announcements')).toBeVisible()
    await expect(page.getByText('Welcome to the 2025 season!')).toBeVisible()
  })

  test('board member sees payment overview panel', async ({ page }) => {
    await expect(page.getByText(/fully paid/i)).toBeVisible()
    await expect(page.getByText(/unpaid/i)).toBeVisible()
  })

  test('shows registered badge when member is registered', async ({ page }) => {
    await expect(page.getByText(/You are registered for the 2025 season/)).toBeVisible()
  })

  test('sidebar shows club name', async ({ page }) => {
    await expect(page.getByText('Test Cricket Club')).toBeVisible()
  })

  test('sidebar shows app version', async ({ page }) => {
    // Version badge exists (content depends on package.json)
    await expect(page.locator('text=/^v\\d+\\./')).toBeVisible()
  })
})
