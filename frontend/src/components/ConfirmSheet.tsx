import { X } from 'lucide-react'

/**
 * Нижня шторка підтвердження.
 *
 * Кожна кнопка в кабінеті — це сигнал, за яким ми починаємо діяти: публікуємо
 * оголошення, збираємо статистику, шукаємо орендаря. Випадкове натискання
 * «Знайти орендаря» власник мав би пояснювати своєму орендарю, тому підтвердження
 * обов'язкове, а не опційне.
 */
export default function ConfirmSheet({
  title,
  description,
  confirmLabel,
  tone = 'accent',
  onConfirm,
  onCancel,
}: {
  title: string
  description: string
  confirmLabel: string
  tone?: 'accent' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}) {
  const confirmClass =
    tone === 'danger'
      ? 'bg-vacant text-black'
      : 'bg-accent text-white shadow-[0_0_24px_-4px_var(--color-accent)]'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        aria-label="Закрити"
        onClick={onCancel}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div className="animate-sheet relative w-full max-w-[480px] rounded-t-3xl border-t border-border bg-surface p-5 pb-8">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />

        <button
          onClick={onCancel}
          className="absolute right-4 top-4 text-muted transition-colors hover:text-foreground"
        >
          <X size={20} />
        </button>

        <h3 className="pr-8 text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-border py-3.5 text-sm font-semibold text-muted transition-colors active:bg-surface-2"
          >
            Скасувати
          </button>
          <button
            onClick={onConfirm}
            className={`flex-[1.4] rounded-2xl py-3.5 text-sm font-bold transition-transform active:scale-95 ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
