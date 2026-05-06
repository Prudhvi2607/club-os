import { test, expect } from '@playwright/test'

test.use({ storageState: 'playwright/.auth/user.json' })

test.describe('Availability page', () => {
  test('renders the My Availability heading', async ({ page }) => {
    await page.goto('/availability')
    await expect(page.getByRole('heading', { name: 'My Availability' })).toBeVisible()
  })

  test('shows season year subtitle', async ({ page }) => {
    await page.goto('/availability')
    await expect(page.getByText('2025 Season')).toBeVisible()
  })

  test('shows tournament in the grid', async ({ page }) => {
    await page.goto('/availability')
    await expect(page.getByText('Summer Cup 2025')).toBeVisible()
  })

  test('shows availability guide legend', async ({ page }) => {
    await page.goto('/availability')
    await expect(page.getByText('Available')).toBeVisible()
    await expect(page.getByText('Partly available')).toBeVisible()
    await expect(page.getByText('Not available')).toBeVisible()
  })

  test('shows availability buttons for a tournament', async ({ page }) => {
    await page.goto('/availability')
    // The grid renders radio-style buttons for each status
    await expect(page.getByRole('button', { name: /available/i }).first()).toBeVisible()
  })
})
