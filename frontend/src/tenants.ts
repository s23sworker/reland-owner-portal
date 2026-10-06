/**
 * Дані орендарів, заповнені вручну в режимі адміна.
 *
 * ТИМЧАСОВО в localStorage цього браузера: бекенда в кабінету ще немає.
 * Справжнє місце цих даних — CRM, вона єдине джерело правди, а кабінет власника
 * їх лише показує. Форма даних та сама, що прийде з API, тому при переїзді
 * екрани не переробляються — змінюється тільки звідки береться запис.
 *
 * Тут лише текст і числа (кілобайти), тому localStorage достатньо —
 * на відміну від сканів, які лежать в IndexedDB.
 */

import type { Room, TenantDetails } from './mock'

export type TenantRecord = Pick<
  Room,
  | 'tenant'
  | 'tenantPhone'
  | 'rent'
  | 'contractNo'
  | 'movedInAt'
  | 'priceReviewAt'
  | 'leaseUntil'
> & { details: TenantDetails }

export type TenantBook = Record<string, TenantRecord>

const KEY = 'reland-tenants'

export function loadTenants(): TenantBook {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as TenantBook
  } catch {
    // Зіпсований запис не повинен ламати весь кабінет — починаємо з чистого
    return {}
  }
}

export function saveTenants(book: TenantBook) {
  localStorage.setItem(KEY, JSON.stringify(book))
}

/** Накладає заповнені вручну дані на приміщення з плану */
export function applyTenant(room: Room, book: TenantBook): Room {
  const record = book[room.id]
  return record ? { ...room, ...record } : room
}
