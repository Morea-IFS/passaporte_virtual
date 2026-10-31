'use client'

import { useActionState } from 'react'
import { evaluateEvent } from '@/app/passaporte/actions'
import { Panel } from '@/components/ui/card'
import { Notice } from '@/components/ui/feedback'
import { SubmitButton } from '@/components/ui/submit-button'
import { buttonClass } from '@/components/ui/button'
import { OptionCard } from '@/components/ui/option-card'

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
          <fieldset key={rating ?? 'new'} className="flex flex-col gap-2">
            <legend className="mb-2 font-bold">Que nota você dá ao evento?</legend>
            {[1, 2, 3, 4, 5].map((value) => (
              <OptionCard
                key={value}
                name="rating"
                value={value}
                required
                defaultChecked={rating === value}
                title={`${value} ${value === 1 ? 'estrela' : 'estrelas'}`}
                description={['Muito ruim', 'Ruim', 'Regular', 'Bom', 'Excelente'][value - 1]}
              />
            ))}
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
