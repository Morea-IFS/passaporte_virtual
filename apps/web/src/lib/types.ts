export type Organizer = {
  id: number
  fullName: string | null
  email: string
  initials: string
  isActive: boolean
  deletedAt: string | null
  createdAt: string
  updatedAt: string | null
}

export type Administrator = Organizer

export type AuditAction = 'create' | 'update' | 'activate' | 'deactivate' | 'delete' | 'import'
export type AuditResource = 'administrator' | 'event' | 'checkpoint' | 'category'
export type AuditLog = {
  id: number
  actorUserId: number | null
  actorName: string | null
  actorEmail: string
  action: AuditAction
  resourceType: AuditResource
  resourceId: string | null
  resourceName: string | null
  eventId: number | null
  details: Record<string, string | number | boolean | null>
  createdAt: string
}

export type AuditOptions = {
  administrators: Administrator[]
  events: { id: number; name: string }[]
}

export type ParticipantEvent = {
  id: number
  name: string
  slug: string
  visited: number
  total: number
  checkpoints?: { id: number; code: string; name: string; visitedAt: string }[]
}

export type Participant = {
  id: number
  nickname: string
  totalCheckins: number
  lastActivity: string | null
  createdAt: string
  events: ParticipantEvent[]
}

export type PassportEvent = {
  id: number
  name: string
  slug: string
  startsOn: string
  endsOn: string
  location: string | null
  hashtag: string | null
  description: string | null
  checkpointsCount: number
  activeCheckpointsCount: number
}

export type CheckpointCategory = {
  id: number
  eventId: number
  name: string
  color: string
  position: number
  checkpointsCount: number
}

export type Checkpoint = {
  id: number
  eventId: number
  code: string
  qrToken: string
  name: string
  categoryId: number
  category: CheckpointCategory
  summary: string | null
  location: string | null
  imageUrl: string | null
  logoUrl: string | null
  isActive: boolean
  /** Link do QR code */
  checkinUrl: string
}

/** Ponto como aparece na página pública aberta pelo QR code */
export type PublicCheckpoint = Pick<
  Checkpoint,
  'name' | 'code' | 'summary' | 'location' | 'imageUrl' | 'logoUrl' | 'isActive'
> & {
  category: Pick<CheckpointCategory, 'name' | 'color'>
  event: Pick<PassportEvent, 'name' | 'slug' | 'hashtag' | 'startsOn' | 'endsOn' | 'location'>
}

export type ImportPreview = {
  rows: {
    line: number
    name: string
    category: Pick<CheckpointCategory, 'id' | 'name' | 'color'>
    summary: string | null
    location: string | null
  }[]
  errors: { line: number; messages: string[] }[]
  created: number
}

/**
 * Estado devolvido pelas Server Actions de formulário.
 */
export type FormState = {
  error?: string
  fieldErrors?: Record<string, string>
  values?: Record<string, string>
  /** Muda a cada envio com erro; usado como key para limpar campos de arquivo */
  attempt?: number
}

/** Resposta paginada da API */
export type Page<T> = {
  data: T[]
  metadata: {
    total: number
    perPage: number
    currentPage: number
    lastPage: number
  }
}

/* ---------- Visitante ---------- */

/** Evento na home do passaporte */
export type PublicEvent = Pick<
  PassportEvent,
  'name' | 'slug' | 'hashtag' | 'location' | 'startsOn' | 'endsOn' | 'checkpointsCount'
> & { ended: boolean }

export type VisitorAccount = { nickname: string; recoveryCode: string }

export type PassportProgress = { visited: number; total: number }

export type PassportCheckpoint = {
  code: string
  qrToken: string
  name: string
  location: string | null
  imageUrl: string | null
  logoUrl: string | null
  isActive: boolean
  categoryId: number
  category: Pick<CheckpointCategory, 'name' | 'color'>
  /** Data do carimbo (ISO) ou null se ainda não visitou */
  visitedAt: string | null
}

export type Passport = {
  event: Pick<PassportEvent, 'name' | 'slug' | 'hashtag' | 'location' | 'startsOn' | 'endsOn'>
  progress: PassportProgress
  categories: Pick<CheckpointCategory, 'id' | 'name' | 'color'>[]
  checkpoints: PassportCheckpoint[]
}

export type CheckinResult = {
  alreadyCheckedIn: boolean
  checkedInAt: string
  nickname: string
  progress: PassportProgress
  event: { slug: string; name: string }
}
