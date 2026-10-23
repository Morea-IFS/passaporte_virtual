'use client'

import { useRef, useState } from 'react'
import { buttonClass } from '@/components/ui/button'
import { Actions } from '@/components/ui/card'
import { inputClass } from '@/components/ui/field'
import { CheckIcon, ChevronDownIcon } from '@/components/ui/icons'
import { Modal } from '@/components/ui/modal'

export type SelectOption = { value: string; label: string }

type SelectFieldProps = {
  name: string
  /** Nome acessível do campo e título do modal */
  label: string
  options: SelectOption[]
  defaultValue?: string
  size?: 'md' | 'sm'
}

/**
 * Select da identidade, no mesmo padrão do DateField: um botão com cara de
 * campo que abre a lista de opções num modal. O valor vai no formulário por
 * um input escondido, então funciona em formulários GET de filtro.
 */
export function SelectField({
  name,
  label,
  options,
  defaultValue = '',
  size = 'md',
}: SelectFieldProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [value, setValue] = useState(defaultValue)
  const current = options.find((option) => option.value === value) ?? options[0]

  function open() {
    dialogRef.current?.showModal()
    dialogRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus()
  }

  function choose(option: SelectOption) {
    setValue(option.value)
    dialogRef.current?.close()
  }

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        aria-label={`${label}: ${current?.label ?? ''}`}
        aria-haspopup="dialog"
        onClick={open}
        className={`${inputClass(size)} flex items-center justify-between gap-3 text-left`}
      >
        <span className="truncate">{current?.label}</span>
        <ChevronDownIcon className="size-5 shrink-0 text-accent" />
      </button>

      <Modal dialogRef={dialogRef} title={label}>
        <div
          role="listbox"
          aria-label={label}
          className="-mx-1 flex max-h-[60vh] flex-col gap-1 overflow-y-auto px-1"
        >
          {options.map((option) => {
            const selected = option.value === value
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => choose(option)}
                className={`flex min-h-11 w-full shrink-0 items-center justify-between gap-3 rounded-full px-4 text-left font-display text-[15px] font-bold ${selected ? 'bg-violeta text-creme' : 'text-fg hover:bg-surface-2'}`}
              >
                <span>{option.label}</span>
                {selected ? <CheckIcon className="size-4 shrink-0" /> : null}
              </button>
            )
          })}
        </div>
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
    </>
  )
}
