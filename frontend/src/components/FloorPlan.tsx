import { useRef, useState } from 'react'
import type { Floor, Room } from '../mock'
import { bbox, labelAnchors, toSvgPoints } from '../geometry'
import { uah } from '../format'

/**
 * Інтерактивне планування поверху.
 *
 * Кожне приміщення — полігон поверх плану: наведення підсвічує, клік відкриває
 * картку з орендарем і ставками. Підпис усередині фігури показуємо тільки там,
 * де він фізично влазить, — інакше план перетворюється на кашу з тексту;
 * решту читає власник у картці збоку.
 *
 * floor.planImage — скан планування під полігонами. Векторні плани його просто
 * не мають, і код від цього не залежить.
 */
export default function FloorPlan({
  floor,
  selectedId,
  onSelect,
}: {
  floor: Floor
  selectedId: string | null
  onSelect: (room: Room) => void
}) {
  const [hovered, setHovered] = useState<string | null>(null)
  // Положення курсора всередині плану — підказка їде за ним
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  // На телефоні наведення немає: тап одразу відкриває картку, підказка лише заважала б
  const canHover =
    typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches

  const hoveredRoom = floor.rooms.find((r) => r.id === hovered) ?? null

  return (
    <div ref={boxRef} className="relative min-w-0 rounded-2xl border border-border bg-surface p-3">
      {/* Довгий склад (63 × 20 м) на телефоні стискається в смужку, де кімната
          завширшки 2.7 м займає 14 px — пальцем не влучити. Тож витягнуті плани
          мають мінімальну ширину й прокручуються вбік усередині картки. */}
      <div className="no-scrollbar -mx-3 overflow-x-auto px-3">
      <svg
        viewBox={floor.viewBox}
        className="h-auto w-full select-none"
        style={{
          aspectRatio: aspectFromViewBox(floor.viewBox),
          minWidth: isElongated(floor.viewBox) ? 760 : undefined,
        }}
      >
        {floor.planImage && (
          <image
            href={floor.planImage}
            x={0}
            y={0}
            width={viewBoxSize(floor.viewBox).w}
            height={viewBoxSize(floor.viewBox).h}
            preserveAspectRatio="none"
            opacity={0.55}
          />
        )}

        {floor.corridors.map((c, i) => {
          const box = bbox(c.polygon)
          return (
            <g key={i}>
              <polygon
                points={toSvgPoints(c.polygon)}
                className="fill-surface-2 stroke-border"
                strokeWidth={2}
              />
              {/* Коридор не клікабельний — здавати його не можна.
                  Але площа в нього є, і вона має бути видна. */}
              {c.label && (
                <text
                  x={box.x + box.w / 2}
                  y={box.y + box.h / 2 + (c.area ? -2 : 5)}
                  textAnchor="middle"
                  className="fill-muted"
                  fontSize={15}
                >
                  {c.label}
                </text>
              )}
              {c.area != null && (
                <text
                  x={box.x + box.w / 2}
                  y={box.y + box.h / 2 + 16}
                  textAnchor="middle"
                  className="fill-muted"
                  fontSize={13}
                >
                  {c.area} м²
                </text>
              )}
            </g>
          )
        })}

        {floor.rooms.map((room) => {
          // Приміщення без орендаря і без оцінки ставки — це «даних ще немає»,
          // а не «вільно за такою-то ціною». Малюємо нейтрально, без обіцянок.
          const unknown = room.tenant === null && room.marketRent === null
          const vacant = room.tenant === null && !unknown
          const active = selectedId === room.id || hovered === room.id
          const { w, h } = bbox(room.polygon)
          // Підписи прив'язані до вершин самого контуру, а не до описаного
          // прямокутника — інакше у Г-подібної кімнати вони вилазять на сусідню
          const { top, bottom } = labelAnchors(room.polygon, { x: 12, top: 26, bottom: 14 })
          // Підписи всередині фігури — лише коли вона достатньо велика
          const showTenant = h >= 150 && w >= 170
          const showRent = h >= 110 && w >= 120

          return (
            <g
              key={room.id}
              role="button"
              tabIndex={0}
              aria-label={room.label}
              onClick={() => onSelect(room)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelect(room)
              }}
              onMouseEnter={() => setHovered(room.id)}
              onMouseMove={(e) => {
                const r = boxRef.current?.getBoundingClientRect()
                if (r) setPointer({ x: e.clientX - r.left, y: e.clientY - r.top })
              }}
              onMouseLeave={() => {
                setHovered(null)
                setPointer(null)
              }}
              className="cursor-pointer outline-none"
            >
              <polygon
                points={toSvgPoints(room.polygon)}
                fill={
                  unknown
                    ? 'color-mix(in srgb, var(--color-muted) 14%, transparent)'
                    : vacant
                      ? 'color-mix(in srgb, var(--color-vacant) 22%, transparent)'
                      : 'color-mix(in srgb, var(--color-occupied) 18%, transparent)'
                }
                stroke={
                  active
                    ? 'var(--color-foreground)'
                    : unknown
                      ? 'var(--color-muted)'
                      : vacant
                        ? 'var(--color-vacant)'
                        : 'var(--color-occupied)'
                }
                strokeWidth={active ? 4 : 2}
                className="transition-all"
              />

              <text
                x={top.x}
                y={top.y + 26}
                className="fill-foreground"
                fontSize={15}
                fontWeight={600}
              >
                {room.label}
              </text>
              <text x={top.x} y={top.y + 46} className="fill-muted" fontSize={13}>
                {room.area} м²
              </text>

              {unknown ? (
                showRent && (
                  <text
                    x={bottom.x}
                    y={bottom.y - 14}
                    fontSize={13}
                    className="fill-muted"
                  >
                    Немає даних
                  </text>
                )
              ) : vacant ? (
                showRent && (
                  <>
                    <text
                      x={bottom.x}
                      y={bottom.y - 34}
                      fontSize={13}
                      className="fill-vacant"
                      fontWeight={700}
                    >
                      ВІЛЬНО
                    </text>
                    <text
                      x={bottom.x}
                      y={bottom.y - 14}
                      fontSize={13}
                      className="fill-muted"
                    >
                      ~{uah(room.marketRent!)} грн
                    </text>
                  </>
                )
              ) : (
                <>
                  {showTenant && (
                    <text
                      x={bottom.x}
                      y={bottom.y - 34}
                      fontSize={13}
                      className="fill-foreground"
                    >
                      {truncate(room.tenant!, Math.floor(bottom.ownWidth / 8))}
                    </text>
                  )}
                  {showRent && (
                    <text
                      x={bottom.x}
                      y={bottom.y - 14}
                      fontSize={14}
                      fontWeight={700}
                      className={
                        room.marketRent !== null && room.marketRent > room.rent!
                          ? 'fill-gold'
                          : 'fill-foreground'
                      }
                    >
                      {uah(room.rent!)} грн
                    </text>
                  )}
                </>
              )}
            </g>
          )
        })}
      </svg>
      </div>

      {canHover && hoveredRoom && pointer && (
        <HoverCard
          room={hoveredRoom}
          pointer={pointer}
          container={boxRef.current}
        />
      )}

      <Legend />
    </div>
  )
}

/**
 * Підказка при наведенні: хто орендує, скільки займає і скільки платить.
 * Цього власнику досить, щоб окинути поверх поглядом; договори й контакти —
 * у картці, що відкривається кліком.
 */
function HoverCard({
  room,
  pointer,
  container,
}: {
  room: Room
  pointer: { x: number; y: number }
  container: HTMLDivElement | null
}) {
  const width = 240
  const boxW = container?.clientWidth ?? 0
  const boxH = container?.clientHeight ?? 0
  // Не вилазимо за край плану: біля правого краю — ліворуч від курсора, біля низу — над ним
  const left = Math.max(8, Math.min(pointer.x + 16, boxW - width - 8))
  const top = pointer.y + 150 > boxH ? Math.max(8, pointer.y - 140) : pointer.y + 16

  const unknown = room.tenant === null && room.marketRent === null
  const title = /^\d+$/.test(room.label) ? `Приміщення ${room.label}` : room.label

  return (
    <div
      style={{ left, top, width }}
      className="pointer-events-none absolute z-10 rounded-xl border border-border bg-background/95 p-3 shadow-2xl backdrop-blur"
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate font-semibold">{title}</span>
        <span className="shrink-0 text-xs text-muted">{room.area} м²</span>
      </div>

      {room.tenant ? (
        <>
          <div className="mt-1.5 truncate text-sm">{room.tenant}</div>
          {room.rent !== null && (
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <span className="text-lg font-bold">{uah(room.rent)} грн/міс</span>
              <span className="text-[11px] text-muted">
                {uah(Math.round(room.rent / room.area))} грн/м²
              </span>
            </div>
          )}
        </>
      ) : unknown ? (
        <div className="mt-1.5 text-sm text-muted">Орендаря ще не внесено</div>
      ) : (
        <div className="mt-1.5 text-sm font-semibold text-vacant">
          Вільно · ~{uah(room.marketRent!)} грн/міс
        </div>
      )}

      <div className="mt-2 text-[10px] text-muted">Натисніть — деталі й договір</div>
    </div>
  )
}

function Legend() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-border pt-3 text-xs text-muted">
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm bg-occupied" /> Здано
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm bg-vacant" /> Вільно
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm bg-gold" /> Ставка нижча за ринок
      </span>
    </div>
  )
}

function viewBoxSize(viewBox: string) {
  const [, , w, h] = viewBox.split(' ').map(Number)
  return { w, h }
}

/** План утричі довший, ніж глибокий — типовий склад */
function isElongated(viewBox: string) {
  const { w, h } = viewBoxSize(viewBox)
  return w / h > 2.2
}

function aspectFromViewBox(viewBox: string) {
  const { w, h } = viewBoxSize(viewBox)
  return `${w} / ${h}`
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, Math.max(3, max - 1))}…` : value
}
