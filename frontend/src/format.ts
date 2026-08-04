const money = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 })

export const uah = (value: number) => money.format(value)

/** Українська множина: 1 приміщення, 2 приміщення, 5 приміщень */
export function plural(n: number, one: string, few: string, many: string) {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 14) return many
  switch (n % 10) {
    case 1:
      return one
    case 2:
    case 3:
    case 4:
      return few
    default:
      return many
  }
}

export const date = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
