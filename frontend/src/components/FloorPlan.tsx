import { useState } from 'react'
import type { Floor, Room } from '../mock'
import { uah } from '../format'

/**
 * Інтерактивне планування поверху.
 *
 * Кожне приміщення — окрема фігура поверх плану: наведення підсвічує,
 * клік відкриває картку з орендарем і ставками. Підпис усередині фігури
 * показуємо тільки там, де він фізично влазить, — інакше план перетворюється
 * на кашу з тексту; решту читає власник у картці збоку.
 *
 * planImage (скан планування) підкладається під фігури, коли з'явиться
 * завантаження. Зараз план векторний, тому фон просто не рендериться.
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

  return (
    <div className="rounded-2xl border border-border bg-surface p-3">
      <svg
        viewBox={floor.viewBox}
        className="h-auto w-full select-none"
        style={{ aspectRatio: aspectFromViewBox(floor.viewBox) }}
      >
        {floor.planImage && (
          <image
            href={floor.planImage}
            x={0}
            y={0}
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid slice"
            opacity={0.35}
          />
        )}

        {floor.corridors.map((c, i) => (
          <g key={i}>
            <rect
              {...c}
              rx={6}
              className="fill-surface-2 stroke-border"
              strokeWidth={2}
            />
            {c.label && (
              <text
                x={c.x + c.w / 2}
                y={c.y + c.h / 2 + 5}
                textAnchor="middle"
                className="fill-muted"
                fontSize={16}
              >
                {c.label}
              </text>
            )}
          </g>
        ))}

        {floor.rooms.map((room) => {
          const vacant = room.tenant === null
          const active = selectedId === room.id || hovered === room.id
          const { x, y, w, h } = room.shape
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
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer outline-none"
            >
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx={6}
                fill={
                  vacant
                    ? 'color-mix(in srgb, var(--color-vacant) 18%, transparent)'
                    : 'color-mix(in srgb, var(--color-occupied) 14%, transparent)'
                }
                stroke={
                  active
                    ? 'var(--color-foreground)'
                    : vacant
                      ? 'var(--color-vacant)'
                      : 'var(--color-occupied)'
                }
                strokeWidth={active ? 4 : 2}
                className="transition-all"
              />

              <text
                x={x + 12}
                y={y + 26}
                className="fill-foreground"
                fontSize={15}
                fontWeight={600}
              >
                {room.label}
              </text>
              <text x={x + 12} y={y + 46} className="fill-muted" fontSize={13}>
                {room.area} м²
              </text>

              {vacant ? (
                <>
                  {showRent && (
                    <text
                      x={x + 12}
                      y={y + h - 34}
                      fontSize={13}
                      className="fill-vacant"
                      fontWeight={700}
                    >
                      ВІЛЬНО
                    </text>
                  )}
                  {showRent && (
                    <text
                      x={x + 12}
                      y={y + h - 14}
                      fontSize={13}
                      className="fill-muted"
                    >
                      ~{uah(room.marketRent)} грн
                    </text>
                  )}
                </>
              ) : (
                <>
                  {showTenant && (
                    <text
                      x={x + 12}
                      y={y + h - 34}
                      fontSize={13}
                      className="fill-foreground"
                    >
                      {truncate(room.tenant!, Math.floor(w / 8))}
                    </text>
                  )}
                  {showRent && (
                    <text
                      x={x + 12}
                      y={y + h - 14}
                      fontSize={14}
                      fontWeight={700}
                      className={
                        room.marketRent > room.rent! ? 'fill-gold' : 'fill-foreground'
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

      <Legend />
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

function aspectFromViewBox(viewBox: string) {
  const [, , w, h] = viewBox.split(' ').map(Number)
  return `${w} / ${h}`
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, Math.max(3, max - 1))}…` : value
}
