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

/** Opções dos filtros (SelectField) */
export const AUDIT_ACTION_OPTIONS = Object.entries(AUDIT_ACTIONS).map(([value, label]) => ({
  value,
  label,
}))
export const AUDIT_RESOURCE_OPTIONS = Object.entries(AUDIT_RESOURCES).map(([value, label]) => ({
  value,
  label,
}))
