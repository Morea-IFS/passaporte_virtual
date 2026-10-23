import type { Metadata } from 'next'
import { CheckinFlow } from '@/components/passport/checkin-flow'
import { VisitorShell } from '@/components/passport/visitor-shell'
import { CategoryChip } from '@/components/ui/category-chip'
import { Notice } from '@/components/ui/feedback'
import { api } from '@/lib/api'
import { formatEventPeriod } from '@/lib/format'
import { visitorSession } from '@/lib/session'

export const metadata: Metadata = {
  title: 'Passaporte Virtual',
}

/**
 * Página aberta pelo QR code (RF11/RF12): mostra o ponto e carimba o
 * passaporte. Sem passaporte no celular, pede o apelido uma vez.
 */
export default async function CheckpointPage({ params }: PageProps<'/c/[token]'>) {
  const token = (await params).token
  const [checkpoint, hasPassport] = await Promise.all([
    api.publicCheckpoint(token),
    visitorSession.get().then(Boolean),
  ])
  const { event } = checkpoint

  return (
    <VisitorShell>
      {checkpoint.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- imagem da API, já no tamanho final
        <img
          src={checkpoint.imageUrl}
          alt=""
          className="aspect-video w-full rounded-m object-cover"
        />
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col items-start gap-2">
          <CategoryChip category={checkpoint.category} />
          <h1 className="text-[28px] leading-[1.1] font-black text-accent">{checkpoint.name}</h1>
          {checkpoint.location ? (
            <p className="font-mono text-[12px] tracking-wide text-muted">{checkpoint.location}</p>
          ) : null}
        </div>
        {checkpoint.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- logomarca da API
          <img
            src={checkpoint.logoUrl}
            alt=""
            className="size-16 shrink-0 rounded-s bg-creme object-contain p-1.5"
          />
        ) : null}
      </div>

      {checkpoint.summary ? <p className="text-[16px]">{checkpoint.summary}</p> : null}

      {checkpoint.isActive ? (
        <CheckinFlow
          qrToken={token}
          code={checkpoint.code}
          categoryName={checkpoint.category.name}
          color={checkpoint.category.color}
          hasPassport={hasPassport}
        />
      ) : (
        <Notice tone="neutral">Este ponto não está recebendo carimbos agora.</Notice>
      )}

      <footer className="flex flex-col gap-1 border-t border-line pt-4 text-[14px] text-muted">
        <span className="font-display font-extrabold text-fg">{event.name}</span>
        <span>
          {formatEventPeriod(event.startsOn, event.endsOn)}
          {event.location ? ` · ${event.location}` : ''}
        </span>
        {event.hashtag ? (
          <span className="font-display font-bold text-accent">{event.hashtag}</span>
        ) : null}
      </footer>
    </VisitorShell>
  )
}
