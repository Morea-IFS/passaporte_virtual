import { AdministratorForm } from '@/components/admin/administrator-form'
import { PageHeader } from '@/components/admin/page-header'
import { api } from '@/lib/api'
import { parseId } from '@/lib/params'

export default async function EditAdministratorPage({
  params,
}: PageProps<'/admin/administradores/[id]/editar'>) {
  const administrator = await api.administrator(parseId((await params).id))
  return (
    <>
      <PageHeader
        title="Editar administrador"
        back={{ href: '/admin/administradores', label: 'Administradores' }}
      />
      <AdministratorForm administrator={administrator} />
    </>
  )
}
