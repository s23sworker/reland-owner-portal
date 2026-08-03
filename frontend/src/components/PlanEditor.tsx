import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  Copy,
  FileJson,
  Ruler,
  Squircle,
  Trash2,
  Undo2,
  Upload,
  X,
} from 'lucide-react'
import { bbox, polygonArea, toSvgPoints } from '../geometry'
import type { Point, Polygon } from '../geometry'

/**
 * Розмітка планування по сканованому плану.
 *
 * Скан сам по собі не дає клікабельних приміщень — контури треба один раз обвести.
 * Це робиться тут: завантажив скан поверху → задав масштаб по відомій довжині →
 * обвів кожне приміщення → отримав JSON, готовий до підстановки в кабінет.
 *
 * Масштаб потрібен не для краси: за ним площа рахується з самого контуру,
 * і не доводиться вбивати метраж руками для кожної кімнати (а на поверсі
 * їх буває два десятки).
 *
 * Робота зберігається в localStorage — обведення поверху займає хвилин десять,
 * і втратити його через випадкове перезавантаження було б прикро.
 */

type DraftRoom = { id: string; label: string; polygon: Polygon; area: number }
type Mode = 'draw' | 'calibrate'

const STORAGE_KEY = 'reland-plan-editor'

type Saved = {
  image?: string | null
  size?: { w: number; h: number }
  rooms?: Array<DraftRoom>
  metersPerUnit?: number | null
}

function loadSaved(): Saved | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Saved) : null
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export default function PlanEditor({ onClose }: { onClose: () => void }) {
  const svgRef = useRef<SVGSVGElement>(null)
  // Читаємо збережене одразу при ініціалізації стану, а не ефектом: інакше перший
  // прогін ефекту-збереження встигає записати порожній початковий стан поверх
  // збереженої розмітки.
  const [saved] = useState(loadSaved)
  const [image, setImage] = useState<string | null>(saved?.image ?? null)
  const [size, setSize] = useState(saved?.size ?? { w: 1000, h: 700 })
  const [rooms, setRooms] = useState<Array<DraftRoom>>(saved?.rooms ?? [])
  const [draft, setDraft] = useState<Polygon>([])
  const [mode, setMode] = useState<Mode>('draw')
  const [calibration, setCalibration] = useState<Array<Point>>([])
  /** Скільки метрів в одиниці системи координат плану */
  const [metersPerUnit, setMetersPerUnit] = useState<number | null>(
    saved?.metersPerUnit ?? null,
  )
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ image, size, rooms, metersPerUnit }),
    )
  }, [image, size, rooms, metersPerUnit])

  const viewBox = `0 0 ${size.w} ${size.h}`

  const totalArea = useMemo(
    () => rooms.reduce((sum, r) => sum + r.area, 0),
    [rooms],
  )

  const upload = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result)
      const img = new Image()
      img.onload = () => {
        // Тримаємо систему координат близько до 1000 по ширині — з такими числами
        // зручно працювати руками, якщо доведеться правити JSON
        const scale = 1000 / img.naturalWidth
        setSize({ w: 1000, h: Math.round(img.naturalHeight * scale) })
        setImage(dataUrl)
        setRooms([])
        setDraft([])
        setMetersPerUnit(null)
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  }

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

    const units = polygonArea(draft)
    const computed = metersPerUnit ? units * metersPerUnit ** 2 : 0
    const answer = window.prompt(
      metersPerUnit
        ? `Площа за контуром: ${computed.toFixed(1)} м². Змінити або лишити?`
        : 'Площа, м² (масштаб не заданий — введіть вручну):',
      computed ? computed.toFixed(1) : '',
    )
    const area = Number(answer?.replace(',', '.')) || Math.round(computed)

    setRooms((prev) => [
      ...prev,
      { id: `room-${prev.length + 1}`, label: label.trim(), polygon: draft, area },
    ])
    setDraft([])
  }

  // Обведення поверху — це десятки кліків підряд, тому клавіші важливіші
  // за мишу: рука не мусить щоразу їхати до кнопки збоку.
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
        const incoming: Array<DraftRoom> = (data.rooms ?? []).map(
          (r: { label?: string; area?: number; polygon: Polygon }, i: number) => ({
            id: `imported-${i + 1}`,
            label: r.label ?? `Приміщення ${i + 1}`,
            area: Number(r.area) || 0,
            polygon: r.polygon,
          }),
        )
        if (incoming.length === 0) {
          window.alert('У файлі немає жодного контуру')
          return
        }
        if (data.viewBox) {
          const [, , w, h] = String(data.viewBox).split(' ').map(Number)
          if (w && h) setSize({ w, h })
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

  const exportJson = async () => {
    const payload = {
      viewBox,
      planImage: image ? '<< скан: підставити URL після завантаження >>' : undefined,
      metersPerUnit,
      rooms: rooms.map((r) => ({
        label: r.label,
        area: r.area,
        polygon: r.polygon,
      })),
    }
    const json = JSON.stringify(payload, null, 2)

    // Головний шлях — файл: його видно, його можна переслати. Clipboard API
    // мовчки відмовляє, коли документ не у фокусі, тож на нього не покладаємось.
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'floor-plan.json'
    a.click()
    URL.revokeObjectURL(url)

    try {
      await navigator.clipboard.writeText(json)
    } catch {
      // без буфера обміну теж нормально — файл уже завантажено
    }

    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <div className="mx-auto max-w-[1400px] p-4 lg:p-6">
        <header className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Розмітка планування</h1>
            <p className="text-sm text-muted">
              Завантажте скан поверху, задайте масштаб і обведіть приміщення
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-border p-2 text-muted transition-colors hover:text-foreground"
          >
            <X size={20} />
          </button>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="rounded-2xl border border-border bg-surface p-3">
            {image ? (
              <svg
                ref={svgRef}
                viewBox={viewBox}
                onClick={handleClick}
                className="h-auto w-full cursor-crosshair select-none"
                style={{ aspectRatio: `${size.w} / ${size.h}` }}
              >
                <image href={image} x={0} y={0} width={size.w} height={size.h} />

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

                {/* Контур, який зараз обводимо */}
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
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r={5}
                        className="fill-gold"
                      />
                    ))}
                  </>
                )}

                {calibration.map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r={6} className="fill-vacant" />
                ))}
              </svg>
            ) : (
              <label className="flex aspect-[3/2] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border text-muted">
                <Upload size={28} />
                <span className="text-sm">Завантажити скан поверху</span>
                <span className="text-xs">PNG або JPG, ширина від 2000 px</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) upload(file)
                  }}
                />
              </label>
            )}
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-border bg-surface p-4 text-sm">
              <div className="mb-3 font-semibold">Як обводити</div>
              <ol className="list-inside list-decimal space-y-1.5 text-muted">
                <li>Задайте масштаб по відомій довжині</li>
                <li>Клікайте по кутах приміщення</li>
                <li>
                  <kbd className="rounded bg-surface-2 px-1">Enter</kbd> —
                  замкнути контур,{' '}
                  <kbd className="rounded bg-surface-2 px-1">Esc</kbd> — прибрати
                  точку
                </li>
              </ol>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    setMode('calibrate')
                    setCalibration([])
                    setDraft([])
                  }}
                  disabled={!image}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold transition-colors disabled:opacity-40 ${
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
                  className="flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-xs font-semibold text-muted disabled:opacity-40"
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
                    ? `Масштаб задано: площа рахується автоматично`
                    : 'Масштаб не задано — площу доведеться вводити руками'}
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

              <div className="max-h-72 overflow-y-auto">
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
                <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-semibold text-muted transition-colors hover:text-foreground">
                  <FileJson size={15} />
                  Завантажити розмітку
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
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-semibold disabled:opacity-40"
                >
                  {copied ? (
                    <>
                      <Check size={15} className="text-occupied" /> Збережено
                    </>
                  ) : (
                    <>
                      <Copy size={15} /> Зберегти JSON
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
