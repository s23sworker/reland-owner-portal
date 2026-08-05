/**
 * Побудова чистих планувань із таблиці приміщень.
 *
 * Вхід — те, що прочитано зі сканів БТІ (Межигірська, 24, літ. «Б»): номер,
 * площа, ряд. Вихід — JSON у форматі редактора розмітки.
 *
 * Головне правило: ІСТИНА — ЦЕ ПЛОЩА. Вона надрукована великим шрифтом і читається
 * однозначно. Розміри стін на цих планах частково рукописні й місцями суперечать
 * площі (у кімнати 1 першого поверху підпис 2.15 не сходиться з 11.5 за жодної
 * глибини). Тому глибину ряду беремо з розбірливого розміру, а ширину кожного
 * приміщення рахуємо як площа/глибина. Так площі в схемі точні до десятої,
 * а пропорції близькі до справжніх.
 *
 * Це схема, а не обмір: вона не замінює технічний паспорт.
 *
 * Запуск: node tools/build-floors.mjs
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Одиниць системи координат на метр */
const SCALE = 25
/** Товщина стіни між приміщеннями, метрів */
const WALL = 0.15

const m = (meters) => Math.round(meters * SCALE)

/**
 * Ряд приміщень: тягнуться вздовж однієї лінії, спільна глибина.
 * width кожного = area / depth.
 */
function layoutRow(rooms, depth, originX, originY) {
  let x = originX
  return rooms.map((room) => {
    const width = room.area / depth
    const polygon = [
      [m(x), m(originY)],
      [m(x + width), m(originY)],
      [m(x + width), m(originY + depth)],
      [m(x), m(originY + depth)],
    ]
    x += width + WALL
    return { label: room.label, area: room.area, polygon }
  })
}

const rowWidth = (rooms, depth) =>
  rooms.reduce((sum, r) => sum + r.area / depth, 0) + WALL * (rooms.length - 1)

function buildFloor({ title, rows, annex }) {
  const rooms = []
  let y = 1

  for (const row of rows) {
    rooms.push(...layoutRow(row.rooms, row.depth, 1, y))
    y += row.depth + (row.gapAfter ?? WALL)
  }

  // Прибудова малюється окремим блоком праворуч зверху — на сканах вона
  // винесена за межі основного прямокутника
  if (annex) {
    const startX = Math.max(...rows.map((r) => rowWidth(r.rooms, r.depth))) + 2
    rooms.push(...layoutRow(annex.rooms, annex.depth, startX, 1))
  }

  const maxX = Math.max(...rooms.flatMap((r) => r.polygon.map((p) => p[0])))
  const maxY = Math.max(...rooms.flatMap((r) => r.polygon.map((p) => p[1])))

  return {
    title,
    viewBox: `0 0 ${maxX + m(1)} ${maxY + m(1)}`,
    metersPerUnit: 1 / SCALE,
    totalArea: Number(rooms.reduce((s, r) => s + r.area, 0).toFixed(1)),
    rooms,
  }
}

// ── Прочитане зі сканів ────────────────────────────────────────────────────────
// Позначка «?» у коментарі — там, де цифра на скані читається неоднозначно
// і потребує підтвердження людиною.

const FLOORS = [
  {
    file: 'floor-1',
    title: 'І поверх',
    rows: [
      {
        depth: 3.41, // розмір підписаний на скані
        rooms: [
          { label: '7', area: 17.3 },
          { label: '1', area: 11.5 },
          { label: '2', area: 12.9 },
          { label: '3', area: 10.2 },
          { label: '4', area: 13.0 },
        ],
      },
      {
        // На скані це «1 / 18.5» — окреме приміщення, а не коридор.
        // Сам коридор на плані не має ні номера, ні площі, тому на схемі він —
        // порожній проміжок між рядами, а не вигадана фігура.
        depth: 2.2,
        gapAfter: 1.4,
        rooms: [{ label: '1', area: 18.5 }],
      },
      {
        depth: 4.93,
        rooms: [
          { label: '5', area: 7.8 },
          { label: '3', area: 13.3 },
          { label: '2', area: 23.8 },
          { label: 'ІІ (сходи)', area: 15.4 },
          { label: '11', area: 18.8 },
          { label: '10', area: 14.1 },
          { label: '9', area: 12.3 },
        ],
      },
    ],
    annex: { depth: 2.26, rooms: [{ label: '7 (прибудова)', area: 9.5 }] },
  },
  {
    file: 'floor-2',
    title: 'ІІ поверх',
    rows: [
      {
        depth: 3.4,
        rooms: [
          { label: '4', area: 18.3 },
          { label: '5', area: 8.4 },
          { label: '2', area: 12.4 },
          { label: '3', area: 10.2 },
          { label: '4', area: 11.9 }, // ? номер може бути «5»
        ],
      },
      {
        depth: 2.2,
        gapAfter: 1.4,
        rooms: [{ label: '1', area: 20.7 }],
      },
      {
        depth: 5.15,
        rooms: [
          { label: '1', area: 14.1 },
          { label: '3', area: 13.9 },
          { label: '2', area: 23.0 },
          { label: 'ІІІ (сходи)', area: 15.9 },
          { label: '12', area: 19.1 },
          { label: '11', area: 14.3 },
          { label: '10', area: 11.1 },
        ],
      },
    ],
    annex: {
      depth: 2.4,
      rooms: [
        { label: '2 (прибудова)', area: 9.7 },
        { label: '9', area: 4.0 },
      ],
    },
  },
  {
    file: 'basement',
    title: 'Цокольний поверх',
    rows: [
      {
        depth: 3.38,
        rooms: [
          { label: '6', area: 9.6 },
          { label: '7', area: 15.0 },
          { label: 'ІІ', area: 8.6 },
        ],
      },
      {
        depth: 5.02,
        rooms: [
          { label: '1', area: 12.9 },
          { label: '3', area: 26.8 },
          { label: '4', area: 15.1 },
          { label: 'ІІІ', area: 5.3 },
        ],
      },
      {
        // Правий блок: на скані він окремим прямокутником, приміщення дрібні
        depth: 4.2,
        rooms: [
          { label: '1', area: 5.3 },
          { label: '4', area: 4.8 },
          { label: '2', area: 5.3 },
          { label: '8', area: 13.8 },
          { label: '5', area: 11.3 }, // ? на скані читається як «71.3»
          { label: '9', area: 9.7 },
          { label: '10', area: 10.3 },
        ],
      },
    ],
  },
]

const outDir = join(dirname(fileURLToPath(import.meta.url)), 'out')
mkdirSync(outDir, { recursive: true })

let grandTotal = 0
for (const floor of FLOORS) {
  const built = buildFloor(floor)
  grandTotal += built.totalArea
  writeFileSync(
    join(outDir, `${floor.file}.json`),
    JSON.stringify(built, null, 2),
  )
  console.log(
    `${built.title.padEnd(18)} ${String(built.rooms.length).padStart(2)} прим.  ${String(built.totalArea).padStart(6)} м²`,
  )
}
console.log(`${''.padEnd(18)} ${''.padStart(2)}         ${grandTotal.toFixed(1)} м² разом`)
