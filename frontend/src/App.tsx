import { useMemo, useState } from 'react'
import { Crown, MapPin, Phone, TrendingDown, Wallet } from 'lucide-react'
import { OWNER } from './mock'
import type { Site } from './mock'
import { uah } from './format'
import { haptic } from './telegram'
import UnitCard from './components/UnitCard'
import type { RequestType } from './components/UnitCard'
import ConfirmSheet from './components/ConfirmSheet'

type PendingRequest = { unitId: string; unitLabel: string; type: RequestType }

export default function App() {
  const [activeSiteId, setActiveSiteId] = useState(OWNER.sites[0].id)
  const [pending, setPending] = useState<PendingRequest | null>(null)
  // Ключ виду "unitId:REQUEST_TYPE". Поки що тільки в пам'яті — бекенда ще немає.
  const [sent, setSent] = useState<Array<string>>([])

  const site = OWNER.sites.find((s) => s.id === activeSiteId)!

  const totals = useMemo(() => {
    const units = OWNER.sites.flatMap((s) => s.units)
    const income = units.reduce((sum, u) => sum + (u.rent ?? 0), 0)
    const lost = units
      .filter((u) => u.tenant === null)
      .reduce((sum, u) => sum + u.marketRent, 0)
    const area = units.reduce((sum, u) => sum + u.area, 0)
    const occupiedArea = units
      .filter((u) => u.tenant !== null)
      .reduce((sum, u) => sum + u.area, 0)
    return {
      income,
      lost,
      occupancy: Math.round((occupiedArea / area) * 100),
    }
  }, [])

  const confirm = () => {
    if (!pending) return
    setSent((prev) => [...prev, `${pending.unitId}:${pending.type}`])
    setPending(null)
    haptic('success')
  }

  return (
    <div className="mx-auto min-h-full w-full max-w-[480px] px-4 pb-12">
      <Header />
      <Totals {...totals} />
      <SiteTabs
        sites={OWNER.sites}
        activeId={activeSiteId}
        onSelect={(id) => {
          setActiveSiteId(id)
          haptic()
        }}
      />
      <SiteView site={site} />

      <div className="mt-4 space-y-3">
        {site.units.map((unit) => (
          <UnitCard
            key={unit.id}
            unit={unit}
            sent={
              (['RENT_OUT', 'CHECK_DEMAND', 'FIND_TENANT'] as const).filter(
                (t) => sent.includes(`${unit.id}:${t}`),
              ) as Array<RequestType>
            }
            onRequest={(type) => {
              haptic()
              setPending({ unitId: unit.id, unitLabel: unit.label, type })
            }}
          />
        ))}
      </div>

      <ManagerCard />

      {pending && (
        <ConfirmSheet
          {...sheetCopy(pending)}
          onConfirm={confirm}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  )
}

function Header() {
  return (
    <header className="flex items-center gap-3 py-6">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-gold/40 bg-gold/10 text-gold">
        <Crown size={22} />
      </div>
      <div className="min-w-0">
        <div className="truncate text-xl font-semibold">{OWNER.name}</div>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="rounded-md border border-gold/40 bg-gold/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-gold">
            Prime
          </span>
          <span className="text-xs text-muted">
            {OWNER.sites.length} бази · Reland
          </span>
        </div>
      </div>
    </header>
  )
}

function Totals({
  income,
  lost,
  occupancy,
}: {
  income: number
  lost: number
  occupancy: number
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted">
          <Wallet size={12} /> Дохід
        </div>
        <div className="mt-1.5 text-xl font-bold">{uah(income)}</div>
        <div className="text-[11px] text-muted">грн/міс · заповнено {occupancy}%</div>
      </div>

      {/* Упущена вигода — головна цифра кабінету: показує, що простій коштує грошей */}
      <div className="rounded-2xl border border-vacant/30 bg-vacant/10 p-4">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-vacant/80">
          <TrendingDown size={12} /> Упущено
        </div>
        <div className="mt-1.5 text-xl font-bold text-vacant">{uah(lost)}</div>
        <div className="text-[11px] text-vacant/70">грн/міс на порожніх</div>
      </div>
    </div>
  )
}

function SiteTabs({
  sites,
  activeId,
  onSelect,
}: {
  sites: Array<Site>
  activeId: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4">
      {sites.map((s) => {
        const vacant = s.units.filter((u) => u.tenant === null).length
        const active = s.id === activeId
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
              active
                ? 'border-accent bg-accent/15 text-foreground'
                : 'border-border bg-surface text-muted'
            }`}
          >
            {s.name}
            {vacant > 0 && (
              <span className="rounded-md bg-vacant/20 px-1.5 py-0.5 text-[10px] font-bold text-vacant">
                {vacant} вільно
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function SiteView({ site }: { site: Site }) {
  const occupied = site.units.filter((u) => u.tenant !== null)
  const area = site.units.reduce((sum, u) => sum + u.area, 0)

  return (
    <section className="mt-5">
      <div className="flex items-start gap-2 text-sm text-muted">
        <MapPin size={15} className="mt-0.5 shrink-0 text-accent" />
        <span>{site.address}</span>
      </div>

      <div className="mt-3 flex items-baseline justify-between text-xs">
        <span className="text-muted">
          Здано {occupied.length} з {site.units.length} блоків
        </span>
        <span className="text-muted">{area} м²</span>
      </div>

      {/* Смуга заповнюваності: ширина сегмента пропорційна площі блоку */}
      <div className="mt-2 flex h-2 gap-0.5 overflow-hidden rounded-full">
        {site.units.map((u) => (
          <div
            key={u.id}
            style={{ width: `${(u.area / area) * 100}%` }}
            className={u.tenant ? 'bg-occupied' : 'bg-vacant'}
          />
        ))}
      </div>
    </section>
  )
}

function ManagerCard() {
  return (
    <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
        <Phone size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">Ваш менеджер</div>
        <div className="text-xs text-muted">Сергій Сергєєв · Reland</div>
      </div>
      <button className="rounded-xl border border-border px-4 py-2 text-sm font-semibold transition-transform active:scale-95">
        Зв'язатись
      </button>
    </div>
  )
}

function sheetCopy({ unitLabel, type }: PendingRequest) {
  if (type === 'RENT_OUT') {
    return {
      title: `Здати «${unitLabel}»?`,
      confirmLabel: 'Так, здаємо',
      tone: 'accent' as const,
      description:
        'Ми одразу опублікуємо приміщення на всіх рекламних майданчиках і почнемо шукати орендаря. Менеджер зв’яжеться з вами протягом дня, щоб узгодити ставку й умови.',
    }
  }
  if (type === 'CHECK_DEMAND') {
    return {
      title: `Дізнатись попит на «${unitLabel}»?`,
      confirmLabel: 'Перевірити попит',
      tone: 'accent' as const,
      description:
        'Ми опублікуємо приміщення за актуальною ринковою ставкою і два тижні збиратимемо статистику: перегляди, дзвінки, покази. Ви отримаєте звіт із висновком, чи ринок підтверджує ціну. Поточний орендар про це не дізнається.',
    }
  }
  return {
    title: `Знайти нового орендаря для «${unitLabel}»?`,
    confirmLabel: 'Шукати орендаря',
    tone: 'danger' as const,
    description:
      'Ми зрозуміємо це так, що поточний орендар звільняє приміщення, і почнемо шукати заміну вже зараз — щоб між орендарями не було простою. Якщо натиснули помилково, зателефонуйте менеджеру.',
  }
}
