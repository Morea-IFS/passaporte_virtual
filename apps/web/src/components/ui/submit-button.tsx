'use client'

import { useFormStatus } from 'react-dom'
import { buttonClass, type ButtonVariant } from '@/components/ui/button'

type SubmitButtonProps = {
  children: React.ReactNode
  pendingLabel: string
  variant?: ButtonVariant
  size?: 'md' | 'sm'
  block?: boolean
}

export function SubmitButton({ children, pendingLabel, variant, size, block }: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending} className={buttonClass(variant, { size, block })}>
      {pending ? pendingLabel : children}
    </button>
  )
}
