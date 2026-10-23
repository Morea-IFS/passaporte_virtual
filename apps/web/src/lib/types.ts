export type Organizer = {
  id: number
  fullName: string | null
  email: string
  initials: string
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
