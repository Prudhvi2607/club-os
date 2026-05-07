import { test, expect } from '@playwright/test'

test.use({ storageState: 'playwright/.auth/user.json' })

test.describe('Documents page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/documents')
  })

  test('renders the Documents heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible()
  })

  test('lists Club Bylaws document', async ({ page }) => {
    await expect(page.getByText('Club Bylaws')).toBeVisible()
  })

  test('shows document category', async ({ page }) => {
    await expect(page.getByText(/bylaws/i)).toBeVisible()
  })

  test('document links to the file URL', async ({ page }) => {
    const link = page.getByRole('link', { name: /Club Bylaws/i })
    await expect(link).toBeVisible()
  })
})
