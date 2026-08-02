const money = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 })

export const uah = (value: number) => money.format(value)

export const date = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
