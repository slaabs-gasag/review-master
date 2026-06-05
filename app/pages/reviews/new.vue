<script setup lang="ts">
definePageMeta({ layout: 'default' })

const router = useRouter()

const name = ref('')
const sprint = ref('')
const team = ref('')
const reviewDate = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  name.value = name.value.trim()
  sprint.value = sprint.value.trim()
  if (!name.value || !sprint.value) {
    error.value = 'Review name and sprint are required'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const review = await $fetch<{ id: string }>('/api/reviews', {
      method: 'POST',
      body: { name: name.value, sprint: sprint.value, team: team.value, review_date: reviewDate.value || undefined },
    })
    await router.push({ path: '/', query: { review: review.id } })
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Failed to create review'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="form-page">
    <p class="eyebrow" style="margin-bottom:8px;">Sprint Review</p>
    <h1>New Review</h1>
    <p class="form-sub">Set up a review session to plan and present your sprint work.</p>

    <form @submit.prevent="submit">
      <div class="form-fields">
        <div class="field">
          <label class="eyebrow" for="review-name">Review name</label>
          <input
            id="review-name"
            v-model="name"
            class="rm-input"
            type="text"
            placeholder="Sprint 47 · Review"
            autocomplete="off"
            required
          />
        </div>

        <div class="field">
          <label class="eyebrow" for="review-sprint">Sprint</label>
          <input
            id="review-sprint"
            v-model="sprint"
            class="rm-input"
            type="text"
            placeholder="47"
            autocomplete="off"
            required
          />
        </div>

        <div class="field">
          <label class="eyebrow" for="review-team">
            Team
            <span style="color:var(--fg-disabled);font-weight:400;"> (optional)</span>
          </label>
          <input
            id="review-team"
            v-model="team"
            class="rm-input"
            type="text"
            placeholder="Workstream Studio"
            autocomplete="off"
          />
        </div>

        <div class="field">
          <label class="eyebrow" for="review-date">
            Review date
            <span style="color:var(--fg-disabled);font-weight:400;"> (optional)</span>
          </label>
          <input
            id="review-date"
            v-model="reviewDate"
            class="rm-input rm-input-date"
            type="date"
          />
        </div>

        <p v-if="error" style="color: var(--coral-50); font-size: var(--text-sm);">{{ error }}</p>
      </div>

      <div class="form-actions">
        <button type="submit" class="rm-btn rm-btn-primary" :disabled="loading">
          {{ loading ? 'Creating…' : 'Create review' }}
        </button>
        <button type="button" class="rm-btn rm-btn-ghost" @click="router.back()">Cancel</button>
      </div>
    </form>
  </div>
</template>
