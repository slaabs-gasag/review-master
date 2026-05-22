<script setup lang="ts">
defineProps<{ status: 'done' | 'progress' | 'blocked' | 'live' }>()

const CONFIG = {
  done:     { chip: 'chip chip-mint',    dot: 'dot dot-mint',  label: 'Done' },
  progress: { chip: 'chip chip-amber',   dot: 'dot dot-amber', label: 'In Progress' },
  blocked:  { chip: 'chip chip-coral',   dot: 'dot dot-coral', label: 'Blocked' },
  live:     { chip: 'chip chip-cyan',    dot: 'livedot',       label: 'Live' },
} as const
</script>

<template>
  <span :class="CONFIG[status].chip">
    <span :class="CONFIG[status].dot" />
    {{ CONFIG[status].label }}
  </span>
</template>
