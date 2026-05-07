import { test, expect } from '@playwright/test'

test.use({ storageState: 'playwright/.auth/user.json' })

test.describe('Announcements page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/announcements')
  })

  test('renders the Announcements heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Announcements' })).toBeVisible()
  })

  test('lists announcement subject', async ({ page }) => {
    await expect(page.getByText('Welcome to the 2025 season!')).toBeVisible()
  })

  test('shows announcement body preview', async ({ page }) => {
    await expect(page.getByText(/First practice is this Saturday/)).toBeVisible()
  })

  test('shows sender name', async ({ page }) => {
    await expect(page.getByText('Alex Board')).toBeVisible()
  })

  test('clears the new-announcement dot when page is visited', async ({ page }) => {
    // Visiting /announcements should mark announcements as seen
    // The sidebar badge (blue dot) should not appear after visit
    await page.goto('/dashboard')
    const badge = page.locator('.bg-blue-400')
    // Badge only shows if localStorage has an older last_seen_announcements;
    // after visiting /announcements it should be absent
    await page.goto('/announcements')
    await page.goto('/dashboard')
    await expect(badge).not.toBeVisible()
  })
})
