import { test, expect } from '@playwright/test'

test.use({ storageState: 'playwright/.auth/user.json' })

test.describe('Profile page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile')
  })

  test('renders the Profile heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible()
  })

  test('shows membership read-only section with club name', async ({ page }) => {
    await expect(page.getByText('Test Cricket Club')).toBeVisible()
  })

  test('shows member email in read-only section', async ({ page }) => {
    await expect(page.getByText('board@testclub.com')).toBeVisible()
  })

  test('shows role badge in read-only section', async ({ page }) => {
    await expect(page.getByText('Board')).toBeVisible()
  })

  test('pre-fills Full Name input from API', async ({ page }) => {
    await expect(page.getByLabel('Full Name')).toHaveValue('Alex Board')
  })

  test('pre-fills Phone input from API', async ({ page }) => {
    await expect(page.getByLabel('Phone')).toHaveValue('555-1234')
  })

  test('pre-fills emergency contact name', async ({ page }) => {
    // Two "Name" labels exist — the emergency contact one
    await expect(page.getByLabel('Name').first()).toHaveValue('Jane Doe')
  })

  test('pre-fills jersey number', async ({ page }) => {
    await expect(page.getByLabel('Jersey Number')).toHaveValue('7')
  })

  test('shows a Save button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible()
  })
})
