import Link from 'next/link'
import { PageHeader } from '@/components/admin/page-header'
import { Pagination } from '@/components/admin/pagination'
import { Card, Panel } from '@/components/ui/card'
import { buttonClass } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/feedback'
import { inputClass } from '@/components/ui/field'
import { SelectField } from '@/components/ui/select-field'
import { api } from '@/lib/api'
import {
  AUDIT_ACTION_OPTIONS,
  AUDIT_ACTIONS as actions,
  AUDIT_RESOURCE_OPTIONS,
  AUDIT_RESOURCES as resources,
} from '@/lib/audit'
import { formatDateTime } from '@/lib/format'
import { parsePage } from '@/lib/params'
import { firstParam, hrefWith } from '@/lib/url'

export default async function AuditPage({ searchParams }: PageProps<'/admin/auditoria'>) {
  const params = await searchParams
  const filters = {
    q: firstParam(params.q),
    actorId: firstParam(params.actorId),
    action: firstParam(params.action),
    resourceType: firstParam(params.resourceType),
    eventId: firstParam(params.eventId),
    from: firstParam(params.from),
    to: firstParam(params.to),
    page: parsePage(params.pagina),
  }
  const [{ data: logs, metadata }, options] = await Promise.all([
    api.auditLogs(filters),
    api.auditOptions(),
  ])
  return (
    <>
      <PageHeader
        title="Auditoria"
        description="Histórico imutável das ações realizadas no painel."
      />
      <Panel>
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            name="q"
            defaultValue={filters.q}
            className={inputClass('sm')}
            placeholder="Autor ou recurso"
            aria-label="Buscar"
          />
          <SelectField
            name="actorId"
            label="Administrador"
            size="sm"
            defaultValue={filters.actorId}
            options={[
              { value: '', label: 'Todos os administradores' },
              ...options.administrators.map((item) => ({
                value: String(item.id),
                label: item.fullName ?? item.email,
              })),
            ]}
          />
          <SelectField
            name="action"
            label="Ação"
            size="sm"
            defaultValue={filters.action}
            options={[{ value: '', label: 'Todas as ações' }, ...AUDIT_ACTION_OPTIONS]}
          />
          <SelectField
            name="resourceType"
            label="Recurso"
            size="sm"
            defaultValue={filters.resourceType}
            options={[{ value: '', label: 'Todos os recursos' }, ...AUDIT_RESOURCE_OPTIONS]}
          />
          <SelectField
            name="eventId"
            label="Evento"
            size="sm"
            defaultValue={filters.eventId}
            options={[
              { value: '', label: 'Todos os eventos' },
              ...options.events.map((event) => ({ value: String(event.id), label: event.name })),
            ]}
          />
          <input
            type="date"
            name="from"
            defaultValue={filters.from}
            className={inputClass('sm')}
            aria-label="Data inicial"
          />
          <input
            type="date"
            name="to"
            defaultValue={filters.to}
            className={inputClass('sm')}
            aria-label="Data final"
          />
          <button className={buttonClass('ghost', { size: 'sm' })}>Filtrar</button>
        </form>
      </Panel>
      {logs.length === 0 ? (
        <EmptyState title="Nenhum registro encontrado" />
      ) : (
        <ul className="grid gap-3">
          {logs.map((log) => (
            <Card key={log.id}>
              <Link
                href={`/admin/auditoria/${log.id}`}
                className="grid gap-2 p-4 sm:grid-cols-[150px_1fr_auto] sm:items-center"
              >
                <div>
                  <p className="font-display text-[13px] font-bold">{actions[log.action]}</p>
                  <p className="text-[12px] text-muted">{resources[log.resourceType]}</p>
                </div>
                <div>
                  <p className="font-semibold">{log.resourceName ?? `#${log.resourceId}`}</p>
                  <p className="text-[13px] text-muted">{log.actorName ?? log.actorEmail}</p>
                </div>
                <time className="text-[12px] text-muted" dateTime={log.createdAt}>
                  {formatDateTime(log.createdAt)}
                </time>
              </Link>
            </Card>
          ))}
        </ul>
      )}
      <Pagination
        metadata={metadata}
        label="Páginas de auditoria"
        hrefFor={(target) =>
          hrefWith('/admin/auditoria', {
            pagina: target > 1 ? target : undefined,
            ...Object.fromEntries(Object.entries(filters).filter(([key]) => key !== 'page')),
          })
        }
      />
    </>
  )
}
