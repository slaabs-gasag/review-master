import { expect, test } from '@nuxt/test-utils/playwright'

test.describe('Review status flow', () => {
  test('moves from draft to ready to active and back to ready', async ({ page }) => {
    const res = await page.request.post('/api/reviews', {
      data: { name: 'Status Flow Review', sprint: '30', team: '' },
    })
    expect(res.status()).toBe(201)
    const created = await res.json()
    expect(created.status).toBe('planned')

    const ready = await page.request.put(`/api/reviews/${created.id}`, {
      data: { status: 'plan_finished' },
    })
    expect(ready.status()).toBe(200)
    expect((await ready.json()).status).toBe('plan_finished')

    const active = await page.request.put(`/api/reviews/${created.id}`, {
      data: { status: 'active' },
    })
    expect(active.status()).toBe(200)
    const activeReview = await active.json()
    expect(activeReview.status).toBe('active')
    expect(activeReview.started_at).not.toBeNull()

    const returned = await page.request.put(`/api/reviews/${created.id}`, {
      data: { status: 'plan_finished' },
    })
    expect(returned.status()).toBe(200)
    const returnedReview = await returned.json()
    expect(returnedReview.status).toBe('plan_finished')
    expect(returnedReview.started_at).toBeNull()
    expect(returnedReview.duration_ms).toBeNull()
  })

  test('completes active reviews and keeps completed reviews terminal', async ({ page }) => {
    const res = await page.request.post('/api/reviews', {
      data: { name: 'Terminal Status Review', sprint: '31', team: '' },
    })
    const created = await res.json()

    await page.request.put(`/api/reviews/${created.id}`, { data: { status: 'plan_finished' } })
    await page.request.put(`/api/reviews/${created.id}`, { data: { status: 'active' } })

    const completed = await page.request.put(`/api/reviews/${created.id}`, {
      data: { status: 'completed' },
    })
    expect(completed.status()).toBe(200)
    const completedReview = await completed.json()
    expect(completedReview.status).toBe('completed')
    expect(completedReview.completed_at).not.toBeNull()

    const reopened = await page.request.put(`/api/reviews/${created.id}`, {
      data: { status: 'plan_finished' },
    })
    expect(reopened.status()).toBe(409)
  })

  test('rejects skipped and invalid transitions', async ({ page }) => {
    const res = await page.request.post('/api/reviews', {
      data: { name: 'Invalid Status Review', sprint: '32', team: '' },
    })
    const created = await res.json()

    const skipped = await page.request.put(`/api/reviews/${created.id}`, {
      data: { status: 'active' },
    })
    expect(skipped.status()).toBe(409)

    const invalid = await page.request.put(`/api/reviews/${created.id}`, {
      data: { status: 'paused' },
    })
    expect(invalid.status()).toBe(400)
  })
})
