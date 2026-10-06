import {
  Banknote,
  Briefcase,
  CalendarClock,
  FileText,
  Hash,
  LogIn,
  Mail,
  Pencil,
  Percent,
  Phone,
  PiggyBank,
  Plug,
  Search,
  StickyNote,
  TrendingUp,
  User,
  UserPlus,
  X,
} from 'lucide-react'
import type { Room } from '../mock'
import { date, uah } from '../format'

export type RequestType = 'RENT_OUT' | 'CHECK_DEMAND' | 'FIND_TENANT'

/**
 * Картка приміщення: що зараз, скільки платить орендар і скільки коштує ринок.
 * Деталі договору згорнуті за кнопкою — власнику щодня потрібні ставка й різниця,
 * а номер телефону та номер договору він відкриває, коли вже зібрався дзвонити.
 */
export default function RoomDetails({
  room,
  sent,
  expanded,
  onToggleExpanded,
  onRequest,
  onClose,
  onEdit,
}: {
  room: Room
  sent: Array<RequestType>
  expanded: boolean
  onToggleExpanded: () => void
  onRequest: (type: RequestType) => void
  onClose?: () => void
  /** Лише в режимі адміна: власник дані не править, їх веде CRM */
  onEdit?: () => void
}) {
  const d = room.details ?? {}
  const unknown = room.tenant === null && room.marketRent === null
  const vacant = room.tenant === null && !unknown
  const gap =
    room.rent !== null && room.marketRent !== null
      ? room.marketRent - room.rent
      : 0

  return (
    <div className="rounded-2xl border border-border bg-surface">
      <div className="flex items-start justify-between gap-3 border-b border-border p-4">
        <div className="min-w-0">
          <div className="text-lg font-semibold">{room.label}</div>
          <div className="mt-0.5 text-sm text-muted">{room.area} м²</div>
        </div>
        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              onClick={onEdit}
              title="Редагувати орендаря"
              className="rounded-lg p-2 text-muted transition-colors hover:text-foreground"
            >
              <Pencil size={16} />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-muted transition-colors hover:text-foreground lg:hidden"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4 p-4">
        {unknown ? (
          <div className="rounded-xl border border-border bg-surface-2 p-3">
            <div className="text-[11px] font-bold uppercase tracking-widest text-muted">
              Немає даних
            </div>
            <div className="mt-1 text-sm text-muted">
              Приміщення є на плані БТІ. Орендаря й ставку заповнимо, коли
              надійде договір.
            </div>
            {onEdit && (
              <button
                onClick={onEdit}
                className="mt-3 w-full rounded-xl bg-accent py-2.5 text-sm font-bold text-white"
              >
                Внести орендаря
              </button>
            )}
          </div>
        ) : vacant ? (
          <div className="rounded-xl border border-vacant/30 bg-vacant/10 p-3">
            <div className="text-[11px] font-bold uppercase tracking-widest text-vacant">
              Вільно
            </div>
            <div className="mt-1 text-xl font-bold text-vacant">
              {uah(room.marketRent!)} грн
            </div>
            <div className="text-xs text-muted">орієнтовна ставка, грн/міс</div>
          </div>
        ) : (
          <>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted">
                Орендар
              </div>
              <div className="mt-1 font-semibold">{room.tenant}</div>
            </div>

            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted">
                  Сплачує
                </div>
                <div className="mt-1 text-2xl font-bold">
                  {room.rent === null ? '—' : uah(room.rent)}
                </div>
                <div className="text-xs text-muted">
                  грн/міс
                  {room.rent !== null &&
                    ` · ${uah(Math.round(room.rent / room.area))} грн/м²`}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider text-muted">
                  Актуальна ціна
                </div>
                <div
                  className={`mt-1 text-2xl font-bold ${gap > 0 ? 'text-gold' : ''}`}
                >
                  {room.marketRent === null ? '—' : uah(room.marketRent)}
                </div>
                <div className="text-xs text-muted">грн/міс</div>
              </div>
            </div>

            {gap > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/10 px-3 py-2.5">
                <TrendingUp size={16} className="shrink-0 text-gold" />
                <div className="text-sm">
                  <span className="font-bold text-gold">+{uah(gap)} грн/міс</span>
                  <span className="text-muted"> недоотримано проти ринку</span>
                </div>
              </div>
            )}

            <button
              onClick={onToggleExpanded}
              className="w-full rounded-xl border border-border py-2.5 text-sm font-semibold text-muted transition-colors active:bg-surface-2"
            >
              {expanded ? 'Згорнути' : 'Детальніше'}
            </button>

            {expanded && (
              <div className="space-y-3 rounded-xl bg-surface-2 p-3">
                {/* Порожні поля не показуємо: рядок «Email —» лише шумить */}
                <Row icon={<Hash size={14} />} label="ЄДРПОУ / ІПН" value={d.taxId} />
                <Row icon={<Briefcase size={14} />} label="Діяльність" value={d.activity} />
                <Row icon={<User size={14} />} label="Контактна особа" value={d.contactPerson} />
                {room.tenantPhone && (
                  <Row icon={<Phone size={14} />} label="Телефон">
                    <a
                      href={`tel:${room.tenantPhone.replace(/\s/g, '')}`}
                      className="font-medium text-foreground"
                    >
                      {room.tenantPhone}
                    </a>
                  </Row>
                )}
                {d.email && (
                  <Row icon={<Mail size={14} />} label="Email">
                    <a href={`mailto:${d.email}`} className="font-medium text-foreground">
                      {d.email}
                    </a>
                  </Row>
                )}

                <Divider />
                <Row
                  icon={<Banknote size={14} />}
                  label="День оплати"
                  value={d.paymentDay ? `до ${d.paymentDay} числа` : undefined}
                />
                <Row
                  icon={<PiggyBank size={14} />}
                  label="Депозит"
                  value={d.deposit !== undefined ? `${uah(d.deposit)} грн` : undefined}
                />
                <Row icon={<Percent size={14} />} label="Індексація" value={d.indexation} />
                <Row icon={<Plug size={14} />} label="Комунальні" value={d.utilities} />

                <Divider />
                <Row icon={<FileText size={14} />} label="Договір" value={room.contractNo ?? undefined} />
                <Row
                  icon={<FileText size={14} />}
                  label="Підписано"
                  value={d.contractSignedAt && date(d.contractSignedAt)}
                />
                <Row
                  icon={<LogIn size={14} />}
                  label="Заселення"
                  value={room.movedInAt ? date(room.movedInAt) : undefined}
                />
                {room.priceReviewAt && (
                  <Row icon={<CalendarClock size={14} />} label="Перегляд ціни">
                    <span className="font-semibold text-gold">{date(room.priceReviewAt)}</span>
                  </Row>
                )}
                <Row
                  icon={<CalendarClock size={14} />}
                  label="Договір до"
                  value={room.leaseUntil ? date(room.leaseUntil) : undefined}
                />

                {d.notes && (
                  <>
                    <Divider />
                    <div className="flex gap-2 text-sm">
                      <StickyNote size={14} className="mt-0.5 shrink-0 text-muted" />
                      <span className="whitespace-pre-wrap">{d.notes}</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        <div className="pt-1">
          {/* Немає орендаря — немає сенсу питати про попит чи шукати заміну */}
          {vacant || unknown ? (
            <Action
              primary
              done={sent.includes('RENT_OUT')}
              doneLabel="Заявку надіслано"
              icon={<Search size={15} />}
              label="Здати об'єкт"
              onClick={() => onRequest('RENT_OUT')}
            />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Action
                done={sent.includes('CHECK_DEMAND')}
                doneLabel="Перевіряємо"
                icon={<Search size={15} />}
                label="Дізнатись попит"
                onClick={() => onRequest('CHECK_DEMAND')}
              />
              <Action
                done={sent.includes('FIND_TENANT')}
                doneLabel="Шукаємо"
                icon={<UserPlus size={15} />}
                label="Знайти орендаря"
                onClick={() => onRequest('FIND_TENANT')}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({
  icon,
  label,
  value,
  children,
}: {
  icon: React.ReactNode
  label: string
  value?: string
  children?: React.ReactNode
}) {
  const content = children ?? value
  if (content === undefined || content === null || content === '') return null
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-2 text-muted">
        {icon}
        {label}
      </span>
      <span className="text-right">{content}</span>
    </div>
  )
}

function Divider() {
  return <div className="border-t border-border/60" />
}

function Action({
  label,
  doneLabel,
  icon,
  done,
  primary,
  onClick,
}: {
  label: string
  doneLabel: string
  icon: React.ReactNode
  done: boolean
  primary?: boolean
  onClick: () => void
}) {
  if (done) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-occupied/40 bg-occupied/10 py-3 text-sm font-semibold text-occupied">
        {doneLabel}
      </div>
    )
  }

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-transform active:scale-95 ${
        primary
          ? 'bg-accent text-white shadow-[0_0_24px_-6px_var(--color-accent)]'
          : 'border border-border bg-surface-2 text-foreground'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
