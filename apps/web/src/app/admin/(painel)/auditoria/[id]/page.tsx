import { PageHeader } from '@/components/admin/page-header'
import { Panel } from '@/components/ui/card'
import { api } from '@/lib/api'
import { AUDIT_ACTIONS, AUDIT_RESOURCES } from '@/lib/audit'
import { formatDateTime } from '@/lib/format'
import { parseId } from '@/lib/params'

export default async function AuditDetailPage({ params }: PageProps<'/admin/auditoria/[id]'>) {
  const log = await api.auditLog(parseId((await params).id))
  return (
    <>
      <PageHeader
        title="Detalhe da auditoria"
        back={{ href: '/admin/auditoria', label: 'Auditoria' }}
      />
      <Panel>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-[12px] font-bold text-muted uppercase">Quando</dt>
            <dd>{formatDateTime(log.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-[12px] font-bold text-muted uppercase">Responsável</dt>
            <dd>
              {log.actorName ?? 'Nome indisponível'} · {log.actorEmail}
            </dd>
          </div>
          <div>
            <dt className="text-[12px] font-bold text-muted uppercase">Ação</dt>
            <dd>{AUDIT_ACTIONS[log.action]}</dd>
          </div>
          <div>
            <dt className="text-[12px] font-bold text-muted uppercase">Recurso</dt>
            <dd>
              {AUDIT_RESOURCES[log.resourceType]} · {log.resourceName ?? `#${log.resourceId}`}
            </dd>
          </div>
        </dl>
      </Panel>
      <Panel>
        <h2 className="font-display font-extrabold">Alterações registradas</h2>
        {Object.keys(log.details).length ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            {Object.entries(log.details).map(([key, value]) => (
              <div key={key}>
                <dt className="text-[12px] font-bold text-muted">{key}</dt>
                <dd className="break-words">{String(value ?? '—')}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-muted">Este registro não possui detalhes adicionais.</p>
        )}
      </Panel>
    </>
  )
}
