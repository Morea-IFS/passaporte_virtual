'use client'

import Link from 'next/link'
import { removeAdministrator, setAdministratorStatus } from '@/app/admin/actions'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { quietButtonClass } from '@/components/ui/button'
import type { Administrator } from '@/lib/types'

export function AdministratorActions({
  administrator,
  currentUserId,
}: {
  administrator: Administrator
  currentUserId: number
}) {
  const ownAccount = administrator.id === currentUserId
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Link
        href={`/admin/administradores/${administrator.id}/editar`}
        className={quietButtonClass()}
      >
        Editar
      </Link>
      {!ownAccount ? (
        <>
          <ConfirmDialog
            trigger={administrator.isActive ? 'Desativar' : 'Ativar'}
            triggerClassName={quietButtonClass(administrator.isActive ? 'danger' : 'muted')}
            title={`${administrator.isActive ? 'Desativar' : 'Ativar'} administrador?`}
            description={
              administrator.isActive
                ? 'Os tokens desta conta serão invalidados imediatamente.'
                : 'A conta voltará a poder entrar no painel.'
            }
            confirmLabel={administrator.isActive ? 'Desativar' : 'Ativar'}
            pendingLabel="Salvando..."
            onConfirm={() => setAdministratorStatus(administrator.id, !administrator.isActive)}
          />
          <ConfirmDialog
            trigger="Remover"
            triggerClassName={quietButtonClass('danger')}
            title="Remover administrador?"
            description="A conta será removida logicamente e perderá o acesso."
            confirmLabel="Remover"
            pendingLabel="Removendo..."
            onConfirm={() => removeAdministrator(administrator.id)}
          />
        </>
      ) : (
        <span className="px-2 text-[13px] text-muted">Sua conta</span>
      )}
    </div>
  )
}
