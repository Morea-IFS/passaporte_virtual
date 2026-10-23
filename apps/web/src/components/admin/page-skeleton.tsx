export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Carregando">
      <div className="h-9 w-2/3 animate-pulse rounded-s bg-surface-2" />
      <div className="h-24 animate-pulse rounded-m bg-surface-2" />
      <div className="h-24 animate-pulse rounded-m bg-surface-2" />
    </div>
  )
}
