const dayMonth = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})
const full = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

/**
 * Período do evento a partir de datas ISO (AAAA-MM-DD).
 * Ex.: "3 e 4 de dez. de 2026", "30 de nov. a 2 de dez. de 2026".
 */
export function formatEventPeriod(startsOn: string, endsOn: string) {
  const start = new Date(`${startsOn}T00:00:00Z`)
  const end = new Date(`${endsOn}T00:00:00Z`)

  if (startsOn === endsOn) return full.format(start)

  const sameMonth =
    start.getUTCMonth() === end.getUTCMonth() && start.getUTCFullYear() === end.getUTCFullYear()
  if (sameMonth) {
    const separator = end.getUTCDate() - start.getUTCDate() === 1 ? ' e ' : ' a '
    return `${start.getUTCDate()}${separator}${full.format(end)}`
  }

  return `${dayMonth.format(start)} a ${full.format(end)}`
}

export function pluralize(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`
}

const stampDay = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  timeZone: 'America/Sao_Paulo',
})
const stampTime = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
})

/** Data do carimbo no fuso do evento: { day: "03 DEZ", time: "14:32" } */
export function formatStampDate(iso: string) {
  const date = new Date(iso)
  const day = stampDay
    .formatToParts(date)
    .filter((part) => part.type === 'day' || part.type === 'month')
    .map((part) => part.value.replace('.', '').toUpperCase())
    .join(' ')
  return { day, time: stampTime.format(date) }
}

const dateTime = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
})

export function formatDateTime(iso: string) {
  return dateTime.format(new Date(iso))
}
