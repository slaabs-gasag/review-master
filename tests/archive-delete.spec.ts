import { expect, test } from '@nuxt/test-utils/playwright'

test.describe('Archive Delete', () => {
  async function createCompletedReview(page: any, name: string) {
    const res = await page.request.post('/api/reviews', {
      data: { name, sprint: '99', team: 'QA' },
    })
    const review = await res.json()

    await page.request.post(`/api/reviews/${review.id}/items`, {
      data: { issue_id: 'D-1', title: 'Item to delete', presenter: 'Tester', item_status: 'done', tags: [] },
    })

    await page.request.put(`/api/reviews/${review.id}`, { data: { status: 'plan_finished' } })
    await page.request.put(`/api/reviews/${review.id}`, { data: { status: 'active' } })
    await page.request.put(`/api/reviews/${review.id}`, { data: { status: 'completed' } })

    return review
  }

  test('delete button visible on hover in archive list', async ({ page, goto }) => {
    await createCompletedReview(page, `Hover Test ${Date.now()}`)
    await goto('/archive', { waitUntil: 'hydration' })

    const card = page.locator('.archive-card-wrap').first()
    await card.hover()
    await expect(card.locator('.archive-delete-btn')).toBeVisible()
  })

  test('cancel delete — review stays in archive list', async ({ page, goto }) => {
    const name = `Cancel Delete ${Date.now()}`
    const review = await createCompletedReview(page, name)
    await goto('/archive', { waitUntil: 'hydration' })

    const card = page.locator('.archive-card-wrap').filter({ hasText: name })
    await card.hover()
    await card.locator('.archive-delete-btn').click()

    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: 'Cancel' }).click()

    await expect(page.getByRole('dialog')).not.toBeVisible()
    // review still navigable
    const res = await page.request.get(`/api/reviews/${review.id}`)
    expect(res.status()).toBe(200)
  })

  test('confirm delete — review removed from archive list', async ({ page, goto }) => {
    const name = `Confirm Delete ${Date.now()}`
    const review = await createCompletedReview(page, name)
    await goto('/archive', { waitUntil: 'hydration' })

    const card = page.locator('.archive-card-wrap').filter({ hasText: name })
    await card.hover()
    await card.locator('.archive-delete-btn').click()

    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: 'Delete' }).click()

    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(page.locator('.archive-grid')).not.toContainText(name)
    // verify server-side deletion
    const res = await page.request.get(`/api/reviews/${review.id}`)
    expect(res.status()).toBe(404)
  })

  test('delete from archive detail — redirects to /archive', async ({ page, goto }) => {
    const name = `Detail Delete ${Date.now()}`
    const review = await createCompletedReview(page, name)
    await goto(`/archive/${review.id}`, { waitUntil: 'hydration' })

    await page.getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.getByRole('button', { name: 'Delete' }).last().click()
    await page.waitForURL('**/archive')
    await expect(page.locator('.archive-grid')).not.toContainText(name)
  })

  test('cancel delete from archive detail — stays on detail page', async ({ page, goto }) => {
    const name = `Detail Cancel ${Date.now()}`
    const review = await createCompletedReview(page, name)
    await goto(`/archive/${review.id}`, { waitUntil: 'hydration' })

    await page.getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(page.url()).toContain(`/archive/${review.id}`)
  })
})
