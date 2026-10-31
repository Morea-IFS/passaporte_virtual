import type Event from '#models/event'
import { errors } from '@vinejs/vine'

/** Valida também chamadas da API sem o formulário do painel. */
export function evaluationSettings<
  T extends { evaluationMode?: string; evaluationUrl?: string | null },
>(payload: T, previous?: Event) {
  const evaluationMode = payload.evaluationMode ?? previous?.evaluationMode ?? 'integrated'
  const evaluationUrl =
    payload.evaluationUrl === undefined ? previous?.evaluationUrl : payload.evaluationUrl
  if (evaluationMode === 'external' && !evaluationUrl) {
    throw new errors.E_VALIDATION_ERROR([
      {
        field: 'evaluationUrl',
        rule: 'required',
        message: 'Informe o link do formulário de avaliação.',
      },
    ])
  }
  return {
    ...payload,
    evaluationMode,
    evaluationUrl: evaluationMode === 'external' ? evaluationUrl! : null,
  }
}
