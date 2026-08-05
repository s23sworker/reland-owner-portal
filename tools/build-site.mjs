/**
 * Перетворює побудовані планування (tools/out/*.json) у дані кабінету.
 *
 * Орендарі й ставки НЕ вигадуються: у нас їх немає. Приміщення приходять
 * зі станом «даних немає» — власник заповнить їх, коли з'являться договори.
 * Показати вигадану ставку в кабінеті гірше, ніж не показати нічого:
 * на неї подивляться як на справжню.
 *
 * Запуск: node tools/build-site.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')

const FLOORS = [
  { file: 'basement', label: 'Цокольний' },
  { file: 'floor-1', label: 'І поверх' },
  { file: 'floor-2', label: 'ІІ поверх' },
]

const floors = FLOORS.map(({ file, label }) => {
  const plan = JSON.parse(readFileSync(join(here, 'out', `${file}.json`), 'utf8'))
  return {
    id: file,
    label,
    viewBox: plan.viewBox,
    // Коридор — не об'єкт оренди, натискати на нього нема сенсу. Але площа в нього
    // є і має бути видна, тому він іде в corridors із підписом, а не в rooms.
    // Пронумеровані коридори (на цих планах — «1» правого крила) теж сюди.
    corridors: [
      ...(plan.corridors ?? []),
      ...plan.rooms
        .filter((r) => r.hall || r.common)
        .map((r) => ({
          polygon: r.polygon,
          label: r.hall ? `Коридор ${r.label}` : r.label,
          area: r.area,
        })),
    ],
    rooms: plan.rooms
      .filter((room) => !room.hall && !room.common)
      .map((room, i) => ({
      id: `${file}-${i + 1}`,
      label: room.label,
      area: room.area,
      polygon: room.polygon,
      tenant: null,
      tenantPhone: null,
      rent: null,
      marketRent: null,
      contractNo: null,
      movedInAt: null,
      priceReviewAt: null,
      leaseUntil: null,
    })),
  }
})

/** Розкладка площ: прочитане зі сканів окремо від того, що добудувала геометрія */
const tally = FLOORS.map(({ file }) =>
  JSON.parse(readFileSync(join(here, 'out', `${file}.json`), 'utf8')),
).reduce(
  (acc, p) => ({
    read: acc.read + p.readArea,
    unread: acc.unread + p.unreadArea,
    corridor: acc.corridor + p.corridorArea,
  }),
  { read: 0, unread: 0, corridor: 0 },
)
const total = tally.read + tally.unread + tally.corridor

const out = `/**
 * Межигірська, 24, літ. «Б», Поділ — ${total.toFixed(1)} м² у контурі схеми:
 * ${tally.read.toFixed(1)} прочитано зі сканів, ${tally.unread.toFixed(1)} не розібрано,
 * ${tally.corridor.toFixed(1)} коридор лівого крила без номера.
 * Власник називає 623 м² — розбіжність закриває експлікація техпаспорта.
 *
 * ЗГЕНЕРОВАНО: node tools/build-site.mjs. Руками не правити —
 * джерело даних лежить у tools/build-floors.mjs.
 *
 * Планування побудовані за сканами БТІ від 12.01.07. Це схема, а не обмір:
 * для угоди, суду чи узаконення вона не годиться.
 * Орендарів і ставок немає: їх заповнюють, коли з'являються договори.
 */

import type { Site } from '../mock'

export const MEZHYHIRSKA: Site = ${JSON.stringify(
  {
    id: 'mezhyhirska',
    name: 'Межигірська',
    address: 'вул. Межигірська, 24, літ. «Б», Поділ',
    buildings: [
      {
        id: 'mezhyhirska-building',
        label: 'Окрема будівля вул. Межигірська',
        kind: 'office',
        floors,
      },
    ],
  },
  null,
  2,
)}
`

mkdirSync(join(root, 'frontend/src/data'), { recursive: true })
writeFileSync(join(root, 'frontend/src/data/mezhyhirska.ts'), out)

console.log(
  `Межигірська: ${floors.length} поверхи, ${floors.flatMap((f) => f.rooms).length} приміщень, ${total.toFixed(1)} м²`,
)
