import { test, expect } from '@playwright/test'

// Uses the nomember session: /me returns 404, triggering the not-a-member screen
test.use({ storageState: 'playwright/.auth/nomember.json' })

test.describe('Not-a-member screen', () => {
  test('shows not-a-member message with club name', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText(/You're not a member of Test Cricket Club yet/)).toBeVisible()
  })

  test('shows instruction to contact the board', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText(/Ask your board to add you to Test Cricket Club/)).toBeVisible()
  })

  test('shows Sign Out button', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible()
  })

  test('same screen appears on any protected route', async ({ page }) => {
    await page.goto('/my-fees')
    await expect(page.getByText(/You're not a member of Test Cricket Club yet/)).toBeVisible()
  })

  test('does not redirect to login (has a valid session, just no membership)', async ({ page }) => {
    await page.goto('/profile')
    // Should stay on the page showing the not-a-member UI, NOT redirect to /login
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.getByText(/not a member/i)).toBeVisible()
  })
})
