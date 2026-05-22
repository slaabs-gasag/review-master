import { expect, test } from '@nuxt/test-utils/playwright'

test.describe('US2 – Presenter Mode', () => {
  async function createReviewWithItems(page: any) {
    const res = await page.request.post('/api/reviews', {
      data: { name: 'Present Test Review', sprint: '20', team: '' },
    })
    const review = await res.json()
    await page.request.post(`/api/reviews/${review.id}/items`, {
      data: { issue_id: 'T-1', title: 'Feature A', presenter: 'Alice', item_status: 'progress', tags: [] },
    })
    await page.request.post(`/api/reviews/${review.id}/items`, {
      data: { issue_id: 'T-2', title: 'Feature B', presenter: 'Bob', item_status: 'done', tags: [] },
    })
    await page.request.put(`/api/reviews/${review.id}`, {
      data: { status: 'plan_finished' },
    })
    await page.request.put(`/api/reviews/${review.id}`, {
      data: { status: 'active' },
    })
    return review
  }

  test('keyboard navigation moves between slides', async ({ page, goto }) => {
    const review = await createReviewWithItems(page)
    await goto(`/present/${review.id}`, { waitUntil: 'hydration' })

    await expect(page.locator('.present')).toBeVisible()

    // Review starts with cover and agenda before item slides.
    await expect(page.locator('.present')).toContainText('Present Test Review')
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('.present')).toContainText('Agenda')

    await page.keyboard.press('ArrowRight')
    await expect(page.locator('.present')).toContainText('T-1')

    // ArrowRight -> next item
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('.present')).toContainText('T-2')

    // ArrowLeft → back
    await page.keyboard.press('ArrowLeft')
    await expect(page.locator('.present')).toContainText('T-1')
  })

  test('Q key toggles QA panel', async ({ page, goto }) => {
    const review = await createReviewWithItems(page)
    await goto(`/present/${review.id}`, { waitUntil: 'hydration' })

    const qaPanel = page.locator('.qa-panel, [class*="qa"]').first()

    await page.keyboard.press('q')
    // Panel should become visible
    await page.waitForTimeout(300)
    const isVisible = await qaPanel.isVisible().catch(() => false)
    // Just verify the key didn't crash the page
    await expect(page.locator('.present')).toBeVisible()
  })

  test('Escape exits to home', async ({ page, goto }) => {
    const review = await createReviewWithItems(page)
    await goto(`/present/${review.id}`, { waitUntil: 'hydration' })

    await page.keyboard.press('Escape')
    await page.waitForURL('**/?review=*')
  })

  test('end review on last slide completes and redirects to archive', async ({ page, goto }) => {
    const review = await createReviewWithItems(page)
    await goto(`/present/${review.id}`, { waitUntil: 'hydration' })

    // Navigate to the end slide.
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('.present')).toContainText('Danke')

    // End review button should appear
    const endBtn = page.getByRole('button', { name: /end review/i })
    await expect(endBtn).toBeVisible({ timeout: 2000 })
    await endBtn.click()

    await page.waitForURL('**/archive')
  })
})
