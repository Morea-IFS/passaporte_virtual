import { PageSkeleton } from '@/components/admin/page-skeleton'
import { VisitorShell } from '@/components/passport/visitor-shell'

export default function Loading() {
  return (
    <VisitorShell>
      <PageSkeleton />
    </VisitorShell>
  )
}
