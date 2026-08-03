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
