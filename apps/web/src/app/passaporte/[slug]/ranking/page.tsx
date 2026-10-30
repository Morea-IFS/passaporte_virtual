import Link from 'next/link'
import { RankingList } from '@/components/passport/ranking-list'
import { VisitorShell } from '@/components/passport/visitor-shell'
import { Pagination } from '@/components/ui/pagination'
import { buttonClass } from '@/components/ui/button'
import { api } from '@/lib/api'
import { parsePage } from '@/lib/params'
import { hrefWith } from '@/lib/url'

export default async function RankingPage({
  params,
  searchParams,
}: PageProps<'/passaporte/[slug]/ranking'>) {
  const { slug } = await params
  const page = parsePage((await searchParams).pagina)
  const { event, ranking } = await api.eventRanking(slug, page)
  const passportHref = `/passaporte/${encodeURIComponent(slug)}`
  return (
    <VisitorShell homeHref={passportHref}>
      <header className="flex flex-col gap-2">
        <p className="font-display text-sm font-bold text-accent">{event.name}</p>
        <h1 className="font-display text-2xl font-extrabold">Ranking dos visitantes</h1>
        <p className="text-sm text-muted">
          Cada ponto visitado vale um carimbo. Quem tem a mesma quantidade divide a posição.
        </p>
      </header>
      <RankingList entries={ranking.data} />
      <Pagination
        metadata={ranking.metadata}
        label="Páginas do ranking"
        hrefFor={(pagina) => hrefWith(`${passportHref}/ranking`, { pagina })}
      />
      <Link href={passportHref} className={buttonClass('ghost', { block: true })}>
        Voltar ao passaporte
      </Link>
    </VisitorShell>
  )
}
