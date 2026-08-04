import { useMemo, useState } from 'react'
import { Layers, MapPin, Menu, TrendingDown, Wallet, X } from 'lucide-react'
import { OWNER } from './mock'
import type { Room } from './mock'
import { uah } from './format'
import { haptic } from './telegram'
import Sidebar from './components/Sidebar'
import FloorPlan from './components/FloorPlan'
import RoomDetails from './components/RoomDetails'
import type { RequestType } from './components/RoomDetails'
import ConfirmSheet from './components/ConfirmSheet'
import PlanLibrary from './components/PlanLibrary'

type Pending = { roomId: string; roomLabel: string; type: RequestType }

export default function App() {
  const [siteId, setSiteId] = useState(OWNER.sites[0].id)
  const [buildingId, setBuildingId] = useState(OWNER.sites[0].buildings[0].id)
  const [floorId, setFloorId] = useState(
    OWNER.sites[0].buildings[0].floors[0].id,
  )
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [pending, setPending] = useState<Pending | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  // Режим адміна: розмітка планування. Власник його не бачить — це наш інструмент.
  const [editorOpen, setEditorOpen] = useState(
    () => new URLSearchParams(window.location.search).has('admin'),
  )
  // Ключі виду "roomId:REQUEST_TYPE". Поки що тільки в пам'яті — бекенда немає.
  const [sent, setSent] = useState<Array<string>>([])

  const site = OWNER.sites.find((s) => s.id === siteId)!
  const building = site.buildings.find((b) => b.id === buildingId)!
  const floor = building.floors.find((f) => f.id === floorId) ?? building.floors[0]
  const selectedRoom = floor.rooms.find((r) => r.id === selectedRoomId) ?? null

  const totals = useMemo(() => {
    const rooms = OWNER.sites
      .flatMap((s) => s.buildings)
      .flatMap((b) => b.floors)
      .flatMap((f) => f.rooms)
    const income = rooms.reduce((sum, r) => sum + (r.rent ?? 0), 0)
    const lost = rooms
      .filter((r) => r.tenant === null)
      .reduce((sum, r) => sum + r.marketRent, 0)
    const area = rooms.reduce((sum, r) => sum + r.area, 0)
    const busy = rooms
      .filter((r) => r.tenant !== null)
      .reduce((sum, r) => sum + r.area, 0)
    return { income, lost, occupancy: Math.round((busy / area) * 100) }
  }, [])

  const selectBuilding = (nextSiteId: string, nextBuildingId: string) => {
    const nextSite = OWNER.sites.find((s) => s.id === nextSiteId)!
    const nextBuilding =
      nextSite.buildings.find((b) => b.id === nextBuildingId) ??
      nextSite.buildings[0]
    setSiteId(nextSiteId)
    setBuildingId(nextBuilding.id)
    setFloorId(nextBuilding.floors[0].id)
    setSelectedRoomId(null)
    setExpanded(false)
    setMenuOpen(false)
    haptic()
  }

  const selectRoom = (room: Room) => {
    setSelectedRoomId(room.id)
    setExpanded(false)
    haptic()
  }

  const confirm = () => {
    if (!pending) return
    setSent((prev) => [...prev, `${pending.roomId}:${pending.type}`])
    setPending(null)
    haptic('success')
  }

  const sentFor = (roomId: string) =>
    (['RENT_OUT', 'CHECK_DEMAND', 'FIND_TENANT'] as const).filter((t) =>
      sent.includes(`${roomId}:${t}`),
    ) as Array<RequestType>

  return (
    <div className="flex h-full">
      {/* Сайдбар: постійний на широкому екрані, шухляда — на телефоні */}
      <div className="hidden w-64 shrink-0 lg:block">
        <Sidebar
          activeSiteId={siteId}
          activeBuildingId={buildingId}
          onSelect={selectBuilding}
        />
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <button
            aria-label="Закрити меню"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/70"
          />
          <div className="relative w-72 max-w-[80%]">
            <Sidebar
              activeSiteId={siteId}
              activeBuildingId={buildingId}
              onSelect={selectBuilding}
            />
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute right-3 top-4 text-muted"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1200px] px-4 pb-16 lg:px-8">
          <header className="flex items-center gap-3 py-5">
            <button
              onClick={() => setMenuOpen(true)}
              className="rounded-xl border border-border p-2 text-muted lg:hidden"
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xl font-semibold">
                {building.label}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                <MapPin size={13} className="shrink-0 text-accent" />
                <span className="truncate">{site.address}</span>
              </div>
            </div>

            <button
              onClick={() => setEditorOpen(true)}
              title="Планування"
              className="flex shrink-0 items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-muted transition-colors hover:text-foreground"
            >
              <Layers size={16} />
              <span className="hidden sm:inline">Планування</span>
            </button>
          </header>

          <div className="grid grid-cols-2 gap-3 lg:max-w-lg">
            <Metric
              icon={<Wallet size={12} />}
              label="Дохід"
              value={uah(totals.income)}
              hint={`грн/міс · заповнено ${totals.occupancy}%`}
            />
            <Metric
              danger
              icon={<TrendingDown size={12} />}
              label="Упущено"
              value={uah(totals.lost)}
              hint="грн/міс на порожніх"
            />
          </div>

          {/* Поверхи */}
          <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
            {building.floors.map((f) => {
              const free = f.rooms.filter((r) => r.tenant === null).length
              const active = f.id === floor.id
              return (
                <button
                  key={f.id}
                  onClick={() => {
                    setFloorId(f.id)
                    setSelectedRoomId(null)
                    haptic()
                  }}
                  className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                    active
                      ? 'border-accent bg-accent/15 text-foreground'
                      : 'border-border bg-surface text-muted'
                  }`}
                >
                  {f.label}
                  {free > 0 && (
                    <span className="rounded-md bg-vacant/20 px-1.5 py-0.5 text-[10px] font-bold text-vacant">
                      {free} вільно
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
            <FloorPlan
              floor={floor}
              selectedId={selectedRoomId}
              onSelect={selectRoom}
            />

            {/* Праворуч на десктопі, нижньою шторкою — на телефоні */}
            <div className="hidden lg:block">
              {selectedRoom ? (
                <div className="sticky top-4">
                  <RoomDetails
                    room={selectedRoom}
                    sent={sentFor(selectedRoom.id)}
                    expanded={expanded}
                    onToggleExpanded={() => setExpanded((v) => !v)}
                    onRequest={(type) =>
                      setPending({
                        roomId: selectedRoom.id,
                        roomLabel: selectedRoom.label,
                        type,
                      })
                    }
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
                  Натисніть приміщення на плані, щоб побачити орендаря, ставку
                  й умови договору
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Телефон: картка приміщення знизу */}
      {selectedRoom && (
        <div className="fixed inset-x-0 bottom-0 z-30 max-h-[80%] overflow-y-auto p-3 lg:hidden">
          <RoomDetails
            room={selectedRoom}
            sent={sentFor(selectedRoom.id)}
            expanded={expanded}
            onToggleExpanded={() => setExpanded((v) => !v)}
            onRequest={(type) =>
              setPending({
                roomId: selectedRoom.id,
                roomLabel: selectedRoom.label,
                type,
              })
            }
            onClose={() => setSelectedRoomId(null)}
          />
        </div>
      )}

      {editorOpen && <PlanLibrary onClose={() => setEditorOpen(false)} />}

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

function Metric({
  icon,
  label,
  value,
  hint,
  danger,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint: string
  danger?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        danger ? 'border-vacant/30 bg-vacant/10' : 'border-border bg-surface'
      }`}
    >
      <div
        className={`flex items-center gap-1.5 text-[11px] uppercase tracking-wider ${
          danger ? 'text-vacant/80' : 'text-muted'
        }`}
      >
        {icon} {label}
      </div>
      <div className={`mt-1.5 text-xl font-bold ${danger ? 'text-vacant' : ''}`}>
        {value}
      </div>
      <div className={`text-[11px] ${danger ? 'text-vacant/70' : 'text-muted'}`}>
        {hint}
      </div>
    </div>
  )
}

function sheetCopy({ roomLabel, type }: Pending) {
  if (type === 'RENT_OUT') {
    return {
      title: `Здати «${roomLabel}»?`,
      confirmLabel: 'Так, здаємо',
      tone: 'accent' as const,
      description:
        'Ми одразу опублікуємо приміщення на всіх рекламних майданчиках і почнемо шукати орендаря. Менеджер зв’яжеться з вами протягом дня, щоб узгодити ставку й умови.',
    }
  }
  if (type === 'CHECK_DEMAND') {
    return {
      title: `Дізнатись попит на «${roomLabel}»?`,
      confirmLabel: 'Перевірити попит',
      tone: 'accent' as const,
      description:
        'Ми опублікуємо приміщення за актуальною ринковою ставкою і два тижні збиратимемо статистику: перегляди, дзвінки, покази. Ви отримаєте звіт із висновком, чи ринок підтверджує ціну. Поточний орендар про це не дізнається.',
    }
  }
  return {
    title: `Знайти нового орендаря для «${roomLabel}»?`,
    confirmLabel: 'Шукати орендаря',
    tone: 'danger' as const,
    description:
      'Ми зрозуміємо це так, що поточний орендар звільняє приміщення, і почнемо шукати заміну вже зараз — щоб між орендарями не було простою. Якщо натиснули помилково, зателефонуйте менеджеру.',
  }
}
