import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import StatusBadge from '~/components/ui/StatusBadge.vue'

describe('StatusBadge', () => {
  it('renders done status with mint chip', async () => {
    const wrapper = await mountSuspended(StatusBadge, { props: { status: 'done' } })
    expect(wrapper.classes()).toContain('chip-mint')
    expect(wrapper.text()).toContain('Done')
  })

  it('renders progress status with amber chip', async () => {
    const wrapper = await mountSuspended(StatusBadge, { props: { status: 'progress' } })
    expect(wrapper.classes()).toContain('chip-amber')
    expect(wrapper.text()).toContain('In Progress')
  })

  it('renders blocked status with coral chip', async () => {
    const wrapper = await mountSuspended(StatusBadge, { props: { status: 'blocked' } })
    expect(wrapper.classes()).toContain('chip-coral')
    expect(wrapper.text()).toContain('Blocked')
  })

  it('renders live status with cyan chip', async () => {
    const wrapper = await mountSuspended(StatusBadge, { props: { status: 'live' } })
    expect(wrapper.classes()).toContain('chip-cyan')
    expect(wrapper.text()).toContain('Live')
  })
})
