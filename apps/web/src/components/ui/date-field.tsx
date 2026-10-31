'use client'

import { useRef, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { ptBR } from 'react-day-picker/locale'
import { buttonClass } from '@/components/ui/button'
import { Actions } from '@/components/ui/card'
import { describedBy, Field, inputClass } from '@/components/ui/field'
import { CalendarIcon } from '@/components/ui/icons'
import { Modal } from '@/components/ui/modal'

type DateFieldProps = {
  name: string
  label: string
  /** Data em ISO (AAAA-MM-DD) ou '' */
  value: string
  onChange: (value: string) => void
  /** Primeira data permitida, em ISO */
  min?: string
  error?: string
  hint?: string
}

const display = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

/** ISO → Date local (meia-noite), para o calendário */
function fromIso(value: string) {
  if (!value) return undefined
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** Data de hoje (fuso do navegador) em ISO */
export function todayIso() {
  return toIso(new Date())
}

function formatDisplay(value: string) {
  const text = display.format(new Date(`${value}T00:00:00Z`))
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function toIso(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * Campo de data da identidade: um botão que mostra a data por extenso e
 * abre um calendário em português no modal. O valor vai no formulário
 * por um input escondido (ISO).
 */
export function DateField({ name, label, value, onChange, min, error, hint }: DateFieldProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  // Muda a cada abertura: remonta o calendário no mês da data atual
  // (defaultMonth só é lido na montagem, e o modal fica montado escondido)
  const [openCount, setOpenCount] = useState(0)
  const id = `field-${name}`
  const selected = fromIso(value)
  const minDate = fromIso(min ?? '')

  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <input type="hidden" name={name} value={value} />
      <button
        id={id}
        type="button"
        data-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        onClick={() => {
          setOpenCount((count) => count + 1)
          dialogRef.current?.showModal()
        }}
        className={`${inputClass()} flex items-center justify-between gap-3 text-left`}
      >
        <span className={value ? 'text-fg' : 'text-muted'}>
          {value ? formatDisplay(value) : 'Escolher data'}
        </span>
        <CalendarIcon className="size-5 shrink-0 text-accent" />
      </button>

      <Modal dialogRef={dialogRef} title={label} size="lg">
        <DayPicker
          key={openCount}
          mode="single"
          locale={ptBR}
          selected={selected}
          defaultMonth={selected ?? minDate}
          disabled={minDate ? { before: minDate } : undefined}
          onSelect={(date) => {
            if (!date) return
            onChange(toIso(date))
            dialogRef.current?.close()
          }}
          classNames={{
            root: 'w-full',
            months: 'relative',
            month: 'flex flex-col gap-3',
            month_caption:
              'flex h-11 items-center justify-center font-display text-[16px] font-extrabold text-fg capitalize',
            nav: 'absolute inset-x-0 top-0 flex h-11 items-center justify-between',
            button_previous:
              'grid size-11 place-items-center rounded-full text-accent hover:bg-surface-2 disabled:opacity-30',
            button_next:
              'grid size-11 place-items-center rounded-full text-accent hover:bg-surface-2 disabled:opacity-30',
            chevron: 'size-5 fill-current',
            month_grid: 'w-full border-collapse',
            weekday: 'pb-2 font-display text-[11px] font-bold tracking-wider text-muted uppercase',
            day: 'p-0 text-center',
            day_button:
              'mx-auto grid size-11 place-items-center rounded-full font-display text-[15px] font-bold text-fg hover:bg-surface-2',
            selected: '[&>button]:bg-violeta [&>button]:text-creme [&>button]:hover:bg-violeta',
            today: '[&>button]:text-accent [&>button]:underline [&>button]:underline-offset-4',
            outside: 'opacity-40',
            disabled: 'opacity-30 [&>button]:cursor-not-allowed [&>button]:hover:bg-transparent',
          }}
        />
        <Actions align="end">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className={buttonClass('ghost')}
          >
            Cancelar
          </button>
        </Actions>
      </Modal>
    </Field>
  )
}
