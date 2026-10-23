import { colorStyles } from '@/lib/categories'
import type { CheckpointCategory } from '@/lib/types'

export function CategoryChip({
  category,
}: {
  category: Pick<CheckpointCategory, 'name' | 'color'>
}) {
  return (
    <span
      className={`inline-flex min-h-7 items-center gap-1.5 rounded-full px-3 font-display text-[11px] font-bold tracking-wider whitespace-nowrap uppercase ${colorStyles(category.color).chip}`}
    >
      <span aria-hidden="true" className="size-2 rounded-full bg-current opacity-70" />
      {category.name}
    </span>
  )
}
