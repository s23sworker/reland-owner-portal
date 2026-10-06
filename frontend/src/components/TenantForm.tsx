import { useState } from 'react'
import { X } from 'lucide-react'
import type { Room } from '../mock'
import type { TenantRecord } from '../tenants'

/**
 * Заповнення орендаря приміщення — усе, що зазвичай є в договорі оренди.
 *
 * Обов'язкова лише назва орендаря: решту часто збирають поступово, і форма,
 * яка не дає зберегти без ЄДРПОУ, призводить до того, що не зберігають нічого.
 */
export default function TenantForm({
  room,
  onSave,
  onClear,
  onClose,
}: {
  room: Room
  onSave: (record: TenantRecord) => void
  onClear: () => void
  onClose: () => void
}) {
  const d = room.details ?? {}
  const [v, setV] = useState({
    tenant: room.tenant ?? '',
    taxId: d.taxId ?? '',
    activity: d.activity ?? '',
    contactPerson: d.contactPerson ?? '',
    tenantPhone: room.tenantPhone ?? '',
    email: d.email ?? '',
    rent: room.rent?.toString() ?? '',
    paymentDay: d.paymentDay?.toString() ?? '',
    deposit: d.deposit?.toString() ?? '',
    contractNo: room.contractNo ?? '',
    contractSignedAt: d.contractSignedAt ?? '',
    movedInAt: room.movedInAt ?? '',
    priceReviewAt: room.priceReviewAt ?? '',
    leaseUntil: room.leaseUntil ?? '',
    indexation: d.indexation ?? '',
    utilities: d.utilities ?? '',
    notes: d.notes ?? '',
  })
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof typeof v) => (value: string) =>
    setV((prev) => ({ ...prev, [key]: value }))

  const num = (s: string) => (s.trim() === '' ? undefined : Number(s.replace(',', '.')))
  const text = (s: string) => (s.trim() === '' ? undefined : s.trim())

  const submit = () => {
    if (!v.tenant.trim()) {
      setError('Вкажіть назву орендаря — без неї приміщення лишиться «без даних»')
      return
    }
    const rent = num(v.rent)
    if (rent !== undefined && (Number.isNaN(rent) || rent < 0)) {
      setError('Ставка має бути числом, наприклад 85000')
      return
    }
    const paymentDay = num(v.paymentDay)
    if (
      paymentDay !== undefined &&
      (!Number.isInteger(paymentDay) || paymentDay < 1 || paymentDay > 31)
    ) {
      setError('День оплати — число від 1 до 31')
      return
    }
    const deposit = num(v.deposit)
    if (deposit !== undefined && Number.isNaN(deposit)) {
      setError('Депозит має бути числом')
      return
    }

    onSave({
      tenant: v.tenant.trim(),
      tenantPhone: text(v.tenantPhone) ?? null,
      rent: rent ?? null,
      contractNo: text(v.contractNo) ?? null,
      movedInAt: text(v.movedInAt) ?? null,
      priceReviewAt: text(v.priceReviewAt) ?? null,
      leaseUntil: text(v.leaseUntil) ?? null,
      details: {
        taxId: text(v.taxId),
        activity: text(v.activity),
        contactPerson: text(v.contactPerson),
        email: text(v.email),
        paymentDay,
        deposit,
        contractSignedAt: text(v.contractSignedAt),
        indexation: text(v.indexation),
        utilities: text(v.utilities),
        notes: text(v.notes),
      },
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        aria-label="Закрити"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div className="relative flex max-h-[92%] w-full max-w-[640px] flex-col rounded-t-3xl border border-border bg-surface sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div>
            <div className="text-lg font-semibold">
              Приміщення {room.label} · {room.area} м²
            </div>
            <div className="mt-0.5 text-sm text-muted">Дані орендаря з договору</div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto p-5">
          <Section title="Орендар">
            <Field label="Назва *" value={v.tenant} onChange={set('tenant')} placeholder="ТОВ «Склад-Сервіс» або ФОП Іваненко І.І." wide />
            <Field label="ЄДРПОУ / ІПН" value={v.taxId} onChange={set('taxId')} inputMode="numeric" />
            <Field label="Вид діяльності" value={v.activity} onChange={set('activity')} placeholder="склад, виробництво…" />
            <Field label="Контактна особа" value={v.contactPerson} onChange={set('contactPerson')} />
            <Field label="Телефон" value={v.tenantPhone} onChange={set('tenantPhone')} type="tel" placeholder="+380…" />
            <Field label="Email" value={v.email} onChange={set('email')} type="email" />
          </Section>

          <Section title="Гроші">
            <Field label="Ставка, грн/міс" value={v.rent} onChange={set('rent')} inputMode="decimal" />
            <Field label="День оплати" value={v.paymentDay} onChange={set('paymentDay')} inputMode="numeric" placeholder="1–31" />
            <Field label="Депозит, грн" value={v.deposit} onChange={set('deposit')} inputMode="decimal" />
            <Field label="Індексація" value={v.indexation} onChange={set('indexation')} placeholder="наприклад, +10% щороку" />
            <Field label="Комунальні" value={v.utilities} onChange={set('utilities')} placeholder="окремо за лічильниками / включено" wide />
          </Section>

          <Section title="Договір">
            <Field label="Номер договору" value={v.contractNo} onChange={set('contractNo')} />
            <Field label="Дата підписання" value={v.contractSignedAt} onChange={set('contractSignedAt')} type="date" />
            <Field label="Заселення" value={v.movedInAt} onChange={set('movedInAt')} type="date" />
            <Field label="Перегляд ставки з" value={v.priceReviewAt} onChange={set('priceReviewAt')} type="date" />
            <Field label="Договір діє до" value={v.leaseUntil} onChange={set('leaseUntil')} type="date" />
          </Section>

          <Section title="Нотатки">
            <label className="col-span-2 block">
              <textarea
                value={v.notes}
                onChange={(e) => set('notes')(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </label>
          </Section>

          {error && (
            <div className="rounded-xl border border-vacant/40 bg-vacant/10 px-3 py-2.5 text-sm text-vacant">
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border p-4">
          {room.tenant && (
            <button
              onClick={() => {
                if (window.confirm(`Звільнити приміщення ${room.label}? Дані орендаря буде видалено.`)) onClear()
              }}
              className="rounded-xl border border-vacant/40 px-4 py-3 text-sm font-semibold text-vacant"
            >
              Звільнити
            </button>
          )}
          <div className="flex-1" />
          <button onClick={onClose} className="rounded-xl border border-border px-5 py-3 text-sm font-semibold text-muted">
            Скасувати
          </button>
          <button onClick={submit} className="rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white">
            Зберегти
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted">{title}</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  inputMode,
  wide,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  inputMode?: 'text' | 'numeric' | 'decimal'
  wide?: boolean
}) {
  return (
    <label className={`block ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="mb-1 block text-xs text-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent"
      />
    </label>
  )
}
