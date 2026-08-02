/**
 * Тонка обгортка над Telegram Mini App SDK.
 *
 * Сторінка має однаково працювати у двох середовищах: усередині Telegram
 * (основний сценарій) і у звичайному браузері (fallback по magic-link, а поки що —
 * щоб можна було просто відкрити localhost:3001 і подивитись). Тому всі виклики
 * до window.Telegram — через ці хелпери, і кожен мовчки нічого не робить поза Telegram.
 */

type TelegramWebApp = {
  ready: () => void
  expand: () => void
  colorScheme?: 'light' | 'dark'
  initData?: string
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy') => void
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void
  }
}

function webApp(): TelegramWebApp | undefined {
  return (window as unknown as { Telegram?: { WebApp?: TelegramWebApp } })
    .Telegram?.WebApp
}

export function initTelegram() {
  const tg = webApp()
  if (!tg) return
  tg.ready()
  tg.expand()
}

export function isInsideTelegram(): boolean {
  // initData порожній, якщо сторінку відкрито не з Telegram
  return Boolean(webApp()?.initData)
}

/** Віброзвіт на натискання — усередині Telegram відчувається як нативна кнопка. */
export function haptic(type: 'tap' | 'success' = 'tap') {
  const tg = webApp()
  if (!tg?.HapticFeedback) return
  if (type === 'success') tg.HapticFeedback.notificationOccurred('success')
  else tg.HapticFeedback.impactOccurred('light')
}
