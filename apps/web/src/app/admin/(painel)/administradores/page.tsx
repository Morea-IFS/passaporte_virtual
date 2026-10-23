import Link from 'next/link'
import { AdministratorActions } from '@/components/admin/administrator-actions'
import { PageHeader } from '@/components/admin/page-header'
import { Pagination } from '@/components/admin/pagination'
import { Card, CardFooter, Panel } from '@/components/ui/card'
import { buttonClass } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/feedback'
import { inputClass } from '@/components/ui/field'
import { SelectField } from '@/components/ui/select-field'
import { api } from '@/lib/api'
import { parsePage } from '@/lib/params'
import { firstParam, hrefWith } from '@/lib/url'

export default async function AdministratorsPage({
  searchParams,
}: PageProps<'/admin/administradores'>) {
  const params = await searchParams
  const page = parsePage(params.pagina)
  const q = firstParam(params.q)
  const status = firstParam(params.status)
  const [{ data: administrators, metadata }, profile] = await Promise.all([
    api.administrators({ page, q, status }),
    api.profile(),
  ])
  const link = (target: number) =>
    hrefWith('/admin/administradores', {
      pagina: target > 1 ? target : undefined,
      q,
      status,
    })
  return (
    <>
      <PageHeader
        title="Administradores"
        description="Contas com acesso à organização do sistema."
        actions={
          <Link href="/admin/administradores/novo" className={buttonClass()}>
            Novo administrador
          </Link>
        }
      />
      <Panel>
        <form className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
          <input
            name="q"
            defaultValue={q}
            className={inputClass('sm')}
            placeholder="Nome ou e-mail"
            aria-label="Buscar"
          />
          <SelectField
            name="status"
            label="Situação"
            size="sm"
            defaultValue={status}
            options={[
              { value: '', label: 'Todas as situações' },
              { value: 'active', label: 'Ativos' },
              { value: 'inactive', label: 'Desativados' },
            ]}
          />
          <button className={buttonClass('ghost', { size: 'sm' })}>Filtrar</button>
        </form>
      </Panel>
      {administrators.length === 0 ? (
        <EmptyState title="Nenhum administrador encontrado" />
      ) : (
        <ul className="grid gap-3">
          {administrators.map((administrator) => (
            <Card key={administrator.id} interactive={false}>
              <div className="flex items-start justify-between gap-4 p-4">
                <div>
                  <h2 className="font-display font-extrabold">{administrator.fullName}</h2>
                  <p className="text-[14px] text-muted">{administrator.email}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[12px] font-bold ${administrator.isActive ? 'bg-verde/15 text-verde' : 'bg-surface-2 text-muted'}`}
                >
                  {administrator.isActive ? 'Ativo' : 'Desativado'}
                </span>
              </div>
              <CardFooter align="end">
                <AdministratorActions administrator={administrator} currentUserId={profile.id} />
              </CardFooter>
            </Card>
          ))}
        </ul>
      )}
      <Pagination metadata={metadata} label="Páginas de administradores" hrefFor={link} />
    </>
  )
}
