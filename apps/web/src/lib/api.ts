import 'server-only'
import { notFound, redirect } from 'next/navigation'
import { adminSession, visitorSession } from '@/lib/session'
import { hrefWith } from '@/lib/url'
import type {
  Checkpoint,
  CheckpointCategory,
  ImportPreview,
  Organizer,
  Page,
  PassportEvent,
  Passport,
  PublicCheckpoint,
  PublicEvent,
  CheckinResult,
  VisitorAccount,
  Administrator,
  AuditLog,
  AuditOptions,
  Participant,
  ParticipantCheckin,
} from '@/lib/types'

/**
 * URL da API vista pelo servidor do Next. No Docker é http://api:3333
 * (rede do compose); fora dele, localhost.
 */
const API_URL = process.env.API_URL ?? 'http://localhost:3333'

type ApiErrorBody = { errors?: { field?: string; message: string }[] }

export class ApiValidationError extends Error {
  constructor(
    readonly status: number,
    readonly fieldErrors: Record<string, string>,
    readonly messages: string[]
  ) {
    super(messages[0] ?? 'Erro de validação')
  }
}

/** Visitante sem passaporte válido neste dispositivo (API respondeu 401) */
export class VisitorUnauthorizedError extends Error {}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  json?: unknown
  form?: FormData
  /**
   * admin (padrão): token do organizador, 401 → login do painel.
   * visitor: token do passaporte, 401 → VisitorUnauthorizedError.
   * none: rota pública.
   */
  auth?: 'admin' | 'visitor' | 'none'
  /** Token do visitante já conhecido (ex.: recém-criado, antes do cookie valer) */
  visitorToken?: string
}

/** Faz a chamada e trata 401/404/validação; devolve a resposta crua */
async function call(path: string, options: RequestOptions = {}): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' }

  const auth = options.auth ?? 'admin'
  if (auth === 'admin') {
    const token = await adminSession.get()
    if (!token) redirect('/admin/login')
    headers.Authorization = `Bearer ${token}`
  } else if (auth === 'visitor') {
    const token = options.visitorToken ?? (await visitorSession.get())
    if (!token) throw new VisitorUnauthorizedError()
    headers['X-Visitor-Token'] = token
  }

  let body: BodyInit | undefined
  if (options.form) {
    body = options.form
  } else if (options.json !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.json)
  }

  const response = await fetch(`${API_URL}/api/v1${path}`, {
    method: options.method ?? 'GET',
    headers,
    body,
    cache: 'no-store',
  })

  if (response.status === 401 && auth === 'admin') redirect('/admin/sair')
  if (response.status === 401 && auth === 'visitor') throw new VisitorUnauthorizedError()
  if (response.status === 404) notFound()

  if (response.status === 400 || response.status === 422) {
    const { errors = [] } = (await response.json()) as ApiErrorBody
    const fieldErrors: Record<string, string> = {}
    for (const error of errors) {
      if (error.field && !fieldErrors[error.field]) fieldErrors[error.field] = error.message
    }
    throw new ApiValidationError(
      response.status,
      fieldErrors,
      errors.map((error) => error.message)
    )
  }

  if (!response.ok) {
    throw new Error(`API respondeu ${response.status} em ${path}`)
  }

  return response
}

async function send(path: string, options: RequestOptions = {}): Promise<unknown> {
  const response = await call(path, options)
  if (response.status === 204) return undefined
  return response.json()
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const body = (await send(path, options)) as { data: T } | undefined
  return body?.data as T
}

/** Lista paginada: { data, metadata } da API */
async function requestPage<T>(path: string): Promise<Page<T>> {
  const { data, metadata } = (await send(path)) as { data: T[]; metadata: Page<T>['metadata'] }
  return { data, metadata }
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: Organizer }>('/auth/login', {
      method: 'POST',
      json: { email, password },
      auth: 'none',
    }),
  logout: () => request<void>('/account/logout', { method: 'POST' }),
  profile: () => request<Organizer>('/account/profile'),

  administrators: (filters: Record<string, string | number | undefined> = {}) =>
    requestPage<Administrator>(hrefWith('/admin/administrators', filters)),
  administrator: (id: number) => request<Administrator>(`/admin/administrators/${id}`),
  createAdministrator: (payload: unknown) =>
    request<Administrator>('/admin/administrators', { method: 'POST', json: payload }),
  updateAdministrator: (id: number, payload: unknown) =>
    request<Administrator>(`/admin/administrators/${id}`, { method: 'PUT', json: payload }),
  setAdministratorStatus: (id: number, isActive: boolean) =>
    request<Administrator>(`/admin/administrators/${id}/status`, {
      method: 'PATCH',
      json: { isActive },
    }),
  deleteAdministrator: (id: number) =>
    request<void>(`/admin/administrators/${id}`, { method: 'DELETE' }),

  auditLogs: (filters: Record<string, string | number | undefined> = {}) =>
    requestPage<AuditLog>(hrefWith('/admin/audit-logs', filters)),
  auditLog: (id: number) => request<AuditLog>(`/admin/audit-logs/${id}`),
  auditOptions: () => request<AuditOptions>('/admin/audit-logs/options'),
  trackActivity: (action: 'view' | 'download', path: string) =>
    send('/admin/audit-logs/track', { method: 'POST', json: { action, path } }),

  participants: (filters: Record<string, string | number | undefined> = {}) =>
    requestPage<Participant>(hrefWith('/admin/participants', filters)),
  participant: (id: number) => request<Participant>(`/admin/participants/${id}`),
  participantCheckins: (id: number, filters: { eventId?: string; page?: number } = {}) =>
    requestPage<ParticipantCheckin>(hrefWith(`/admin/participants/${id}/checkins`, filters)),

  events: (page = 1) => requestPage<PassportEvent>(hrefWith('/admin/events', { page })),
  event: (id: number) => request<PassportEvent>(`/admin/events/${id}`),
  createEvent: (payload: unknown) =>
    request<PassportEvent>('/admin/events', { method: 'POST', json: payload }),
  updateEvent: (id: number, payload: unknown) =>
    request<PassportEvent>(`/admin/events/${id}`, { method: 'PUT', json: payload }),
  deleteEvent: (id: number) => request<void>(`/admin/events/${id}`, { method: 'DELETE' }),

  /** Lista completa (seletores e filtros) */
  categories: (eventId: number) =>
    request<CheckpointCategory[]>(`/admin/events/${eventId}/categories`),
  categoriesPage: (eventId: number, page = 1) =>
    requestPage<CheckpointCategory>(hrefWith(`/admin/events/${eventId}/categories`, { page })),
  createCategory: (eventId: number, name: string) =>
    request<CheckpointCategory>(`/admin/events/${eventId}/categories`, {
      method: 'POST',
      json: { name },
    }),
  updateCategory: (id: number, name: string) =>
    request<CheckpointCategory>(`/admin/categories/${id}`, { method: 'PUT', json: { name } }),
  deleteCategory: (id: number, moveToCategoryId?: number) =>
    request<void>(`/admin/categories/${id}`, {
      method: 'DELETE',
      json: moveToCategoryId ? { moveToCategoryId } : undefined,
    }),

  checkpoints: (eventId: number, filters: Record<string, string | number | undefined> = {}) =>
    requestPage<Checkpoint>(hrefWith(`/admin/events/${eventId}/checkpoints`, filters)),
  checkpoint: (id: number) => request<Checkpoint>(`/admin/checkpoints/${id}`),
  createCheckpoint: (eventId: number, form: FormData) =>
    request<Checkpoint>(`/admin/events/${eventId}/checkpoints`, { method: 'POST', form }),
  updateCheckpoint: (id: number, form: FormData) =>
    request<Checkpoint>(`/admin/checkpoints/${id}`, { method: 'PUT', form }),
  /** PDF dos QR codes (resposta crua, para repassar ao navegador) */
  qrCodesPdf: (eventId: number, params: Record<string, string | undefined>) =>
    call(hrefWith(`/admin/events/${eventId}/qrcodes`, params)),
  publicEvents: () => request<PublicEvent[]>('/public/events', { auth: 'none' }),
  visitorPassports: () =>
    request<{ nickname: string; passports: { slug: string; visited: number }[] }>(
      '/visitor/passports',
      { auth: 'visitor' }
    ),
  publicEvent: (slug: string) =>
    request<Passport>(`/public/events/${encodeURIComponent(slug)}`, { auth: 'none' }),

  /* ---------- Visitante ---------- */
  nicknameAvailable: (nickname: string) =>
    request<{ available: boolean }>(hrefWith('/visitor/nickname', { nickname }), { auth: 'none' }),
  registerVisitor: (nickname: string) =>
    request<VisitorAccount & { token: string }>('/visitor', {
      method: 'POST',
      json: { nickname },
      auth: 'none',
    }),
  recoverVisitor: (nickname: string, code: string) =>
    request<VisitorAccount & { token: string }>('/visitor/recover', {
      method: 'POST',
      json: { nickname, code },
      auth: 'none',
    }),
  visitorLogout: () => request<void>('/visitor/logout', { method: 'POST', auth: 'visitor' }),
  visitorMe: () => request<VisitorAccount>('/visitor/me', { auth: 'visitor' }),
  checkIn: (qrToken: string, visitorToken?: string) =>
    request<CheckinResult>('/visitor/checkins', {
      method: 'POST',
      json: { qrToken },
      auth: 'visitor',
      visitorToken,
    }),
  passport: (slug: string) =>
    request<Passport & { nickname: string }>(`/visitor/passports/${encodeURIComponent(slug)}`, {
      auth: 'visitor',
    }),

  publicCheckpoint: (token: string) =>
    request<PublicCheckpoint>(`/public/checkpoints/${encodeURIComponent(token)}`, {
      auth: 'none',
    }),

  setCheckpointStatus: (id: number, isActive: boolean) =>
    request<Checkpoint>(`/admin/checkpoints/${id}/status`, {
      method: 'PATCH',
      json: { isActive },
    }),
  deleteCheckpoint: (id: number) => request<void>(`/admin/checkpoints/${id}`, { method: 'DELETE' }),
  importCheckpoints: (eventId: number, form: FormData) =>
    request<ImportPreview>(`/admin/events/${eventId}/checkpoints/import`, {
      method: 'POST',
      form,
    }),
}
