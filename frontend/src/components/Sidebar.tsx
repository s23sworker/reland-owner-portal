import { Building2, ChevronDown, Crown, Warehouse } from 'lucide-react'
import type { Site } from '../mock'
import { OWNER } from '../mock'

/**
 * Лівий сайдбар: бази → об'єкти всередині бази.
 * На вузькому екрані (Telegram на телефоні) виїжджає як шухляда — див. App.
 */
export default function Sidebar({
  activeSiteId,
  activeBuildingId,
  onSelect,
}: {
  activeSiteId: string
  activeBuildingId: string
  onSelect: (siteId: string, buildingId: string) => void
}) {
  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-3 border-b border-border p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/40 bg-gold/10 text-gold">
          <Crown size={18} />
        </div>
        <div className="min-w-0">
          <div className="truncate font-semibold">{OWNER.name}</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-gold">
            Prime
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        {OWNER.sites.map((site) => (
          <SiteGroup
            key={site.id}
            site={site}
            expanded={site.id === activeSiteId}
            activeBuildingId={activeBuildingId}
            onSelect={onSelect}
          />
        ))}
      </nav>
    </aside>
  )
}

function SiteGroup({
  site,
  expanded,
  activeBuildingId,
  onSelect,
}: {
  site: Site
  expanded: boolean
  activeBuildingId: string
  onSelect: (siteId: string, buildingId: string) => void
}) {
  const vacant = site.buildings
    .flatMap((b) => b.floors)
    .flatMap((f) => f.rooms)
    .filter((r) => r.tenant === null).length

  return (
    <div className="mb-1">
      <button
        onClick={() => onSelect(site.id, site.buildings[0].id)}
        className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
          expanded ? 'text-foreground' : 'text-muted hover:text-foreground'
        }`}
      >
        <ChevronDown
          size={14}
          className={`shrink-0 transition-transform ${expanded ? '' : '-rotate-90'}`}
        />
        <span className="flex-1 truncate">{site.name}</span>
        {vacant > 0 && (
          <span className="rounded-md bg-vacant/20 px-1.5 py-0.5 text-[10px] font-bold text-vacant">
            {vacant}
          </span>
        )}
      </button>

      {expanded && (
        <div className="ml-3 space-y-1 border-l border-border pl-2">
          {site.buildings.map((b) => {
            const active = b.id === activeBuildingId
            const freeHere = b.floors
              .flatMap((f) => f.rooms)
              .filter((r) => r.tenant === null).length
            return (
              <button
                key={b.id}
                onClick={() => onSelect(site.id, b.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  active
                    ? 'bg-accent/15 text-foreground'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                {b.kind === 'office' ? (
                  <Building2 size={14} className="shrink-0" />
                ) : (
                  <Warehouse size={14} className="shrink-0" />
                )}
                <span className="flex-1 truncate">{b.label}</span>
                {freeHere > 0 && (
                  <span className="text-[10px] font-bold text-vacant">
                    {freeHere}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
