import type { AuditAction, AuditResource } from '@/lib/types'

export const AUDIT_ACTIONS: Record<AuditAction, string> = {
  create: 'Criação',
  update: 'Edição',
  activate: 'Ativação',
  deactivate: 'Desativação',
  delete: 'Remoção',
  import: 'Importação',
}

export const AUDIT_RESOURCES: Record<AuditResource, string> = {
  administrator: 'Administrador',
  event: 'Evento',
  checkpoint: 'Ponto',
  category: 'Categoria',
}
