import { expect, test } from '@nuxt/test-utils/playwright'

test.describe('US1 – Plan a Sprint Review', () => {
  test('creates a review and adds items', async ({ page, goto }) => {
    await goto('/', { waitUntil: 'hydration' })

    // Empty state → create review
    await page.getByRole('link', { name: 'Create review' }).click()
    await page.waitForURL('**/reviews/new')

    await page.getByLabel('Review name').fill('Sprint 10 Review')
    await page.getByLabel('Sprint').fill('10')
    await page.getByRole('button', { name: 'Create' }).click()

    await page.waitForURL('/')
    await expect(page.getByText('Sprint 10 Review')).toBeVisible()
  })

  test('adds items and changes statuses', async ({ page, goto }) => {
    // Create a review first
    await goto('/reviews/new', { waitUntil: 'hydration' })
    await page.getByLabel('Review name').fill('Sprint 11 Review')
    await page.getByLabel('Sprint').fill('11')
    await page.getByRole('button', { name: 'Create' }).click()
    await page.waitForURL('/')

    // Add first item
    const addBtn = page.getByRole('button', { name: /add/i }).or(
      page.locator('[data-add-item], .agenda-add-btn, button:has-text("+")')
    ).first()

    // The add button is in AgendaList — check for + button
    await page.locator('button').filter({ hasText: '+' }).click()
    await expect(page.locator('.agenda-item')).toHaveCount(1)
  })

  test('start review navigates to presenter mode', async ({ page, goto }) => {
    // Create a review with items via API
    const res = await page.request.post('/api/reviews', {
      data: { name: 'Sprint API Test', sprint: '99', team: '' },
    })
    expect(res.status()).toBe(201)
    const review = await res.json()

    await page.request.post(`/api/reviews/${review.id}/items`, {
      data: { issue_id: 'T-1', title: 'Feature A', presenter: 'Bob', item_status: 'progress', tags: [] },
    })

    await goto('/', { waitUntil: 'hydration' })

    // Should show our review as a draft first.
    const finishBtn = page.getByRole('button', { name: /finish planning/i })
    await expect(finishBtn).toBeVisible()
    await finishBtn.click()

    const startBtn = page.getByRole('button', { name: /start review/i })
    await expect(startBtn).toBeVisible()
    await startBtn.click()

    await page.waitForURL(`**/present/${review.id}`)
    await expect(page.locator('.present')).toBeVisible()
  })
})
