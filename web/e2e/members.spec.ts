import { test, expect } from '@playwright/test'

test.use({ storageState: 'playwright/.auth/user.json' })

test.describe('Members page (board)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/members')
  })

  test('renders the Members heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Members' })).toBeVisible()
  })

  test('shows Add Member button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /add member/i })).toBeVisible()
  })

  test('lists all members by name', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Alex Board' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Sam Member' })).toBeVisible()
  })

  test('shows member playing roles', async ({ page }) => {
    await expect(page.getByText('batter')).toBeVisible()
    await expect(page.getByText('bowler')).toBeVisible()
  })

  test('shows status selects for each member', async ({ page }) => {
    const statusSelects = page.getByRole('combobox')
    await expect(statusSelects.first()).toBeVisible()
  })

  test('shows filter bar with total count', async ({ page }) => {
    // MembersFilterRow shows total count
    await expect(page.getByText(/2 members/i)).toBeVisible()
  })

  test('filtering by role hides non-matching members', async ({ page }) => {
    // Navigate with role filter applied
    await page.goto('/members?role=board')
    await expect(page.getByRole('link', { name: 'Alex Board' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Sam Member' })).not.toBeVisible()
  })

  test('filtering by playing role works', async ({ page }) => {
    await page.goto('/members?playingRole=bowler')
    await expect(page.getByRole('link', { name: 'Sam Member' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Alex Board' })).not.toBeVisible()
  })

  test('empty state message shown when filters match nothing', async ({ page }) => {
    await page.goto('/members?role=captain')
    await expect(page.getByText(/No members match the current filters/i)).toBeVisible()
  })

  test('shows export button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /export/i })).toBeVisible()
  })
})
