import { expect, test } from '@nuxt/test-utils/playwright'

test.describe('US3 – Archive', () => {
  async function createCompletedReview(page: any) {
    const res = await page.request.post('/api/reviews', {
      data: { name: 'Archived Sprint Review', sprint: '5', team: 'Platform' },
    })
    const review = await res.json()

    await page.request.post(`/api/reviews/${review.id}/items`, {
      data: { issue_id: 'T-10', title: 'Shipped Feature', presenter: 'Carol', item_status: 'done', tags: [] },
    })

    // Transition to ready, active, then completed
    await page.request.put(`/api/reviews/${review.id}`, {
      data: { status: 'plan_finished' },
    })
    await page.request.put(`/api/reviews/${review.id}`, {
      data: { status: 'active' },
    })
    await page.request.put(`/api/reviews/${review.id}`, {
      data: { status: 'completed' },
    })

    return review
  }

  test('completed review appears in archive', async ({ page, goto }) => {
    const review = await createCompletedReview(page)
    await goto('/archive', { waitUntil: 'hydration' })

    await expect(page.locator('.archive, main')).toContainText('Archived Sprint Review')
  })

  test('archive detail shows items', async ({ page, goto }) => {
    const review = await createCompletedReview(page)
    await goto(`/archive/${review.id}`, { waitUntil: 'hydration' })

    await expect(page.locator('body')).toContainText('Shipped Feature')
  })

  test('re-watch opens archive presenter mode', async ({ page, goto }) => {
    const review = await createCompletedReview(page)
    await goto(`/archive/${review.id}`, { waitUntil: 'hydration' })

    const rewatchBtn = page.getByRole('link', { name: /re-?watch/i })
    await expect(rewatchBtn).toBeVisible()
    await rewatchBtn.click()

    await page.waitForURL(`**/archive/${review.id}/present`)
    await expect(page.locator('.present')).toBeVisible()
  })

  test('archive presenter Escape returns to archive detail', async ({ page, goto }) => {
    const review = await createCompletedReview(page)
    await goto(`/archive/${review.id}/present`, { waitUntil: 'hydration' })

    await page.keyboard.press('Escape')
    await page.waitForURL(`**/archive/${review.id}`)
  })
})
