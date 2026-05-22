interface KeyboardNavHandlers {
  onNext: () => void
  onPrev: () => void
  onEscape: () => void
  onQA: () => void
}

export function useKeyboardNav(handlers: KeyboardNavHandlers) {
  function handleKey(event: KeyboardEvent) {
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

    switch (event.key) {
      case 'ArrowRight':
      case ' ':
        event.preventDefault()
        handlers.onNext()
        break
      case 'ArrowLeft':
        event.preventDefault()
        handlers.onPrev()
        break
      case 'Escape':
        handlers.onEscape()
        break
      case 'q':
      case 'Q':
        handlers.onQA()
        break
    }
  }

  onMounted(() => window.addEventListener('keydown', handleKey))
  onUnmounted(() => window.removeEventListener('keydown', handleKey))
}
