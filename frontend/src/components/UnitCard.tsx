import { CalendarClock, Check, Search, TrendingUp, UserPlus } from 'lucide-react'
import type { Unit } from '../mock'
import { date, uah } from '../format'

export type RequestType = 'RENT_OUT' | 'CHECK_DEMAND' | 'FIND_TENANT'

export default function UnitCard({
  unit,
  sent,
  onRequest,
}: {
  unit: Unit
  sent: Array<RequestType>
  onRequest: (type: RequestType) => void
}) {
  const isVacant = unit.tenant === null
  // Наскільки поточна ставка нижча за ринок — головна цифра всього кабінету
  const gap = unit.rent !== null ? unit.marketRent - unit.rent : 0
  const underpriced = gap > 0

  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-surface ${
        isVacant ? 'border-vacant/40' : 'border-border'
      }`}
    >
      {isVacant && (
        <div className="flex items-center gap-2 bg-vacant/10 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-vacant">
          <span className="h-1.5 w-1.5 rounded-full bg-vacant" />
          Вільно
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-semibold">{unit.label}</div>
            <div className="mt-0.5 text-sm text-muted">{unit.area} м²</div>
          </div>

          <div className="shrink-0 text-right">
            {isVacant ? (
              <>
                <div className="text-lg font-bold text-vacant">
                  {uah(unit.marketRent)}
                </div>
                <div className="text-[11px] text-muted">орієнтовно, грн/міс</div>
              </>
            ) : (
              <>
                <div className="text-lg font-bold">{uah(unit.rent!)}</div>
                <div className="text-[11px] text-muted">грн/міс</div>
              </>
            )}
          </div>
        </div>

        {!isVacant && (
          <div className="mt-3 space-y-1.5 border-t border-border pt-3">
            <div className="text-sm">{unit.tenant}</div>
            {unit.leaseUntil && (
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <CalendarClock size={12} />
                Договір до {date(unit.leaseUntil)}
              </div>
            )}
          </div>
        )}

        {underpriced && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/10 px-3 py-2.5">
            <TrendingUp size={16} className="shrink-0 text-gold" />
            <div className="text-sm leading-tight">
              <span className="text-muted">Актуальна ціна </span>
              <span className="font-bold text-gold">
                {uah(unit.marketRent)}
              </span>
              <span className="text-gold"> грн</span>
              <div className="mt-0.5 text-xs text-muted">
                на {uah(gap)} грн/міс більше за поточну
              </div>
            </div>
          </div>
        )}

        <div className="mt-4">
          {isVacant ? (
            <ActionButton
              primary
              done={sent.includes('RENT_OUT')}
              doneLabel="Заявку надіслано"
              icon={<Search size={15} />}
              label="Здати об'єкт"
              onClick={() => onRequest('RENT_OUT')}
            />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <ActionButton
                done={sent.includes('CHECK_DEMAND')}
                doneLabel="Перевіряємо"
                icon={<Search size={15} />}
                label="Дізнатись попит"
                onClick={() => onRequest('CHECK_DEMAND')}
              />
              <ActionButton
                done={sent.includes('FIND_TENANT')}
                doneLabel="Шукаємо"
                icon={<UserPlus size={15} />}
                label="Знайти орендаря"
                onClick={() => onRequest('FIND_TENANT')}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ActionButton({
  label,
  doneLabel,
  icon,
  done,
  primary,
  onClick,
}: {
  label: string
  doneLabel: string
  icon: React.ReactNode
  done: boolean
  primary?: boolean
  onClick: () => void
}) {
  if (done) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-occupied/40 bg-occupied/10 py-3 text-sm font-semibold text-occupied">
        <Check size={15} />
        {doneLabel}
      </div>
    )
  }

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-transform active:scale-95 ${
        primary
          ? 'bg-accent text-white shadow-[0_0_24px_-6px_var(--color-accent)]'
          : 'border border-border bg-surface-2 text-foreground'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
