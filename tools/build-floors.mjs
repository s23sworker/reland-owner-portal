/**
 * Побудова поверхових планів за структурою, прочитаною зі сканів БТІ.
 *
 * Будівля не є рядком приміщень. Вона організована навколо вертикального ядра
 * (сходової клітки), від якого розходяться крила; у кожному крилі коридор,
 * по обидва боки від нього — приміщення. Саме так і будуємо: спершу кістяк,
 * потім кімнати. Розкладка в один ряд, з якої почали, давала таблицю, а не план.
 *
 * Ієрархія довіри до цифр: площа > розмір стіни > лінії на скані. Площі надруковані
 * й читаються однозначно, розміри частково рукописні. Тому глибина ряду береться
 * з розбірливого розміру, а ширина приміщення рахується як площа/глибина —
 * площі точні до десятої, пропорції близькі до справжніх.
 *
 * Це схема, а не обмір: технічний паспорт вона не замінює.
 *
 * Запуск: node tools/build-floors.mjs
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Одиниць системи координат на метр */
const SCALE = 25
/** Товщини стін, метри — стара цегляна забудова Подолу */
const OUTER_WALL = 0.55
const CAPITAL_WALL = 0.38
const PARTITION = 0.12
/** Глибина коридору, коли її не можна вивести з площі */
const DEFAULT_CORRIDOR = 1.8

const m = (meters) => Math.round(meters * SCALE)
const rect = (x, y, w, h) => [
  [m(x), m(y)],
  [m(x + w), m(y)],
  [m(x + w), m(y + h)],
  [m(x), m(y + h)],
]

const rowWidth = (rooms, depth) =>
  rooms.reduce((sum, r) => sum + r.area / depth, 0) +
  PARTITION * Math.max(0, rooms.length - 1)

/** Викладає ряд приміщень уздовж однієї лінії; ширина кожного = площа/глибина */
function layoutRow(rooms, depth, x0, y0, out) {
  let x = x0
  for (const room of rooms) {
    const width = room.area / depth
    out.push({ label: room.label, area: room.area, polygon: rect(x, y0, width, depth) })
    x += width + PARTITION
  }
  return x - PARTITION
}

function buildFloor(spec) {
  const rooms = []
  const corridors = []
  const notes = []

  // 1. Габарити крил і глибина будівлі — від структури, а не від переліку кімнат
  const wings = spec.wings.map((wing) => {
    const frontW = wing.front ? rowWidth(wing.front.rooms, wing.front.depth) : 0
    const backW = wing.back ? rowWidth(wing.back.rooms, wing.back.depth) : 0
    const width = Math.max(frontW, backW)
    // Глибину коридору виводимо з його площі, якщо вона підписана на плані
    const corridorDepth = wing.corridor?.area
      ? wing.corridor.area / width
      : DEFAULT_CORRIDOR
    return { ...wing, width, frontW, backW, corridorDepth }
  })

  const frontDepth = Math.max(...wings.map((w) => w.front?.depth ?? 0))
  const backDepth = Math.max(...wings.map((w) => w.back?.depth ?? 0))
  const corridorDepth = Math.max(...wings.map((w) => w.corridorDepth))
  const innerDepth = frontDepth + PARTITION + corridorDepth + PARTITION + backDepth

  const yFront = OUTER_WALL
  const yCorridor = yFront + frontDepth + PARTITION
  const yBack = yCorridor + corridorDepth + PARTITION

  // 2. Розкладка крил ліворуч і праворуч від ядра
  let x = OUTER_WALL
  for (const [i, wing] of wings.entries()) {
    if (wing.front) layoutRow(wing.front.rooms, wing.front.depth, x, yFront, rooms)
    if (wing.back) layoutRow(wing.back.rooms, wing.back.depth, x, yBack, rooms)

    // Коридор крила: якщо на плані має номер і площу — це приміщення,
    // якщо ні — просто комунікація без підпису
    const corridorPoly = rect(x, yCorridor, wing.width, wing.corridorDepth)
    if (wing.corridor?.label) {
      rooms.push({
        label: wing.corridor.label,
        area: wing.corridor.area,
        polygon: corridorPoly,
      })
    } else {
      corridors.push({ polygon: corridorPoly, label: 'Коридор' })
    }

    // Ряди різної довжини — це не похибка розкладки, а незібрані площі:
    // дрібні приміщення, чиї цифри на скані не читаються
    const ragged = Math.abs(wing.frontW - wing.backW)
    if (wing.front && wing.back && ragged > 0.8) {
      notes.push(
        `${wing.side}: ряди різняться на ${ragged.toFixed(1)} м — ймовірно, не розібрані дрібні приміщення`,
      )
    }

    x += wing.width

    // 3. Ядро — між крилами. На всю глибину будівлі його розтягувати не можна:
    // сходова клітка 15 м² вийшла б щілиною 1,3 м завширшки. Глибина ядра —
    // від фасаду до кінця коридору, це дає правдоподібні 2,5–3 м ширини.
    if (i === 0 && spec.core && wings.length > 1) {
      const coreDepth =
        spec.core.depth ?? frontDepth + PARTITION + corridorDepth
      const coreWidth = spec.core.area / coreDepth
      x += CAPITAL_WALL
      rooms.push({
        label: spec.core.label,
        area: spec.core.area,
        polygon: rect(x, yFront, coreWidth, coreDepth),
      })
      x += coreWidth + CAPITAL_WALL
    } else if (i < wings.length - 1) {
      x += CAPITAL_WALL
    }
  }

  const buildingWidth = x + OUTER_WALL
  const buildingDepth = yBack + backDepth + OUTER_WALL

  // 4. Прибудова — окремим об'ємом за контуром основної будівлі
  if (spec.annex) {
    layoutRow(spec.annex.rooms, spec.annex.depth, buildingWidth + 1.2, yFront, rooms)
  }

  const maxX = Math.max(...rooms.flatMap((r) => r.polygon.map((p) => p[0])))
  const maxY = Math.max(...rooms.flatMap((r) => r.polygon.map((p) => p[1])))

  return {
    title: spec.title,
    viewBox: `0 0 ${maxX + m(OUTER_WALL)} ${maxY + m(OUTER_WALL)}`,
    metersPerUnit: 1 / SCALE,
    buildingSize: `${(buildingWidth).toFixed(1)} × ${buildingDepth.toFixed(1)} м`,
    totalArea: Number(rooms.reduce((s, r) => s + r.area, 0).toFixed(1)),
    notes,
    corridors,
    rooms,
  }
}

// ── Прочитане зі сканів: Межигірська, 24, літ. «Б», Поділ ─────────────────────
// Позначка «?» — цифра на скані читається неоднозначно, потребує підтвердження.

const FLOORS = [
  {
    file: 'floor-1',
    title: 'І поверх',
    core: { label: 'ІІ (сходи)', area: 15.4 },
    wings: [
      {
        side: 'ліве крило',
        front: { depth: 3.41, rooms: [{ label: '7', area: 17.3 }, { label: '1', area: 11.5 }] },
        back: { depth: 4.93, rooms: [{ label: '5', area: 7.8 }, { label: '3', area: 13.3 }, { label: '2', area: 23.8 }] },
      },
      {
        side: 'праве крило',
        front: { depth: 3.41, rooms: [{ label: '2', area: 12.9 }, { label: '3', area: 10.2 }, { label: '4', area: 13.0 }] },
        // Коридор правого крила на плані має номер і площу — отже, це приміщення
        corridor: { label: '1', area: 18.5 },
        back: { depth: 4.93, rooms: [{ label: '11', area: 18.8 }, { label: '10', area: 14.1 }, { label: '9', area: 12.3 }] },
      },
    ],
    annex: { depth: 2.26, rooms: [{ label: '7 (прибудова)', area: 9.5 }] },
  },
  {
    file: 'floor-2',
    title: 'ІІ поверх',
    core: { label: 'ІІІ (сходи)', area: 15.9 },
    wings: [
      {
        side: 'ліве крило',
        front: { depth: 3.4, rooms: [{ label: '4', area: 18.3 }, { label: '5', area: 8.4 }] },
        back: { depth: 5.15, rooms: [{ label: '1', area: 14.1 }, { label: '3', area: 13.9 }, { label: '2', area: 23.0 }] },
      },
      {
        side: 'праве крило',
        front: { depth: 3.4, rooms: [{ label: '2', area: 12.4 }, { label: '3', area: 10.2 }, { label: '4', area: 11.9 }] }, // ? останній номер може бути «5»
        corridor: { label: '1', area: 20.7 },
        back: { depth: 5.15, rooms: [{ label: '12', area: 19.1 }, { label: '11', area: 14.3 }, { label: '10', area: 11.1 }] },
      },
    ],
    annex: { depth: 2.4, rooms: [{ label: '2 (прибудова)', area: 9.7 }, { label: '9', area: 4.0 }] },
  },
  {
    file: 'basement',
    title: 'Цокольний поверх',
    core: { label: 'ІІ', area: 8.6 },
    wings: [
      {
        side: 'ліве крило',
        front: { depth: 3.38, rooms: [{ label: '6', area: 9.6 }, { label: '7', area: 15.0 }] },
        back: { depth: 5.02, rooms: [{ label: '1', area: 12.9 }, { label: '3', area: 26.8 }, { label: '4', area: 15.1 }] },
      },
      {
        side: 'праве крило',
        front: { depth: 2.25, rooms: [{ label: '1', area: 5.3 }, { label: '4', area: 4.8 }, { label: '2', area: 5.3 }] },
        corridor: { label: 'ІІІ', area: 5.3 },
        back: { depth: 4.2, rooms: [{ label: '8', area: 13.8 }, { label: '5', area: 11.3 }, { label: '9', area: 9.7 }, { label: '10', area: 10.3 }] }, // ? «5» на скані читається як «71.3»
      },
    ],
  },
]

const outDir = join(dirname(fileURLToPath(import.meta.url)), 'out')
mkdirSync(outDir, { recursive: true })

let grandTotal = 0
for (const spec of FLOORS) {
  const built = buildFloor(spec)
  grandTotal += built.totalArea
  writeFileSync(join(outDir, `${spec.file}.json`), JSON.stringify(built, null, 2))
  console.log(
    `${built.title.padEnd(18)} ${String(built.rooms.length).padStart(2)} прим.  ${String(built.totalArea).padStart(6)} м²  габарит ${built.buildingSize}`,
  )
  built.notes.forEach((n) => console.log(`  ⚠ ${n}`))
}
console.log(`${''.padEnd(18)}            ${grandTotal.toFixed(1)} м² разом`)
