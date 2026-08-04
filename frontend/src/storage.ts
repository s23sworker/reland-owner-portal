/**
 * Сховище планувань (IndexedDB).
 *
 * Чому не localStorage, з якого починали: скан поверху шириною 2000 px у вигляді
 * data URL важить 1–3 МБ, а квота localStorage — близько 5 МБ на домен. Другий-третій
 * план просто не збережеться, причому мовчки. IndexedDB тримає Blob як є, без base64,
 * і місця там гігабайти.
 *
 * Форма даних свідомо така, щоб при переїзді на бекенд не переробляти екрани:
 * план із варіантами всередині, скан — окремим полем.
 */

import type { Polygon } from './geometry'

export type PlanRoom = {
  id: string
  label: string
  polygon: Polygon
  area: number
}

/** Звідки взявся варіант — це видно в списку і важливо для оцінки якості розпізнавання */
export type VariantSource = 'manual' | 'auto' | 'generated'

export type PlanVariant = {
  id: string
  label: string
  source: VariantSource
  rooms: Array<PlanRoom>
  metersPerUnit: number | null
  createdAt: number
}

export type Plan = {
  id: string
  buildingLabel: string
  floorLabel: string
  /** Оригінальний скан. Зберігаємо назавжди: без пари «скан → результат»
   *  виправлений план не годиться як приклад для розпізнавання наступних. */
  scan: Blob
  size: { w: number; h: number }
  variants: Array<PlanVariant>
  activeVariantId: string | null
  createdAt: number
}

const DB_NAME = 'reland-plans'
const STORE = 'plans'

/**
 * Одне з'єднання на весь застосунок. Відкривати нове на кожну операцію не можна:
 * вони не закриваються самі, за сесію з десятками збережень їх накопичуються
 * десятки, і будь-яка спроба видалити чи оновити базу зависає в стані blocked.
 */
let connection: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (connection) return connection

  connection = open().then((db) => {
    // База може існувати без потрібного сховища — наприклад, якщо попереднє
    // оновлення обірвалося. Тоді без цієї перевірки застосунок ламається назавжди:
    // версія вже поточна, onupgradeneeded більше не спрацює, і кожна операція падає.
    if (db.objectStoreNames.contains(STORE)) return db
    const version = db.version + 1
    db.close()
    return open(version)
  })

  return connection
}

function open(version?: number): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req =
      version === undefined
        ? indexedDB.open(DB_NAME)
        : indexedDB.open(DB_NAME, version)

    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => {
      const db = req.result
      // Якщо базу видаляють або оновлюють з іншої вкладки — звільняємо з'єднання,
      // інакше та вкладка застрягне в blocked
      db.onversionchange = () => {
        db.close()
        connection = null
      }
      resolve(db)
    }
    req.onerror = () => {
      connection = null
      reject(req.error)
    }
  })
}

function tx<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const store = db.transaction(STORE, mode).objectStore(STORE)
        const req = run(store)
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      }),
  )
}

export const listPlans = async (): Promise<Array<Plan>> => {
  const all = await tx<Array<Plan>>('readonly', (s) => s.getAll())
  return all.sort((a, b) => b.createdAt - a.createdAt)
}

export const getPlan = (id: string) =>
  tx<Plan | undefined>('readonly', (s) => s.get(id))

export const savePlan = (plan: Plan) =>
  tx('readwrite', (s) => s.put(plan) as IDBRequest<IDBValidKey>)

export const deletePlan = (id: string) =>
  tx('readwrite', (s) => s.delete(id) as unknown as IDBRequest<undefined>)

/** Ідентифікатори без Date.now() у чистому вигляді — щоб два збереження в одну мілісекунду не збіглися */
let counter = 0
export const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`
