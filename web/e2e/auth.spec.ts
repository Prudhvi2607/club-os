import { test, expect } from '@playwright/test'

test.describe('unauthenticated', () => {
  test('redirects / to /login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })

  test('redirects /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('redirects /members to /login', async ({ page }) => {
    await page.goto('/members')
    await expect(page).toHaveURL(/\/login/)
  })

  test('login page shows club name and Google sign-in button', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible()
  })
})
