import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AgendaRow from '~/components/plan/AgendaRow.vue'
import type { ReviewItemWithMedia } from '~/server/types/db'

const mockItem: ReviewItemWithMedia = {
  id: 'item-1',
  review_id: 'rev-1',
  issue_id: 'RM-42',
  title: 'Test Feature',
  presenter: 'Alice',
  description: '',
  demo_url: '',
  item_status: 'progress',
  tags: ['frontend', 'ui'],
  order_index: 0,
  created_at: Date.now(),
  screenshots: [],
}

describe('AgendaRow', () => {
  it('renders issue ID', async () => {
    const wrapper = await mountSuspended(AgendaRow, {
      props: { item: mockItem, index: 0, selected: false, dragging: false },
    })
    expect(wrapper.text()).toContain('RM-42')
  })

  it('renders status badge element in agenda-status slot', async () => {
    const wrapper = await mountSuspended(AgendaRow, {
      props: { item: mockItem, index: 0, selected: false, dragging: false },
    })
    const statusDiv = wrapper.find('.agenda-status')
    expect(statusDiv.exists()).toBe(true)
    // StatusBadge is rendered (as stub or real) inside .agenda-status
    expect(statusDiv.html()).toBeTruthy()
  })

  it('renders presenter name', async () => {
    const wrapper = await mountSuspended(AgendaRow, {
      props: { item: mockItem, index: 0, selected: false, dragging: false },
    })
    expect(wrapper.text()).toContain('Alice')
  })

  it('applies selected class when selected=true', async () => {
    const wrapper = await mountSuspended(AgendaRow, {
      props: { item: mockItem, index: 0, selected: true, dragging: false },
    })
    expect(wrapper.classes()).toContain('on')
  })

  it('applies dragging class when dragging=true', async () => {
    const wrapper = await mountSuspended(AgendaRow, {
      props: { item: mockItem, index: 0, selected: false, dragging: true },
    })
    expect(wrapper.classes()).toContain('dragging')
  })

  it('emits select on click', async () => {
    const wrapper = await mountSuspended(AgendaRow, {
      props: { item: mockItem, index: 0, selected: false, dragging: false },
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted('select')).toBeTruthy()
  })

  it('emits dragstart with item id', async () => {
    const wrapper = await mountSuspended(AgendaRow, {
      props: { item: mockItem, index: 0, selected: false, dragging: false },
    })
    await wrapper.trigger('dragstart')
    const emitted = wrapper.emitted('dragstart')
    expect(emitted).toBeTruthy()
    expect(emitted![0]).toEqual(['item-1'])
  })

  it('renders tags', async () => {
    const wrapper = await mountSuspended(AgendaRow, {
      props: { item: mockItem, index: 0, selected: false, dragging: false },
    })
    expect(wrapper.text()).toContain('frontend, ui')
  })
})
