import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  Download,
  FileJson,
  Ruler,
  Save,
  Squircle,
  Trash2,
  Undo2,
  X,
} from 'lucide-react'
import { bbox, polygonArea, toSvgPoints } from '../geometry'
import type { Point, Polygon } from '../geometry'
import { newId, savePlan } from '../storage'
import type { Plan, PlanRoom, PlanVariant, VariantSource } from '../storage'

/**
 * Обведення планування.
 *
 * Працює з одним планом і його варіантами: обведений вручну, розпізнаний ІІ,
 * побудований за розмірами. Варіанти не замінюють один одного — їх можна
 * порівняти й обрати, який лишити основним.
 *
 * Масштаб задається по відомій довжині, і далі площа рахується з самого контуру.
 * На поверсі буває два десятки приміщень, вбивати метраж кожного руками — марна робота.
 */

type Mode = 'draw' | 'calibrate'

export default function PlanEditor({
  plan,
  onClose,
  onSaved,
}: {
  plan: Plan
  onClose: () => void
  onSaved: (plan: Plan) => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)

  const scanUrl = useMemo(() => URL.createObjectURL(plan.scan), [plan.scan])
  useEffect(() => () => URL.revokeObjectURL(scanUrl), [scanUrl])

  const active = plan.variants.find((v) => v.id === plan.activeVariantId)

  const [rooms, setRooms] = useState<Array<PlanRoom>>(active?.rooms ?? [])
  const [metersPerUnit, setMetersPerUnit] = useState<number | null>(
    active?.metersPerUnit ?? null,
  )
  const [draft, setDraft] = useState<Polygon>([])
  const [mode, setMode] = useState<Mode>('draw')
  const [calibration, setCalibration] = useState<Array<Point>>([])
  const [saved, setSaved] = useState(false)

  const { w, h } = plan.size
  const viewBox = `0 0 ${w} ${h}`
  const totalArea = rooms.reduce((sum, r) => sum + r.area, 0)

  const toSvgPoint = (e: React.MouseEvent): Point => {
    const svg = svgRef.current!
    const ctm = svg.getScreenCTM()!
    const p = svg.createSVGPoint()
    p.x = e.clientX
    p.y = e.clientY
    const { x, y } = p.matrixTransform(ctm.inverse())
    return [Math.round(x), Math.round(y)]
  }

  const handleClick = (e: React.MouseEvent) => {
    const point = toSvgPoint(e)

    if (mode === 'calibrate') {
      const next = [...calibration, point]
      if (next.length < 2) {
        setCalibration(next)
        return
      }
      const [a, b] = next
      const pixels = Math.hypot(b[0] - a[0], b[1] - a[1])
      const answer = window.prompt(
        'Скільки метрів між цими двома точками?\nНаприклад: 42',
      )
      const meters = Number(answer?.replace(',', '.'))
      if (meters > 0 && pixels > 0) setMetersPerUnit(meters / pixels)
      setCalibration([])
      setMode('draw')
      return
    }

    setDraft((prev) => [...prev, point])
  }

  const closePolygon = () => {
    if (draft.length < 3) return
    const label = window.prompt('Номер або назва приміщення:', 'Каб. ')
    if (label === null) return

    const computed = metersPerUnit
      ? polygonArea(draft) * metersPerUnit ** 2
      : 0
    const answer = window.prompt(
      metersPerUnit
        ? `Площа за контуром: ${computed.toFixed(1)} м². Змінити або лишити?`
        : 'Площа, м² (масштаб не заданий — введіть вручну):',
      computed ? computed.toFixed(1) : '',
    )
    const area = Number(answer?.replace(',', '.')) || Math.round(computed)

    setRooms((prev) => [
      ...prev,
      { id: newId('room'), label: label.trim(), polygon: draft, area },
    ])
    setDraft([])
  }

  // Обведення поверху — це десятки кліків підряд, тому клавіші важливіші за мишу:
  // рука не мусить щоразу їхати до кнопки збоку.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') closePolygon()
      if (e.key === 'Escape') {
        if (draft.length > 0) setDraft((p) => p.slice(0, -1))
        else onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const saveVariant = async (source: VariantSource) => {
    if (rooms.length === 0) return
    const label = window.prompt(
      'Назва варіанта:',
      source === 'manual' ? 'Обведено вручну' : 'Розпізнано',
    )
    if (label === null) return

    const variant: PlanVariant = {
      id: newId('variant'),
      label: label.trim() || 'Без назви',
      source,
      rooms,
      metersPerUnit,
      createdAt: Date.now(),
    }
    const next: Plan = {
      ...plan,
      variants: [...plan.variants, variant],
      activeVariantId: variant.id,
    }
    await savePlan(next)
    onSaved(next)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const loadVariant = (variant: PlanVariant) => {
    setRooms(variant.rooms)
    setMetersPerUnit(variant.metersPerUnit)
    setDraft([])
  }

  /**
   * Завантаження готової розмітки. Основний сценарій — план, розпізнаний із
   * рукописного скану: контури приходять сюди, а людина виправляє те, що
   * прочиталося неправильно, замість того щоб обводити все з нуля.
   */
  const importJson = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result))
        const incoming: Array<PlanRoom> = (data.rooms ?? []).map(
          (r: { label?: string; area?: number; polygon: Polygon }, i: number) => ({
            id: newId('room'),
            label: r.label ?? `Приміщення ${i + 1}`,
            area: Number(r.area) || 0,
            polygon: r.polygon,
          }),
        )
        if (incoming.length === 0) {
          window.alert('У файлі немає жодного контуру')
          return
        }
        if (data.metersPerUnit) setMetersPerUnit(Number(data.metersPerUnit))
        setRooms(incoming)
        setDraft([])
      } catch {
        window.alert('Не вдалося прочитати файл — очікується JSON з полем rooms')
      }
    }
    reader.readAsText(file)
  }

  const exportJson = () => {
    const payload = {
      viewBox,
      metersPerUnit,
      rooms: rooms.map((r) => ({
        label: r.label,
        area: r.area,
        polygon: r.polygon,
      })),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${plan.buildingLabel}-${plan.floorLabel}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <div className="mx-auto max-w-[1400px] p-4 lg:p-6">
        <header className="mb-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold">
              {plan.buildingLabel} · {plan.floorLabel}
            </h1>
            <p className="text-sm text-muted">
              Задайте масштаб і обведіть приміщення
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-xl border border-border p-2 text-muted transition-colors hover:text-foreground"
          >
            <X size={20} />
          </button>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="rounded-2xl border border-border bg-surface p-3">
            <svg
              ref={svgRef}
              viewBox={viewBox}
              onClick={handleClick}
              className="h-auto w-full cursor-crosshair select-none"
              style={{ aspectRatio: `${w} / ${h}` }}
            >
              <image href={scanUrl} x={0} y={0} width={w} height={h} />

              {rooms.map((r) => {
                const box = bbox(r.polygon)
                return (
                  <g key={r.id}>
                    <polygon
                      points={toSvgPoints(r.polygon)}
                      fill="color-mix(in srgb, var(--color-accent) 25%, transparent)"
                      stroke="var(--color-accent)"
                      strokeWidth={2}
                    />
                    <text
                      x={box.x + 10}
                      y={box.y + 24}
                      fontSize={16}
                      fontWeight={600}
                      className="fill-foreground"
                    >
                      {r.label}
                    </text>
                    <text
                      x={box.x + 10}
                      y={box.y + 44}
                      fontSize={14}
                      className="fill-muted"
                    >
                      {r.area} м²
                    </text>
                  </g>
                )
              })}

              {draft.length > 0 && (
                <>
                  <polyline
                    points={toSvgPoints(draft)}
                    fill="color-mix(in srgb, var(--color-gold) 20%, transparent)"
                    stroke="var(--color-gold)"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                  />
                  {draft.map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r={5} className="fill-gold" />
                  ))}
                </>
              )}

              {calibration.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={6} className="fill-vacant" />
              ))}
            </svg>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-border bg-surface p-4 text-sm">
              <div className="mb-3 font-semibold">Як обводити</div>
              <ol className="list-inside list-decimal space-y-1.5 text-muted">
                <li>Масштаб по відомій довжині</li>
                <li>Клікайте по кутах приміщення</li>
                <li>
                  <kbd className="rounded bg-surface-2 px-1">Enter</kbd> —
                  замкнути, <kbd className="rounded bg-surface-2 px-1">Esc</kbd>{' '}
                  — прибрати точку
                </li>
              </ol>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    setMode('calibrate')
                    setCalibration([])
                    setDraft([])
                  }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold transition-colors ${
                    mode === 'calibrate'
                      ? 'border-vacant bg-vacant/15 text-vacant'
                      : 'border-border text-muted'
                  }`}
                >
                  <Ruler size={14} />
                  Масштаб
                </button>
                <button
                  onClick={() => setDraft((p) => p.slice(0, -1))}
                  disabled={draft.length === 0}
                  className="rounded-xl border border-border px-3 py-2.5 text-muted disabled:opacity-40"
                >
                  <Undo2 size={14} />
                </button>
                <button
                  onClick={closePolygon}
                  disabled={draft.length < 3}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-xs font-bold text-white disabled:opacity-40"
                >
                  <Squircle size={14} />
                  Замкнути
                </button>
              </div>

              <div className="mt-3 text-xs text-muted">
                {mode === 'calibrate'
                  ? 'Клікніть дві точки з відомою відстанню'
                  : metersPerUnit
                    ? 'Масштаб задано — площа рахується автоматично'
                    : 'Масштаб не задано — площу вводимо руками'}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface">
              <div className="flex items-center justify-between border-b border-border p-4">
                <span className="text-sm font-semibold">
                  Приміщення · {rooms.length}
                </span>
                <span className="text-xs text-muted">
                  {totalArea.toFixed(0)} м²
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto">
                {rooms.length === 0 ? (
                  <div className="p-4 text-sm text-muted">
                    Поки жодного контуру
                  </div>
                ) : (
                  rooms.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-2 border-b border-border/50 px-4 py-2.5 text-sm last:border-0"
                    >
                      <span className="truncate">{r.label}</span>
                      <span className="shrink-0 text-xs text-muted">
                        {r.area} м²
                      </span>
                      <button
                        onClick={() =>
                          setRooms((prev) => prev.filter((x) => x.id !== r.id))
                        }
                        className="shrink-0 text-muted transition-colors hover:text-vacant"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2 border-t border-border p-3">
                <button
                  onClick={() => saveVariant('manual')}
                  disabled={rooms.length === 0}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-bold text-white disabled:opacity-40"
                >
                  {saved ? (
                    <>
                      <Check size={15} /> Збережено
                    </>
                  ) : (
                    <>
                      <Save size={15} /> Зберегти варіант
                    </>
                  )}
                </button>

                <div className="flex gap-2">
                  <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-xs font-semibold text-muted transition-colors hover:text-foreground">
                    <FileJson size={14} />
                    Імпорт
                    <input
                      type="file"
                      accept="application/json,.json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) importJson(file)
                        e.target.value = ''
                      }}
                    />
                  </label>
                  <button
                    onClick={exportJson}
                    disabled={rooms.length === 0}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-xs font-semibold text-muted disabled:opacity-40"
                  >
                    <Download size={14} />
                    Експорт
                  </button>
                </div>
              </div>
            </div>

            {plan.variants.length > 0 && (
              <div className="rounded-2xl border border-border bg-surface">
                <div className="border-b border-border p-4 text-sm font-semibold">
                  Варіанти · {plan.variants.length}
                </div>
                {plan.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => loadVariant(v)}
                    className="flex w-full items-center justify-between gap-2 border-b border-border/50 px-4 py-2.5 text-left text-sm last:border-0 hover:bg-surface-2"
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{v.label}</span>
                      <span className="text-xs text-muted">
                        {SOURCE_LABEL[v.source]} · {v.rooms.length} прим.
                      </span>
                    </span>
                    {v.id === plan.activeVariantId && (
                      <Check size={15} className="shrink-0 text-occupied" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const SOURCE_LABEL: Record<VariantSource, string> = {
  manual: 'Обведено вручну',
  auto: 'Розпізнано ІІ',
  generated: 'Побудовано за розмірами',
}
