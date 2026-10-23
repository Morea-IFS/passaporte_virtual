import { AdministratorForm } from '@/components/admin/administrator-form'
import { PageHeader } from '@/components/admin/page-header'

export default function NewAdministratorPage() {
  return (
    <>
      <PageHeader
        title="Novo administrador"
        back={{ href: '/admin/administradores', label: 'Administradores' }}
      />
      <AdministratorForm />
    </>
  )
}
