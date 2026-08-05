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
    corridors: [],
    rooms: plan.rooms.map((room, i) => ({
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

const total = floors
  .flatMap((f) => f.rooms)
  .reduce((sum, r) => sum + r.area, 0)

const out = `/**
 * Межигірська, 24, літ. «Б», Поділ — ${total.toFixed(1)} м².
 *
 * ЗГЕНЕРОВАНО: node tools/build-site.mjs. Руками не правити —
 * джерело даних лежить у tools/build-floors.mjs.
 *
 * Планування побудовані за сканами БТІ від 12.01.07. Орендарів і ставок немає:
 * їх заповнюють, коли з'являються договори.
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
