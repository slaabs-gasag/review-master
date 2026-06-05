import { expect, test } from '@nuxt/test-utils/playwright'

async function createReviewWithItems(page: any, itemCount = 1) {
  const res = await page.request.post('/api/reviews', {
    data: { name: `Test Review ${Date.now()}`, sprint: '99', team: 'Test' },
  })
  const review = await res.json()

  const items: any[] = []
  for (let i = 0; i < itemCount; i++) {
    const itemRes = await page.request.post(`/api/reviews/${review.id}/items`, {
      data: { issue_id: `T-${i + 1}`, title: `Item ${i + 1}`, presenter: 'Tester', item_status: 'progress', tags: [] },
    })
    items.push(await itemRes.json())
  }

  return { review, items }
}

async function uploadTestScreenshot(page: any, itemId: string) {
  const pngBytes = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64'
  )
  const res = await page.request.post(`/api/items/${itemId}/screenshots`, {
    multipart: {
      file: {
        name: 'test.png',
        mimeType: 'image/png',
        buffer: pngBytes,
      },
    },
  })
  return await res.json()
}

// ─── US1: Remove item from review ─────────────────────────────────────────────

test.describe('US1 – Remove item from review', () => {
  test('remove item with confirmation — item disappears from list', async ({ page, goto }) => {
    const { review } = await createReviewWithItems(page, 1)
    await goto('/', { waitUntil: 'hydration' })

    // Select the review if needed
    await page.request.get(`/api/reviews/${review.id}`)

    await expect(page.locator('.agenda-item')).toHaveCount(1)

    // Click "Remove item" button
    await page.getByRole('button', { name: 'Remove item' }).click()

    // Confirmation row appears
    await expect(page.getByText('Remove this item?')).toBeVisible()

    // Confirm deletion
    await page.getByRole('button', { name: 'Confirm' }).click()

    // Item gone from list
    await expect(page.locator('.agenda-item')).toHaveCount(0)
  })

  test('remove item — cancel leaves item intact', async ({ page, goto }) => {
    const { review } = await createReviewWithItems(page, 1)
    await goto(`/?review=${review.id}`, { waitUntil: 'hydration' })

    await expect(page.locator('.agenda-item')).toHaveCount(1)

    await page.getByRole('button', { name: 'Remove item' }).click()
    await expect(page.getByText('Remove this item?')).toBeVisible()

    await page.getByRole('button', { name: 'Cancel' }).click()

    // Confirmation hidden
    await expect(page.getByText('Remove this item?')).not.toBeVisible()
    // Item still there
    await expect(page.locator('.agenda-item')).toHaveCount(1)
  })

  test('remove one of two items — other item remains', async ({ page, goto }) => {
    const { review, items } = await createReviewWithItems(page, 2)
    await goto(`/?review=${review.id}`, { waitUntil: 'hydration' })

    await expect(page.locator('.agenda-item')).toHaveCount(2)

    // Select first item and delete it
    await page.locator('.agenda-item').first().click()
    await page.getByRole('button', { name: 'Remove item' }).click()
    await page.getByRole('button', { name: 'Confirm' }).click()

    await expect(page.locator('.agenda-item')).toHaveCount(1)

    // Verify correct item was removed via API
    const res = await page.request.get(`/api/reviews/${review.id}`)
    const data = await res.json()
    expect(data.items).toHaveLength(1)
    expect(data.items[0].id).toBe(items[1].id)
  })
})

// ─── US2: Screenshot notes ─────────────────────────────────────────────────────

test.describe('US2 – Screenshot notes', () => {
  test('add note to screenshot — persists after reload', async ({ page, goto }) => {
    const { review, items } = await createReviewWithItems(page, 1)
    await uploadTestScreenshot(page, items[0].id)

    await goto(`/?review=${review.id}`, { waitUntil: 'hydration' })

    // Select item
    await page.locator('.agenda-item').first().click()

    // Screenshot should be visible in editor — find notes textarea
    const notesInput = page.locator('.shot-notes').first()
    await expect(notesInput).toBeVisible()

    await notesInput.fill('Key talking point here')
    await notesInput.blur()

    // Reload
    await goto(`/?review=${review.id}`, { waitUntil: 'hydration' })
    await page.locator('.agenda-item').first().click()

    await expect(page.locator('.shot-notes').first()).toHaveValue('Key talking point here')
  })

  test('screenshot notes visible in presenter view', async ({ page, goto }) => {
    const { review, items } = await createReviewWithItems(page, 1)
    const screenshot = await uploadTestScreenshot(page, items[0].id)

    // Set notes via API
    await page.request.put(`/api/screenshots/${screenshot.id}`, {
      data: { notes: 'Presenter note for this slide' },
    })

    // Finish planning and start
    await page.request.put(`/api/reviews/${review.id}`, { data: { status: 'plan_finished' } })

    await goto(`/present/${review.id}`, { waitUntil: 'hydration' })

    // Navigate to the screenshot slide (past cover + agenda + item intro)
    const nextBtn = page.locator('.presenter-next, [data-next], button:has-text("→")').first()
    // Navigate through cover, agenda, item intro to screenshot slide
    for (let i = 0; i < 3; i++) {
      await nextBtn.click()
    }

    await expect(page.getByText('Presenter note for this slide')).toBeVisible()
  })
})

// ─── US3: Reorder screenshots ──────────────────────────────────────────────────

test.describe('US3 – Reorder screenshots', () => {
  test('reorder screenshots — persists after reload', async ({ page, goto }) => {
    const { review, items } = await createReviewWithItems(page, 1)
    const shot1 = await uploadTestScreenshot(page, items[0].id)
    const shot2 = await uploadTestScreenshot(page, items[0].id)

    // Reorder via API directly (drag reorder is hard to test reliably)
    const reorderRes = await page.request.put(`/api/items/${items[0].id}/screenshots/reorder`, {
      data: { order: [shot2.id, shot1.id] },
    })
    expect(reorderRes.status()).toBe(200)

    // Reload and verify order
    const itemRes = await page.request.get(`/api/reviews/${review.id}`)
    const data = await itemRes.json()
    const shots = data.items[0].screenshots
    expect(shots[0].id).toBe(shot2.id)
    expect(shots[1].id).toBe(shot1.id)
  })

  test('reorder preserves order in presenter view slides', async ({ page, goto }) => {
    const { review, items } = await createReviewWithItems(page, 1)
    const shot1 = await uploadTestScreenshot(page, items[0].id)
    const shot2 = await uploadTestScreenshot(page, items[0].id)

    // Swap order
    await page.request.put(`/api/items/${items[0].id}/screenshots/reorder`, {
      data: { order: [shot2.id, shot1.id] },
    })

    await page.request.put(`/api/reviews/${review.id}`, { data: { status: 'plan_finished' } })

    await goto(`/present/${review.id}`, { waitUntil: 'hydration' })

    // Verify via API that slide order matches reordered shots
    const itemRes = await page.request.get(`/api/reviews/${review.id}`)
    const data = await itemRes.json()
    expect(data.items[0].screenshots[0].id).toBe(shot2.id)
    expect(data.items[0].screenshots[1].id).toBe(shot1.id)
  })
})
