export type Point = [x: number, y: number]
export type Polygon = Array<Point>

/** Прямокутник як полігон — щоб векторні плани й обведені по скану жили однаково */
export const rect = (x: number, y: number, w: number, h: number): Polygon => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
]

export const toSvgPoints = (poly: Polygon) =>
  poly.map(([x, y]) => `${x},${y}`).join(' ')

export type Box = { x: number; y: number; w: number; h: number }

export function bbox(poly: Polygon): Box {
  const xs = poly.map((p) => p[0])
  const ys = poly.map((p) => p[1])
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y }
}

/**
 * Площа полігона у квадратах системи координат (формула шнурівки).
 * Разом із масштабом «скільки метрів в одиниці» дає площу приміщення —
 * тому при розмітці не обов'язково вводити метраж руками для кожної кімнати.
 */
export function polygonArea(poly: Polygon): number {
  let sum = 0
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i]
    const [x2, y2] = poly[(i + 1) % poly.length]
    sum += x1 * y2 - x2 * y1
  }
  return Math.abs(sum) / 2
}

/** Чи лежить точка всередині полігона (метод променя) */
export function contains(poly: Polygon, [px, py]: Point): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

/**
 * Куди ставити підписи приміщення.
 *
 * Лівий верхній кут описаного прямокутника годиться лише для прямокутних кімнат.
 * У Г-подібної він лежить поза фігурою — і підпис «3 · 217 м²» опиняється всередині
 * сусіднього приміщення. Тому беремо вершини самого контуру: для верхнього підпису —
 * найвищу ліву, для нижнього — найнижчу ліву, і перевіряємо, що відступ від неї
 * справді всередині фігури.
 */
export function labelAnchors(poly: Polygon, inset: { x: number; top: number; bottom: number }) {
  const box = bbox(poly)
  const pick = (order: (a: Point, b: Point) => number, dy: number) => {
    for (const [x, y] of [...poly].sort(order)) {
      const p: Point = [x + inset.x, y + dy]
      if (contains(poly, p)) return { x: x + inset.x, y, ownWidth: rowWidth(poly, x, y + dy) }
    }
    return null
  }
  const top =
    pick((a, b) => a[1] - b[1] || a[0] - b[0], inset.top) ??
    { x: box.x + inset.x, y: box.y, ownWidth: box.w }
  const bottom =
    pick((a, b) => b[1] - a[1] || a[0] - b[0], -inset.bottom) ??
    { x: box.x + inset.x, y: box.y + box.h, ownWidth: box.w }
  return { top, bottom }
}

/** Ширина фігури по горизонталі від точки x на висоті y — скільки місця під текст */
function rowWidth(poly: Polygon, x: number, y: number): number {
  let w = 0
  while (w < 4000 && contains(poly, [x + w + 4, y])) w += 4
  return w
}
