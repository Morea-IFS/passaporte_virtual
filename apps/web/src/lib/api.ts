import 'server-only'
import { notFound, redirect } from 'next/navigation'
import { getToken } from '@/lib/session'
import { hrefWith } from '@/lib/url'
import type {
  Checkpoint,
  CheckpointCategory,
  ImportPreview,
  Organizer,
  Page,
  PassportEvent,
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

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  json?: unknown
  form?: FormData
  /** Rota pública: não envia token nem redireciona em 401 */
  anonymous?: boolean
}

async function send(path: string, options: RequestOptions = {}): Promise<unknown> {
  const headers: Record<string, string> = { Accept: 'application/json' }

  if (!options.anonymous) {
    const token = await getToken()
    if (!token) redirect('/admin/login')
    headers.Authorization = `Bearer ${token}`
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

  if (response.status === 401 && !options.anonymous) redirect('/admin/sair')
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
      anonymous: true,
    }),
  logout: () => request<void>('/account/logout', { method: 'POST' }),
  profile: () => request<Organizer>('/account/profile'),

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
