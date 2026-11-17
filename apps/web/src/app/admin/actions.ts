'use server'

import { refresh, revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { api, ApiValidationError } from '@/lib/api'
import { adminSession } from '@/lib/session'
import type { FormState, ImportPreview } from '@/lib/types'

function text(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function file(formData: FormData, key: string) {
  const value = formData.get(key)
  return value instanceof File && value.size > 0 ? value : null
}

function textValues(formData: FormData) {
  const values: Record<string, string> = {}
  formData.forEach((value, key) => {
    if (typeof value === 'string' && !key.startsWith('$')) values[key] = value
  })
  return values
}

function toFormState(error: unknown, values: Record<string, string>): FormState {
  if (error instanceof ApiValidationError) {
    const hasFieldErrors = Object.keys(error.fieldErrors).length > 0
    return {
      error: hasFieldErrors ? 'Revise os campos destacados.' : error.message,
      fieldErrors: error.fieldErrors,
      values,
      attempt: Date.now(),
    }
  }
  throw error
}

/* ---------- Sessão ---------- */

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const email = text(formData, 'email')
  try {
    const { token } = await api.login(email, text(formData, 'password'))
    await adminSession.set(token)
  } catch (error) {
    if (error instanceof ApiValidationError && error.status === 400) {
      return { error: 'E-mail ou senha incorretos.', values: { email } }
    }
    return toFormState(error, { email })
  }
  redirect('/admin')
}

/** Auditoria de navegação: tela aberta ou arquivo baixado no painel */
export async function trackActivity(action: 'view' | 'download', path: string) {
  await api.trackActivity(action, path)
}

export async function logout() {
  try {
    await api.logout()
  } finally {
    await adminSession.clear()
  }
  redirect('/admin/login')
}

/* ---------- Administradores ---------- */

export async function saveAdministrator(
  administratorId: number | null,
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const payload = {
    fullName: text(formData, 'fullName'),
    email: text(formData, 'email'),
    ...(text(formData, 'password') ? { password: text(formData, 'password') } : {}),
  }
  try {
    if (administratorId) await api.updateAdministrator(administratorId, payload)
    else await api.createAdministrator(payload)
  } catch (error) {
    return toFormState(error, { fullName: payload.fullName, email: payload.email })
  }
  revalidatePath('/admin', 'layout')
  redirect('/admin/administradores')
}

export async function setAdministratorStatus(id: number, isActive: boolean) {
  try {
    await api.setAdministratorStatus(id, isActive)
  } catch (error) {
    if (error instanceof ApiValidationError) return { error: error.message }
    throw error
  }
  refresh()
  return {}
}

export async function removeAdministrator(id: number) {
  try {
    await api.deleteAdministrator(id)
  } catch (error) {
    if (error instanceof ApiValidationError) return { error: error.message }
    throw error
  }
  refresh()
  return {}
}

/* ---------- Eventos ---------- */

export async function saveEvent(
  eventId: number | null,
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const payload = {
    name: text(formData, 'name'),
    startsOn: text(formData, 'startsOn'),
    endsOn: text(formData, 'endsOn'),
    location: text(formData, 'location') || null,
    hashtag: text(formData, 'hashtag').replace(/^#+/, '') || null,
    description: text(formData, 'description') || null,
    evaluationMode: text(formData, 'evaluationMode') || 'integrated',
    evaluationUrl: text(formData, 'evaluationUrl') || null,
  }

  let id: number
  try {
    const event = eventId ? await api.updateEvent(eventId, payload) : await api.createEvent(payload)
    id = event.id
  } catch (error) {
    return toFormState(error, textValues(formData))
  }

  revalidatePath('/admin', 'layout')
  redirect(`/admin/eventos/${id}`)
}

export async function deleteEvent(eventId: number) {
  await api.deleteEvent(eventId)
  revalidatePath('/admin', 'layout')
  redirect('/admin')
}

/** Exclusão pela lista: atualiza a página atual (mantém a paginação) */
export async function removeEvent(eventId: number) {
  await api.deleteEvent(eventId)
  refresh()
}

/* ---------- Pontos (checkpoints) ---------- */

export async function saveCheckpoint(
  eventId: number,
  checkpointId: number | null,
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const body = new FormData()
  body.set('name', text(formData, 'name'))
  body.set('categoryId', text(formData, 'categoryId'))
  body.set('summary', text(formData, 'summary'))
  body.set('teamInfo', text(formData, 'teamInfo'))
  body.set('location', text(formData, 'location'))
  body.set('isActive', formData.get('isActive') === 'on' ? 'true' : 'false')

  for (const key of ['image', 'logo'] as const) {
    const upload = file(formData, key)
    if (upload) body.set(key, upload)
  }
  if (checkpointId) {
    body.set('removeImage', formData.get('removeImage') === 'on' ? 'true' : 'false')
    body.set('removeLogo', formData.get('removeLogo') === 'on' ? 'true' : 'false')
  }

  try {
    if (checkpointId) {
      await api.updateCheckpoint(checkpointId, body)
    } else {
      await api.createCheckpoint(eventId, body)
    }
  } catch (error) {
    return toFormState(error, textValues(formData))
  }

  revalidatePath('/admin', 'layout')
  redirect(`/admin/eventos/${eventId}`)
}

export async function deleteCheckpoint(eventId: number, checkpointId: number) {
  await api.deleteCheckpoint(checkpointId)
  revalidatePath('/admin', 'layout')
  redirect(`/admin/eventos/${eventId}`)
}

/* Ações rápidas da lista: atualizam a página atual, mantendo os filtros */

export async function setCheckpointStatus(checkpointId: number, isActive: boolean) {
  await api.setCheckpointStatus(checkpointId, isActive)
  refresh()
}

export async function removeCheckpoint(checkpointId: number) {
  await api.deleteCheckpoint(checkpointId)
  refresh()
}

/* ---------- Categorias ---------- */

export async function createCategory(
  eventId: number,
  _: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    await api.createCategory(eventId, text(formData, 'name'))
  } catch (error) {
    return toFormState(error, textValues(formData))
  }
  refresh()
  return {}
}

export async function renameCategory(
  categoryId: number,
  _: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    await api.updateCategory(categoryId, text(formData, 'name'))
  } catch (error) {
    return toFormState(error, textValues(formData))
  }
  refresh()
  return {}
}

export async function deleteCategory(
  categoryId: number,
  moveToCategoryId?: number
): Promise<{ error?: string }> {
  try {
    await api.deleteCategory(categoryId, moveToCategoryId)
  } catch (error) {
    if (error instanceof ApiValidationError) return { error: error.message }
    throw error
  }
  refresh()
  return {}
}

/* ---------- Importação em lote ---------- */

export type ImportState = { preview?: ImportPreview; error?: string }

export async function importCheckpoints(
  eventId: number,
  formData: FormData,
  dryRun: boolean
): Promise<ImportState> {
  const upload = file(formData, 'file')
  if (!upload) return { error: 'Escolha uma planilha.' }

  const body = new FormData()
  body.set('file', upload)
  body.set('dryRun', dryRun ? 'true' : 'false')

  let preview: ImportPreview
  try {
    preview = await api.importCheckpoints(eventId, body)
  } catch (error) {
    if (error instanceof ApiValidationError) return { error: error.message }
    throw error
  }

  if (dryRun || preview.created === 0) return { preview }

  revalidatePath('/admin', 'layout')
  redirect(`/admin/eventos/${eventId}?importados=${preview.created}`)
}
