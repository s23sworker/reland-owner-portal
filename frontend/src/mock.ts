/**
 * ТИМЧАСОВІ дані для візуального макета.
 *
 * Побудовані на реальних об'єктах Валентина з CRM (#546 Лісова / Даринок,
 * #545 Троєщина) — решта блоків, орендарі й ставки вигадані, щоб було видно,
 * як екран поводиться із заселеними та вільними приміщеннями.
 *
 * Коли з'явиться API — цей файл видаляється, форма даних лишається та сама.
 */

export type Unit = {
  id: string
  label: string
  area: number
  /** null — блок вільний */
  tenant: string | null
  /** Поточна ставка орендаря, грн/міс. Для вільного — null */
  rent: number | null
  /** Наша оцінка ринкової ставки, грн/міс */
  marketRent: number
  /** Дата закінчення договору, ISO. Для вільного — null */
  leaseUntil: string | null
}

export type Site = {
  id: string
  name: string
  address: string
  units: Array<Unit>
}

export type Owner = {
  name: string
  sites: Array<Site>
}

export const OWNER: Owner = {
  name: 'Валентин',
  sites: [
    {
      id: 'lisova',
      name: 'Лісова',
      address: "вул. Лісова, 5 хв від метро Даринок",
      units: [
        {
          id: 'lisova-1',
          label: 'Склад №1',
          area: 250,
          tenant: 'Іван Ковальчук',
          rent: 50000,
          marketRent: 65000,
          leaseUntil: '2026-11-30',
        },
        {
          id: 'lisova-2',
          label: 'Склад №2',
          area: 155,
          tenant: 'Анатолій Бондар',
          rent: 60000,
          marketRent: 62000,
          leaseUntil: '2027-03-15',
        },
        {
          id: 'lisova-3',
          label: 'Офіс №1',
          area: 195,
          tenant: 'ТОВ «Логістик Плюс»',
          rent: 38000,
          marketRent: 42000,
          leaseUntil: '2026-09-10',
        },
        {
          id: 'lisova-4',
          label: 'Склад №3',
          area: 200,
          tenant: null,
          rent: null,
          marketRent: 80000,
          leaseUntil: null,
        },
      ],
    },
    {
      id: 'troieshchyna',
      name: 'Троєщина',
      address: 'вул. Милославська, Троєщина',
      units: [
        {
          id: 'tro-1',
          label: 'Приміщення №1',
          area: 86,
          tenant: 'Оксана Левченко',
          rent: 43000,
          marketRent: 45000,
          leaseUntil: '2026-10-01',
        },
        {
          id: 'tro-2',
          label: 'Приміщення №2',
          area: 64,
          tenant: null,
          rent: null,
          marketRent: 32000,
          leaseUntil: null,
        },
        {
          id: 'tro-3',
          label: 'Виробничий блок',
          area: 150,
          tenant: null,
          rent: null,
          marketRent: 60000,
          leaseUntil: null,
        },
      ],
    },
  ],
}
