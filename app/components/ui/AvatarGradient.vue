<script setup lang="ts">
const props = withDefaults(defineProps<{
  name: string
  size?: 'sm' | 'md' | 'lg'
}>(), { size: 'md' })

const AV_GRADS = [
  'linear-gradient(135deg, #2E8AFF, #00D4F5)',
  'linear-gradient(135deg, #7B5BFF, #2E8AFF)',
  'linear-gradient(135deg, #34D9A4, #00D4F5)',
  'linear-gradient(135deg, #7B5BFF, #FF6B7A)',
  'linear-gradient(135deg, #2E8AFF, #7B5BFF)',
  'linear-gradient(135deg, #FF6B7A, #F5B638)',
  'linear-gradient(135deg, #34D9A4, #2E8AFF)',
]

const gradient = computed(() => {
  let hash = 0
  for (let i = 0; i < props.name.length; i++) {
    hash = (hash + props.name.charCodeAt(i)) % AV_GRADS.length
  }
  return AV_GRADS[hash]
})

const initials = computed(() => {
  const parts = props.name.trim().split(/\s+/)
  if (parts.length >= 2) return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
  return props.name.slice(0, 2).toUpperCase()
})
</script>

<template>
  <div
    class="ll-avatar"
    :class="`ll-avatar-${size}`"
    :style="{ background: gradient }"
  >{{ initials }}</div>
</template>
