import { test, expect } from '@playwright/test'

test('API health check', async ({ request }) => {
  const res = await request.get(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001' + '/health')
  expect(res.ok()).toBeTruthy()
  const body = await res.json()
  expect(body.status).toBe('ok')
})
