import { BackLink } from '@/components/ui/back-link'

type PageHeaderProps = {
  title: string
  back?: { href: string; label: string }
  description?: React.ReactNode
  actions?: React.ReactNode
}

export function PageHeader({ title, back, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-3">
      {back ? <BackLink href={back.href} label={back.label} /> : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="text-[28px] leading-[1.1] font-black text-accent sm:text-4xl">{title}</h1>
          {description ? <div className="text-muted">{description}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}
