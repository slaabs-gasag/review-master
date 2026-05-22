import type { ReviewItemWithMedia, ReviewWithItems } from '~/server/types/db'

export interface PresentationSlide {
  id: string
  kind: 'cover' | 'agenda' | 'intro' | 'screenshot' | 'end'
  review?: ReviewWithItems
  item?: ReviewItemWithMedia
  screenshotIndex?: number
  screenshotCount: number
}

export function buildPresentationSlides(review: ReviewWithItems | null | undefined): PresentationSlide[] {
  const items = review?.items ?? []

  const itemSlides = (items ?? []).flatMap((item) => {
    const screenshotCount = item.screenshots?.length ?? 0
    const introSlide: PresentationSlide = {
      id: `${item.id}:intro`,
      kind: 'intro',
      review: review ?? undefined,
      item,
      screenshotCount,
    }

    const screenshotSlides: PresentationSlide[] = item.screenshots.map((screenshot, screenshotIndex) => ({
      id: `${item.id}:${screenshot.id}`,
      kind: 'screenshot',
      review: review ?? undefined,
      item,
      screenshotIndex,
      screenshotCount,
    }))

    return [introSlide, ...screenshotSlides]
  })

  return [
    {
      id: 'review:cover',
      kind: 'cover',
      review: review ?? undefined,
      screenshotCount: 0,
    },
    {
      id: 'review:agenda',
      kind: 'agenda',
      review: review ?? undefined,
      screenshotCount: 0,
    },
    ...itemSlides,
    {
      id: 'review:end',
      kind: 'end',
      review: review ?? undefined,
      screenshotCount: 0,
    },
  ]
}
