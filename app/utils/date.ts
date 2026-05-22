export function formatGermanDate(timestamp: number | null | undefined): string {
  if (!timestamp) return ''

  return new Intl.DateTimeFormat('de-DE', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    timeZone: 'Europe/Berlin',
  }).format(new Date(timestamp))
}
