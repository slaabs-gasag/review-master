import type { ReviewItem } from '~/server/types/db'

export function useDragReorder(
  items: Ref<ReviewItem[]>,
  onReorder: (ids: string[]) => void,
) {
  const draggingId = ref<string | null>(null)
  const overIndex = ref<number | null>(null)

  function onDragStart(id: string) {
    draggingId.value = id
  }

  function onDragOver(event: DragEvent, index: number) {
    event.preventDefault()
    overIndex.value = index
  }

  function onDrop(event: DragEvent, targetIndex: number) {
    event.preventDefault()
    const sourceId = draggingId.value
    if (!sourceId) return

    const sourceIndex = items.value.findIndex(i => i.id === sourceId)
    if (sourceIndex === -1 || sourceIndex === targetIndex) {
      draggingId.value = null
      overIndex.value = null
      return
    }

    const reordered = [...items.value]
    const moved = reordered.splice(sourceIndex, 1)[0]
    if (!moved) return
    reordered.splice(targetIndex, 0, moved)

    onReorder(reordered.map(i => i.id))
    draggingId.value = null
    overIndex.value = null
  }

  function onDragEnd() {
    draggingId.value = null
    overIndex.value = null
  }

  return { onDragStart, onDragOver, onDrop, onDragEnd, draggingId, overIndex }
}
