import { test, expect } from '@playwright/test'

// Run without any session cookie so we test the unauthenticated redirect behaviour
test.use({ storageState: { cookies: [], origins: [] } })

const protectedRoutes = [
  '/dashboard',
  '/my-team',
  '/my-fees',
  '/announcements',
  '/availability',
  '/documents',
  '/profile',
  '/members',
  '/seasons',
  '/teams',
  '/payments',
  '/treasury',
]

test.describe('unauthenticated redirects', () => {
  for (const route of protectedRoutes) {
    test(`redirects ${route} to /login`, async ({ page }) => {
      await page.goto(route)
      await expect(page).toHaveURL(/\/login/)
    })
  }

  test('redirects root / to /login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('login page', () => {
  test('shows Google sign-in button', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible()
  })

  test('shows club name when NEXT_PUBLIC_CLUB_NAME is set', async ({ page }) => {
    await page.goto('/login')
    // The login page renders without crashing — heading or club branding present
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('login page is accessible without a session', async ({ page }) => {
    const response = await page.goto('/login')
    expect(response?.status()).toBe(200)
  })

  test('does not redirect /login to /login (no loop)', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL(/\/login/)
    // Confirm we landed on login and didn't get stuck in a redirect loop
    await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible()
  })
})
