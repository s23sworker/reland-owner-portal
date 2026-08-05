/**
 * Побудова поверхових планів за сканами БТІ:
 * вул. Межигірська, 24, літ. «Б», Поділ, Київ. Плани від 12.01.07, М 1:200.
 *
 * ─── ЯК ЧИТАЄТЬСЯ БУДІВЛЯ ────────────────────────────────────────────────────
 * Спершу кістяк, потім кімнати. Будівля організована навколо вертикального ядра
 * (сходової клітки), від якого розходяться два крила — ліве й праве. Кожне крило
 * має три смуги в глибину: фасадна, середня (хол/коридор крила), тильна.
 * Приміщення заповнюють клітинки, утворені цими смугами, а не вишиковуються
 * в рівний рядок. Рядок давав таблицю, а не план, — саме на це вказав власник.
 *
 * ─── ЧИМ ПІДПЕРТА ГЕОМЕТРІЯ ──────────────────────────────────────────────────
 * Опорні розміри, які на обох поверхах збігаються самі з собою:
 *   • коридор правого крила підписаний 8.90 м на І та на ІІ поверсі;
 *   • глибина правого крила: 3.65 + 2.08 + 5.23 (І) і 3.40 + 2.33 + 5.23 (ІІ)
 *     з перестінками дають однакові 11.20 м — це внутрішня глибина будівлі;
 *   • ліве крило: 4.98 + 4.83 (І) і 5.06 + 4.65 (ІІ) ≈ 9.9–10.0 м завдовжки;
 *   • ширина ядра ≈ 2.45 м: у цоколі приміщення ІІІ/5.3 підписане 2.20 —
 *     5.3 / 2.20 = 2.41, тобто воно перекриває ядро на всю ширину.
 * Ядро стоїть на одному й тому самому X на всіх трьох поверхах, а смуги крил
 * прив'язані до ядра — тому недобір довжини завжди виходить на зовнішній торець,
 * як і має бути: порожнеча всередині будівлі неможлива.
 *
 * ─── ІЄРАРХІЯ ДОВІРИ ─────────────────────────────────────────────────────────
 * Площа > розмір стіни > лінія на скані. Ширина комірки завжди рахується як
 * площа / глибина смуги. Підписані на скані розміри (`wRead`) використовуються
 * ЛИШЕ як перевірка: розходження понад 5 % потрапляє у warnings, а не мовчки
 * підганяється.
 *
 * ─── ЩО РОБИТЬ «НЕ РОЗІБРАНО» ────────────────────────────────────────────────
 * Дрібні приміщення (санвузли, комори, 23, 24, 5, 6, 8 біля прибудови) на скані
 * не читаються. Їх не вигадано: там, де смуга коротша за крило, стоїть комірка
 * «не розібрано» з площею, ОБЧИСЛЕНОЮ з геометрії, а не прочитаною. Видно, де
 * саме бракує даних, і сума сходиться до площі в контурі.
 *
 * Це схема, а не обмір. Технічний паспорт вона не замінює і не годиться
 * для угоди, суду чи узаконення.
 *
 * Запуск: node tools/build-floors.mjs
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Одиниць системи координат на метр */
const SCALE = 40

/** Товщини стін, метри — стара цегляна забудова Подолу */
const OUTER = 0.55
const CAPITAL = 0.38
const PARTITION = 0.12

/** Кістяк, спільний для всіх трьох поверхів (метри) */
const LEFT_WING = 10.0
const CORE_SLOT = 2.45
const RIGHT_WING = 10.4
const INNER_DEPTH = 11.2
/** Смуга під прибудову перед фасадом — щоб кадр був однаковий на всіх поверхах */
const FRONT_MARGIN = 2.5

/** Залишок менший за це вважаємо товщиною стіни, а не приміщенням */
const MIN_CELL = 0.3
/** Розходження прочитаного розміру з обчисленим, за яким б'ємо тривогу */
const TOLERANCE = 0.05

const X_LEFT_END = OUTER + LEFT_WING
const X_CORE = X_LEFT_END + CAPITAL
const X_CORE_END = X_CORE + CORE_SLOT
const X_RIGHT = X_CORE_END + CAPITAL
const X_RIGHT_END = X_RIGHT + RIGHT_WING

const FRAME_W = X_RIGHT_END + OUTER
const Y_TOP = FRONT_MARGIN + OUTER
const FRAME_H = Y_TOP + INNER_DEPTH + OUTER

const m = (meters) => Math.round(meters * SCALE)
const rect = (x, y, w, h) => [
  [m(x), m(y)],
  [m(x + w), m(y)],
  [m(x + w), m(y + h)],
  [m(x), m(y + h)],
]
const round1 = (v) => Number(v.toFixed(1))

// ── Хелпери опису ────────────────────────────────────────────────────────────

/** Приміщення: площа обов'язкова, wRead/d — прочитане зі скану, для перевірки */
const room = (label, area, extra = {}) => ({ label, area, ...extra })
/** Комірка, площу якої на скані не видно: рахується з геометрії */
const unread = (why) => ({ unread: true, why })
/** Вертикальний стос усередині смуги: приміщення одне за одним у глибину */
const stack = (cells, tailWhy) => ({ stack: cells, tailWhy })

// ── Розкладка ────────────────────────────────────────────────────────────────

/** Ширина комірки: площа / глибина. Площа — головна, розмір зі скану — перевірка */
function cellWidth(cell, bandDepth, warn) {
  if (cell.unread) return cell.w ?? 0
  if (cell.stack) return Math.max(...cell.stack.map((c) => cellWidth(c, bandDepth, warn)))
  const depth = cell.d ?? bandDepth
  const w = cell.area / depth
  if (cell.wRead && Math.abs(w - cell.wRead) / cell.wRead > TOLERANCE) {
    warn(
      `прим. ${cell.label}: підпис ${cell.wRead.toFixed(2)} × ${depth.toFixed(2)} = ` +
        `${(cell.wRead * depth).toFixed(1)} м², а площа ${cell.area} — узято площу ` +
        `(ширина ${w.toFixed(2)})`,
    )
  }
  return w
}

/** Кладе одну комірку в out */
function placeCell(cell, x, y, width, bandDepth, out, warn) {
  if (cell.unread) {
    out.push({
      label: 'не розібрано',
      area: round1(width * bandDepth),
      note: cell.why,
      unread: true,
      polygon: rect(x, y, width, bandDepth),
    })
    return
  }

  if (cell.stack) {
    let yy = y
    for (const sub of cell.stack) {
      const subDepth = sub.unread ? y + bandDepth - yy : (sub.d ?? bandDepth)
      const subWidth = sub.unread ? width : cellWidth(sub, subDepth, warn)
      placeCell(sub, x, yy, subWidth, subDepth, out, warn)
      // Приміщення вужче за колонку — решта поряд не розібрана
      if (!sub.unread && width - subWidth > MIN_CELL + PARTITION) {
        out.push({
          label: 'не розібрано',
          area: round1((width - subWidth - PARTITION) * subDepth),
          note: `поряд із прим. ${sub.label}`,
          unread: true,
          polygon: rect(x + subWidth + PARTITION, yy, width - subWidth - PARTITION, subDepth),
        })
      }
      yy += subDepth + PARTITION
    }
    const rest = y + bandDepth - yy
    if (rest > MIN_CELL) {
      out.push({
        label: 'не розібрано',
        area: round1(width * rest),
        note: cell.tailWhy ?? 'у глибині смуги',
        unread: true,
        polygon: rect(x, yy, width, rest),
      })
    }
    return
  }

  const depth = cell.d ?? bandDepth
  out.push({
    label: cell.label,
    area: cell.area,
    ...(cell.hall ? { hall: true } : {}),
    polygon: rect(x, y, width, depth),
  })
  if (bandDepth - depth > MIN_CELL + PARTITION) {
    out.push({
      label: 'не розібрано',
      area: round1(width * (bandDepth - depth - PARTITION)),
      note: `за прим. ${cell.label}`,
      unread: true,
      polygon: rect(x, y + depth + PARTITION, width, bandDepth - depth - PARTITION),
    })
  }
}

/**
 * Розкладає смугу крила.
 * Смуги прив'язані до ядра: недобір довжини завжди виходить на зовнішній торець.
 * side = 'left' → комірки притиснуті праворуч (до ядра), 'right' → ліворуч.
 */
function layoutBand(band, side, wingLength, y, rooms, corridors, warn) {
  const widths = band.cells.map((c) => cellWidth(c, band.depth, warn))
  const used = widths.reduce((s, w) => s + w, 0) + PARTITION * Math.max(0, widths.length - 1)
  const gap = wingLength - used - (widths.length ? PARTITION : 0)

  const xWingStart = side === 'left' ? OUTER : X_RIGHT
  let x = side === 'left' ? xWingStart + wingLength - used : xWingStart

  for (const [i, cell] of band.cells.entries()) {
    placeCell(cell, x, y, widths[i], band.depth, rooms, warn)
    x += widths[i] + PARTITION
  }

  if (used > wingLength + MIN_CELL) {
    warn(
      `${side === 'left' ? 'ліве' : 'праве'} крило, смуга ${band.depth.toFixed(2)} м: ` +
        `сума приміщень ${used.toFixed(2)} м довша за крило ${wingLength.toFixed(2)} м`,
    )
  }
  if (gap <= MIN_CELL) return

  const xGap = side === 'left' ? xWingStart : xWingStart + used + PARTITION
  if (band.corridor) {
    corridors.push({
      polygon: rect(xGap, y, gap, band.depth),
      label: band.corridorLabel ?? 'Коридор',
      area: round1(gap * band.depth),
    })
  } else if (band.fill !== 'none') {
    rooms.push({
      label: 'не розібрано',
      area: round1(gap * band.depth),
      note: band.why ?? 'торець крила',
      unread: true,
      polygon: rect(xGap, y, gap, band.depth),
    })
  }
}

// ── Обов'язкові перевірки перед видачею ──────────────────────────────────────

/**
 * Пропорції, повтори номерів, доступність. Нічого не виправляє — доповідає.
 * Тихо підганяти план під перевірку не можна: людина мусить знати, де не так.
 */
function checkFloor(rooms, spec, warn) {
  const seen = new Map()
  for (const r of rooms) {
    if (r.unread) continue
    const [w, h] = [
      (r.polygon[1][0] - r.polygon[0][0]) / SCALE,
      (r.polygon[2][1] - r.polygon[1][1]) / SCALE,
    ]
    // 4. Пропорції: вузька довга смуга — це коридор, а не кабінет
    const ratio = Math.max(w, h) / Math.min(w, h)
    // Комунікації позначені у специфікації явно — вгадувати їх за номером не можна:
    // «10», «11», «12» теж починаються з одиниці, а холом є тільки «1».
    const isCorridorLike = r.hall === true || /сход|тамбур/i.test(r.label)
    if (Math.min(w, h) < 1.5 && !isCorridorLike) {
      warn(
        `прим. ${r.label}: ${w.toFixed(2)} × ${h.toFixed(2)} м — надто вузьке для кабінету, ` +
          'перевірити, чи не потрапило воно не в ту смугу',
      )
    } else if (ratio > 4 && !isCorridorLike) {
      warn(`прим. ${r.label}: пропорція ${ratio.toFixed(1)}:1 — схоже на коридор, а не кабінет`)
    }
    // 3. Номери не повторюються в межах ОДНОГО об'єкта нумерації.
    //    Тут вони повторюються — бо поверх поділений між кількома власниками
    //    і нумерація в кожній частині починається з 1. Це не помилка читання,
    //    але людина мусить бачити список.
    if (seen.has(r.label)) warn(`номер «${r.label}» трапляється двічі (перший — ${seen.get(r.label)})`)
    else seen.set(r.label, `${w.toFixed(1)} × ${h.toFixed(1)} м`)
  }
}

function buildFloor(spec) {
  const rooms = []
  const corridors = []
  const warnings = []
  const warn = (msg) => warnings.push(msg)

  // 1. Крила — по три смуги в глибину, прив'язані до ядра
  for (const wing of spec.wings) {
    const length = wing.length ?? (wing.side === 'left' ? LEFT_WING : RIGHT_WING)
    let y = Y_TOP
    for (const band of wing.bands) {
      layoutBand(band, wing.side, length, y, rooms, corridors, warn)
      y += band.depth + PARTITION
    }
    const depth = wing.bands.reduce((s, b) => s + b.depth, 0) + PARTITION * (wing.bands.length - 1)
    if (Math.abs(depth - (wing.depth ?? INNER_DEPTH)) > 0.25) {
      warn(
        `${wing.side === 'left' ? 'ліве' : 'праве'} крило: смуги дають ${depth.toFixed(2)} м ` +
          `глибини замість ${(wing.depth ?? INNER_DEPTH).toFixed(2)} — перевірити глибини смуг`,
      )
    }
  }

  // 2. Ядро — на одному й тому самому X на всіх поверхах.
  //    Сходи притиснуті до фасаду, за ними — те, що на скані не розібрано
  //    (на І поверсі біля сходів видно дрібні 23 і 24).
  let yCore = Y_TOP
  for (const cell of spec.core) {
    const depth = cell.area / CORE_SLOT
    rooms.push({
      label: cell.label,
      area: cell.area,
      // Сходи — місце спільного користування, а не об'єкт оренди:
      // у кабінеті вони показуються з площею, але не клікаються
      common: true,
      polygon: rect(X_CORE, yCore, CORE_SLOT, depth),
    })
    if (cell.wRead && Math.abs(CORE_SLOT - cell.wRead) / cell.wRead > TOLERANCE) {
      warn(
        `ядро ${cell.label}: підпис ширини ${cell.wRead.toFixed(2)} проти прийнятих ` +
          `${CORE_SLOT} — узято площу ${cell.area} (глибина ${depth.toFixed(2)})`,
      )
    }
    yCore += depth + PARTITION
  }
  const coreDepth = spec.coreDepth ?? INNER_DEPTH
  const coreTail = Y_TOP + coreDepth - yCore
  if (coreTail > MIN_CELL) {
    rooms.push({
      label: 'не розібрано',
      area: round1(CORE_SLOT * coreTail),
      note: spec.coreTailWhy ?? 'біля сходів',
      unread: true,
      polygon: rect(X_CORE, yCore, CORE_SLOT, coreTail),
    })
  }

  // 3. Прибудова — окремим об'ємом перед фасадом правого крила (згори праворуч)
  if (spec.annex) {
    const widths = spec.annex.cells.map((c) => cellWidth(c, spec.annex.depth, warn))
    const used = widths.reduce((s, w) => s + w, 0) + PARTITION * (widths.length - 1)
    let x = X_RIGHT_END - used
    for (const [i, cell] of spec.annex.cells.entries()) {
      placeCell(cell, x, Y_TOP - spec.annex.depth, widths[i], spec.annex.depth, rooms, warn)
      x += widths[i] + PARTITION
    }
  }

  checkFloor(rooms, spec, warn)

  const read = rooms.filter((r) => !r.unread).reduce((s, r) => s + r.area, 0)
  const unreadArea = rooms.filter((r) => r.unread).reduce((s, r) => s + r.area, 0)
  const corridorArea = corridors.reduce((s, c) => s + (c.area ?? 0), 0)

  return {
    title: spec.title,
    viewBox: `0 0 ${m(FRAME_W)} ${m(FRAME_H)}`,
    metersPerUnit: 1 / SCALE,
    buildingSize: `${FRAME_W.toFixed(1)} × ${(INNER_DEPTH + 2 * OUTER).toFixed(1)} м`,
    readArea: round1(read),
    unreadArea: round1(unreadArea),
    corridorArea: round1(corridorArea),
    totalArea: round1(read + unreadArea + corridorArea),
    warnings,
    uncertain: spec.uncertain ?? [],
    corridors,
    rooms,
  }
}

// ─── Прочитане зі сканів ──────────────────────────────────────────────────────
// Порядок комірок у смузі — зліва направо, як на скані.
// wRead — розмір, підписаний на скані (перевірка). d — власна глибина комірки.

const FLOORS = [
  {
    file: 'basement',
    title: 'Цокольний поверх',
    // Сходи цоколю менші за верхні: вниз іде один марш. Позиція та сама.
    core: [
      room('ІІ (сходи)', 8.6, { wRead: 2.45 }),
      room('ІІІ (тамбур)', 5.3, { wRead: 2.41 }),
    ],
    coreDepth: 10.59,
    coreTailWhy: 'цоколь під ядром не розібрано',
    wings: [
      {
        side: 'left',
        depth: 10.59,
        // Цоколь не доходить до торця крила — смуги коротші, торець не добудовуємо
        bands: [
          {
            depth: 3.38,
            fill: 'none',
            cells: [room('6', 9.6, { wRead: 2.84 }), room('7', 15.0, { wRead: 3.43 })],
          },
          { depth: 1.95, fill: 'none', cells: [room('1', 12.9, { wRead: 6.62, hall: true })] },
          {
            depth: 5.02,
            fill: 'none',
            cells: [room('3', 26.8, { wRead: 5.34 }), room('4', 15.1)],
          },
        ],
      },
      {
        side: 'right',
        depth: 8.0,
        length: 8.63,
        // На скані права частина цоколю — окремий об'єм, мілкіший за основний
        bands: [
          {
            depth: 2.25,
            why: "торець правого об'єму цоколю",
            cells: [
              room('1', 5.3, { wRead: 4.38 }),
              room('4', 4.8, { wRead: 3.32 }),
              room('2', 5.3),
            ],
          },
          { depth: 1.31, fill: 'none', cells: [room('5', 11.3, { wRead: 8.63, hall: true })] },
          {
            depth: 4.2,
            fill: 'none',
            cells: [
              room('8', 13.8, { wRead: 5.6 }),
              room('9', 9.7),
              room('10', 10.3, { wRead: 4.7 }),
            ],
          },
        ],
      },
    ],
    uncertain: [
      {
        what: 'приміщення 5 правої частини',
        read: '71.3',
        assumed: 11.3,
        why: '71 м² у цоколі цієї будівлі неправдоподібно; 11.3 при підписі 8.63 дає смугу 1.31 м — тобто коридор',
      },
      {
        what: 'приміщення 7 лівої частини',
        read: '3.43 × 5.39',
        assumed: 15.0,
        why: 'підписані розміри дають 18.5 м², а площа 15.0 — узято площу',
      },
      {
        what: 'приміщення 10 правої частини',
        read: '4.70 × 4.20',
        assumed: 10.3,
        why: 'підписані розміри дають 19.7 м² проти площі 10.3 — розмір прочитано неправильно',
      },
      {
        what: 'приміщення 1 правої частини',
        read: '4.38 × 2.25',
        assumed: 5.3,
        why: 'розміри дають 9.9 м² проти площі 5.3',
      },
      {
        what: 'розподіл лівої частини по смугах',
        read: 'ряди на скані не підписані',
        assumed: '6, 7 — фасад; 1 — хол; 3, 4 — тил',
        why: 'за глибинами (6 має 3.38, 3 має 5.02) і за тим, що №1 у цій будівлі — завжди хол крила',
      },
      {
        what: 'довжина лівої частини цоколю',
        read: 'не підписана',
        assumed: '8.5 м замість 10.0 м крила',
        why: 'сума прочитаних приміщень коротша за крило; торець залишено порожнім, а не добудовано',
      },
    ],
  },
  {
    file: 'floor-1',
    title: 'І поверх',
    core: [room('ІІ (сходи)', 15.4)],
    coreTailWhy: 'дрібні 23, 24 біля сходів — площі не читаються',
    wings: [
      {
        side: 'left',
        bands: [
          {
            depth: 3.27, // прим. 7 підписане 5.30 × 3.27 = 17.3 — глибина смуги надійна
            why: 'торець лівого крила (у нумерації крила бракує 4 і 6)',
            cells: [room('7', 17.3, { wRead: 5.3 }), room('1', 11.5)],
          },
          {
            // 11.20 − 3.27 − 4.93 − 2 перестінки. Номера на скані не видно.
            depth: 2.76,
            corridor: true,
            corridorLabel: 'Коридор лівого крила (номер не читається)',
            cells: [],
          },
          {
            depth: 4.93, // прим. 2 підписане 4.83 × 4.93 = 23.8
            fill: 'none',
            cells: [
              stack(
                [
                  room('3', 13.3, { wRead: 4.98, d: 2.67 }),
                  room('5', 7.8, { wRead: 4.08, d: 1.91 }),
                ],
                'у глибині за прим. 5',
              ),
              room('2', 23.8, { wRead: 4.83 }),
            ],
          },
        ],
      },
      {
        side: 'right',
        bands: [
          {
            depth: 3.65, // 11.20 − 2.08 (коридор) − 5.23 (тил); підтверджено 2.80 × 3.65 = 10.2
            fill: 'none',
            cells: [
              room('2', 12.9, { wRead: 3.7 }),
              room('3', 10.2, { wRead: 2.8 }),
              room('4', 13.0, { wRead: 3.56 }),
            ],
          },
          {
            depth: 2.08, // 18.5 / 8.90 — коридор підписаний по довжині
            why: 'торець коридору правого крила',
            cells: [room('1', 18.5, { wRead: 8.9, hall: true })],
          },
          {
            depth: 5.23,
            why: 'торець тильного ряду правого крила — ймовірно санвузол',
            cells: [
              room('11', 18.8, { wRead: 3.58 }),
              room('10', 14.1, { wRead: 2.7 }),
              room('9', 12.3, { wRead: 2.35 }),
            ],
          },
        ],
      },
    ],
    annex: { depth: 2.26, cells: [room('7 (прибудова)', 9.5, { wRead: 4.53 })] },
    uncertain: [
      {
        what: 'приміщення 1 / 11.5 лівого крила',
        read: 'без розмірів, у фасадному ряду',
        assumed: 'фасадний ряд, ширина 3.52',
        why: 'на ІІ поверсі холом лівого крила є 1/14.1 (6.70 × 2.10) у середній смузі — не виключено, що й тут «1» стоїть у середній смузі, а не на фасаді',
      },
      {
        what: 'середня смуга лівого крила',
        read: 'номер не читається',
        assumed: 'коридор 10.0 × 2.76 м',
        why: 'глибина виведена з різниці 11.20 − 3.27 − 4.93; жодного номера в ній не прочитано',
      },
      {
        what: 'приміщення 5 / 7.8',
        read: '4.08',
        assumed: 'за прим. 3, власна глибина 1.91',
        why: '2.67 (прим. 3) + 1.91 = 4.58 ≈ 4.93 глибини тильної смуги — 3 і 5 стоять одне за одним, а не поряд; у попередній версії 5 виходило 1.6 м завширшки при 4.93 глибини',
      },
      {
        what: 'дрібні 23, 24 біля сходів',
        read: 'номери видно, площі — ні',
        assumed: 'спільна комірка «не розібрано» за сходами',
        why: 'площа обчислена з геометрії ядра, зі скану не прочитана',
      },
      {
        what: 'прибудова: 5, 6, 8 поряд із 7',
        read: 'номери видно, площі — ні',
        assumed: 'не показані',
        why: 'жодного розміру немає — домальовувати їх означало б вигадати площу',
      },
      {
        what: 'фасадний ряд правого крила',
        read: '3.70 / 2.80 / 3.56',
        assumed: 'сумарно 10.1 м проти 8.9 м тильного ряду',
        why: 'фасадний ряд на 1.2 м довший за тильний на обох поверхах — або в тилу є нерозібраний санвузол, або контур має уступ',
      },
    ],
  },
  {
    file: 'floor-2',
    title: 'ІІ поверх',
    core: [room('ІІІ (сходи)', 15.9)],
    coreTailWhy: 'за сходами — на скані не розібрано',
    wings: [
      {
        side: 'left',
        bands: [
          {
            depth: 3.65, // 5.02 × 3.64 = 18.3 і 2.30 × 3.66 = 8.4 — обидва сходяться
            why: 'торець лівого крила',
            cells: [room('4', 18.3, { wRead: 5.02 }), room('5', 8.4, { wRead: 2.3 })],
          },
          {
            depth: 2.1, // 6.70 × 2.10 = 14.1 — хол крила, підписаний точно
            why: 'торець холу лівого крила',
            cells: [room('1', 14.1, { wRead: 6.7, hall: true })],
          },
          {
            depth: 5.21,
            fill: 'none',
            cells: [
              stack([room('3', 13.9, { wRead: 5.06, d: 2.75 }), unread('за прим. 3')]),
              room('2', 23.0, { wRead: 4.65 }),
            ],
          },
        ],
      },
      {
        side: 'right',
        bands: [
          {
            depth: 3.4,
            fill: 'none',
            cells: [
              room('2', 12.4, { wRead: 3.5 }),
              room('3', 10.2, { wRead: 3.0 }),
              room('4', 11.9, { wRead: 3.45 }),
            ],
          },
          {
            depth: 2.33, // 20.7 / 8.90
            why: 'торець коридору правого крила',
            cells: [room('1', 20.7, { wRead: 8.9, hall: true })],
          },
          {
            depth: 5.23,
            why: 'торець тильного ряду правого крила — ймовірно санвузол',
            cells: [
              room('12', 19.1, { wRead: 3.53 }),
              room('11', 14.3, { wRead: 2.68 }),
              room('10', 11.1, { wRead: 2.47 }),
            ],
          },
        ],
      },
    ],
    annex: {
      depth: 2.4,
      cells: [room('2 (прибудова)', 9.7, { wRead: 2.53 }), room('9', 4.0)],
    },
    uncertain: [
      {
        what: 'останній номер фасадного ряду правого крила',
        read: '4 / 11.9',
        assumed: '4',
        why: '«4» у цьому ряду вже є (2, 3, 4) — один із двох прочитано неправильно, ймовірно це «5»',
      },
      {
        what: 'приміщення 10 / 11.1',
        read: '2.47 × 4.02',
        assumed: 11.1,
        why: 'розміри дають 9.9 м² проти площі 11.1 — узято площу',
      },
      {
        what: 'смуга за приміщенням 3 лівого крила',
        read: 'нічого не читається',
        assumed: 'комірка «не розібрано» ~12 м²',
        why: 'прим. 3 має глибину 2.75 у смузі 5.21 — за ним лишається місце, а на І поверсі там стоїть прим. 5',
      },
      {
        what: 'прибудова: дрібне 8',
        read: 'номер видно, площа — ні',
        assumed: 'не показане',
        why: 'жодного розміру немає',
      },
    ],
  },
]

// ─── Складання ────────────────────────────────────────────────────────────────

const outDir = join(dirname(fileURLToPath(import.meta.url)), 'out')
mkdirSync(outDir, { recursive: true })

const totals = { read: 0, unread: 0, corridor: 0 }
const built3 = []
for (const spec of FLOORS) {
  const built = buildFloor(spec)
  built3.push(built)
  totals.read += built.readArea
  totals.unread += built.unreadArea
  totals.corridor += built.corridorArea
  writeFileSync(join(outDir, `${spec.file}.json`), JSON.stringify(built, null, 2))

  console.log(
    `${built.title.padEnd(18)} ${String(built.rooms.length).padStart(2)} комірок  ` +
      `прочитано ${String(built.readArea).padStart(6)}  ` +
      `не розібрано ${String(built.unreadArea).padStart(5)}  ` +
      `коридори ${String(built.corridorArea).padStart(5)}  ` +
      `разом ${String(built.totalArea).padStart(6)} м²`,
  )
  built.warnings.forEach((w) => console.log(`   ⚠ ${w}`))
}

// 5. Ядро на місці + капітальні стіни наскрізь: порівнюємо поверхи між собою
console.log('\nНаскрізна перевірка по поверхах:')
const coreBoxes = built3.map((f) => {
  const stairs = f.rooms.find((r) => /сход/.test(r.label))
  return { title: f.title, x: stairs.polygon[0][0] / SCALE, area: stairs.area }
})
const sameCoreX = coreBoxes.every((c) => Math.abs(c.x - coreBoxes[0].x) < 0.01)
console.log(
  `  ядро: ${coreBoxes.map((c) => `${c.title.split(' ')[0]} ${c.area} м² @ X=${c.x.toFixed(2)}`).join(' | ')}` +
    ` → ${sameCoreX ? 'на тому самому місці ✓' : 'РІЗНІ МІСЦЯ ✗'}`,
)
// Довжина фасадного ряду лівого крила: капітальна структура має повторюватись
for (const [side, idx] of [
  ['left', 0],
  ['right', 0],
  ['right', 2],
]) {
  const lens = FLOORS.map((spec) => {
    const wing = spec.wings.find((w) => w.side === side)
    const band = wing.bands[idx]
    const used = band.cells.reduce(
      (s, c, i) => s + c.area / (c.d ?? band.depth) + (i ? PARTITION : 0),
      0,
    )
    return { t: spec.title.split(' ')[0], v: used }
  })
  const spread = Math.max(...lens.map((l) => l.v)) - Math.min(...lens.map((l) => l.v))
  console.log(
    `  ${side === 'left' ? 'ліве' : 'праве'} крило, смуга ${idx === 0 ? 'фасадна' : 'тильна'}: ` +
      `${lens.map((l) => `${l.t} ${l.v.toFixed(2)}`).join(' | ')} м` +
      `${spread > 0.6 ? `  ⚠ розбіг ${spread.toFixed(2)} м — перевірити за оригіналом` : '  ✓'}`,
  )
}

const grand = totals.read + totals.unread + totals.corridor
console.log(
  `\nГабарит у плані: ${FRAME_W.toFixed(1)} × ${(INNER_DEPTH + 2 * OUTER).toFixed(1)} м ` +
    `(без прибудови). Ядро на X = ${X_CORE.toFixed(2)}…${X_CORE_END.toFixed(2)} м на всіх поверхах.`,
)
console.log(
  `Прочитано зі сканів ${totals.read.toFixed(1)} + не розібрано ${totals.unread.toFixed(1)} ` +
    `+ коридори ${totals.corridor.toFixed(1)} = ${grand.toFixed(1)} м² у контурі схеми.`,
)
console.log(
  'Власник називає 623 м². Схема — не обмір: різницю має закрити експлікація ' +
    'з технічного паспорта.',
)
