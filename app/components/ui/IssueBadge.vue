<script setup lang="ts">
defineProps<{ issueId: string }>()
</script>

<template>
  <span class="chip chip-issue">{{ issueId }}</span>
</template>
