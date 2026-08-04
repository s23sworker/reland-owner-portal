import { useEffect, useState } from 'react'
import { Check, Layers, Trash2, Upload, X } from 'lucide-react'
import { plural } from '../format'
import { deletePlan, listPlans, newId, savePlan } from '../storage'
import type { Plan } from '../storage'
import PlanEditor from './PlanEditor'

/**
 * Бібліотека планувань.
 *
 * Це не просто сховище файлів. Кожен виправлений людиною план разом зі своїм
 * сканом — приклад, який потім підкладається моделі при розпізнаванні наступних
 * планів («ось так виглядав рукописний оригінал, ось що з нього вийшло правильно»).
 * Тому скан зберігається назавжди поруч із результатом, а не викидається після обведення.
 */
export default function PlanLibrary({ onClose }: { onClose: () => void }) {
  const [plans, setPlans] = useState<Array<Plan>>([])
  const [editing, setEditing] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Без catch екран назавжди залишався б на «Завантаження…»: помилка сховища
  // просто не доходила б до інтерфейсу.
  const reload = async () => {
    try {
      setPlans(await listPlans())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Сховище недоступне')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  const addScan = (file: File) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = async () => {
      // Тримаємо систему координат близько до 1000 по ширині: з такими числами
      // зручно працювати руками, якщо доведеться правити JSON
      const scale = 1000 / img.naturalWidth
      const building =
        window.prompt('Будівля:', 'Поділ') ?? 'Без назви'
      const floor = window.prompt('Поверх:', '1 поверх') ?? '1 поверх'

      const plan: Plan = {
        id: newId('plan'),
        buildingLabel: building.trim(),
        floorLabel: floor.trim(),
        scan: file,
        size: { w: 1000, h: Math.round(img.naturalHeight * scale) },
        variants: [],
        activeVariantId: null,
        createdAt: Date.now(),
      }
      await savePlan(plan)
      URL.revokeObjectURL(url)
      await reload()
      setEditing(plan)
    }
    img.src = url
  }

  if (editing) {
    return (
      <PlanEditor
        plan={editing}
        onClose={() => {
          setEditing(null)
          reload()
        }}
        onSaved={(next) => setEditing(next)}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <div className="mx-auto max-w-[1100px] p-4 lg:p-6">
        <header className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold">
              <Layers size={20} className="text-accent" />
              Планування
            </h1>
            <p className="text-sm text-muted">
              Скани поверхів, обведені схеми та варіанти розпізнавання
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-xl border border-border p-2 text-muted transition-colors hover:text-foreground"
          >
            <X size={20} />
          </button>
        </header>

        <label className="mb-4 flex cursor-pointer items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-8 text-muted transition-colors hover:text-foreground">
          <Upload size={20} />
          <span className="text-sm font-semibold">Завантажити скан поверху</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) addScan(file)
              e.target.value = ''
            }}
          />
        </label>

        {loading ? (
          <div className="p-8 text-center text-sm text-muted">Завантаження…</div>
        ) : error ? (
          <div className="rounded-2xl border border-vacant/40 bg-vacant/10 p-6 text-center text-sm text-vacant">
            Не вдалося прочитати сховище планувань: {error}
            <button
              onClick={() => {
                setLoading(true)
                reload()
              }}
              className="mt-3 block w-full rounded-xl border border-vacant/40 py-2 font-semibold"
            >
              Спробувати ще раз
            </button>
          </div>
        ) : plans.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-muted">
            Поки жодного плану. Завантажте перший скан.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onOpen={() => setEditing(plan)}
                onDelete={async () => {
                  if (
                    !window.confirm(
                      `Видалити «${plan.buildingLabel} · ${plan.floorLabel}» разом зі сканом і всіма варіантами?`,
                    )
                  )
                    return
                  await deletePlan(plan.id)
                  reload()
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PlanCard({
  plan,
  onOpen,
  onDelete,
}: {
  plan: Plan
  onOpen: () => void
  onDelete: () => void
}) {
  const [thumb, setThumb] = useState<string | null>(null)

  useEffect(() => {
    const url = URL.createObjectURL(plan.scan)
    setThumb(url)
    return () => URL.revokeObjectURL(url)
  }, [plan.scan])

  const active = plan.variants.find((v) => v.id === plan.activeVariantId)

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <button onClick={onOpen} className="block w-full">
        {thumb && (
          <img
            src={thumb}
            alt=""
            className="h-36 w-full bg-surface-2 object-cover"
          />
        )}
      </button>

      <div className="flex items-start justify-between gap-2 p-4">
        <button onClick={onOpen} className="min-w-0 text-left">
          <div className="truncate font-semibold">{plan.buildingLabel}</div>
          <div className="text-sm text-muted">{plan.floorLabel}</div>
          <div className="mt-1.5 text-xs">
            {active ? (
              <span className="flex items-center gap-1 text-occupied">
                <Check size={12} />
                {active.rooms.length}{' '}
                {plural(
                  active.rooms.length,
                  'приміщення',
                  'приміщення',
                  'приміщень',
                )}
              </span>
            ) : (
              <span className="text-vacant">Не обведено</span>
            )}
          </div>
        </button>

        <button
          onClick={onDelete}
          className="shrink-0 text-muted transition-colors hover:text-vacant"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}
