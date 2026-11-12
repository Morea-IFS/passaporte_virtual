'use client'

import { useActionState, useState } from 'react'
import { evaluateEvent } from '@/app/passaporte/actions'
import { Panel } from '@/components/ui/card'
import { Notice } from '@/components/ui/feedback'
import { StarIcon } from '@/components/ui/icons'
import { SubmitButton } from '@/components/ui/submit-button'
import { buttonClass } from '@/components/ui/button'

const RATING_LABELS = ['Muito ruim', 'Ruim', 'Regular', 'Bom', 'Excelente'] as const

export function EventEvaluation({
  slug,
  mode,
  url,
  initialRating,
}: {
  slug: string
  mode: 'integrated' | 'external'
  url: string | null
  initialRating: number | null
}) {
  const [state, action] = useActionState(
    evaluateEvent.bind(null, slug),
    {} as { error?: string; rating?: number }
  )
  const rating = state.rating ?? initialRating
  const [selectedRating, setSelectedRating] = useState(rating ?? 0)
  const [previewRating, setPreviewRating] = useState<number | null>(null)
  const displayedRating = previewRating ?? selectedRating
  return (
    <Panel>
      <h2 className="text-xl font-extrabold">Avaliar o evento</h2>
      {mode === 'external' && url ? (
        <>
          <p className="text-muted">Compartilhe sua opinião no formulário da organização.</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass('primary')}
          >
            Avaliar o evento <span className="sr-only">(abre em outra aba)</span>
          </a>
        </>
      ) : (
        <form action={action} className="flex flex-col gap-3">
          <p className="text-[15px] text-muted">
            Avalie o evento como um todo. Sua resposta aparece apenas nos resultados agregados da
            organização.
          </p>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 font-bold">Que nota você dá ao evento?</legend>
            <div
              className="flex flex-wrap gap-1"
              onMouseLeave={() => setPreviewRating(null)}
            >
              {[1, 2, 3, 4, 5].map((value) => {
                const label = `${value} ${value === 1 ? 'estrela' : 'estrelas'}: ${RATING_LABELS[value - 1]}`
                return (
                  <label
                    key={value}
                    title={label}
                    className="group relative flex size-12 cursor-pointer items-center justify-center"
                    onMouseEnter={() => setPreviewRating(value)}
                  >
                    <input
                      type="radio"
                      className="peer sr-only"
                      name="rating"
                      value={value}
                      required
                      checked={selectedRating === value}
                      aria-label={label}
                      onChange={() => setSelectedRating(value)}
                      onFocus={() => setPreviewRating(value)}
                      onBlur={() => setPreviewRating(null)}
                    />
                    <StarIcon
                      className={`size-10 text-accent transition-colors peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${value <= displayedRating ? 'fill-accent' : 'fill-none'}`}
                    />
                  </label>
                )
              })}
            </div>
          </fieldset>
          <Notice tone="error">{state.error}</Notice>
          <Notice tone="success">
            {state.rating
              ? 'Avaliação salva. Obrigado por participar!'
              : initialRating
                ? 'Você já avaliou este evento. Pode alterar sua nota abaixo.'
                : null}
          </Notice>
          <SubmitButton pendingLabel="Enviando...">
            {rating ? 'Atualizar avaliação' : 'Enviar avaliação'}
          </SubmitButton>
        </form>
      )}
    </Panel>
  )
}
