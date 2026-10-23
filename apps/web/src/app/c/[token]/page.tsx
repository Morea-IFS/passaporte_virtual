import type { Metadata } from 'next'
import { BrandMark } from '@/components/brand-mark'
import { BrandMosaic } from '@/components/brand-mosaic'
import { ThemeToggle } from '@/components/theme-toggle'
import { CategoryChip } from '@/components/ui/category-chip'
import { Notice } from '@/components/ui/feedback'
import { api } from '@/lib/api'
import { formatEventPeriod } from '@/lib/format'
import type { PublicCheckpoint } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Passaporte Virtual',
}

function CheckinStatus({ checkpoint }: { checkpoint: PublicCheckpoint }) {
  if (!checkpoint.isActive) {
    return <Notice tone="neutral">Este ponto não está recebendo carimbos agora.</Notice>
  }
  return (
    <Notice tone="success">
      Você está no lugar certo! Em breve, ao ler este QR code, o carimbo vai direto para o seu
      passaporte.
    </Notice>
  )
}

/**
 * Página aberta pelo QR code de um ponto. Mostra o ponto; o carimbo no
 * passaporte entra na próxima etapa (4.3).
 */
export default async function PublicCheckpointPage({ params }: PageProps<'/c/[token]'>) {
  const checkpoint = await api.publicCheckpoint((await params).token)
  const { event } = checkpoint

  return (
    <main className="flex flex-1 flex-col bg-violeta-noite">
      <BrandMosaic className="h-28 shrink-0" />
      <section className="relative -mt-6 flex flex-1 flex-col rounded-t-[28px] bg-bg px-4 pt-5 pb-10">
        <div className="mx-auto flex w-full max-w-md flex-col gap-5">
          <div className="flex items-center justify-between gap-3">
            <BrandMark />
            <ThemeToggle />
          </div>

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
              <h1 className="text-[28px] leading-[1.1] font-black text-accent">
                {checkpoint.name}
              </h1>
              {checkpoint.location ? (
                <p className="font-mono text-[12px] tracking-wide text-muted">
                  {checkpoint.location}
                </p>
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

          <CheckinStatus checkpoint={checkpoint} />

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
        </div>
      </section>
    </main>
  )
}
