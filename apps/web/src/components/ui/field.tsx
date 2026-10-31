import type { ComponentProps } from 'react'
import { InfoButton, type InfoContent } from '@/components/ui/info-button'

/**
 * Classes do controle de texto (input/textarea). "sm" para campos em linha
 * com botão ao lado (busca, nome de categoria).
 */
export function inputClass(size: 'md' | 'sm' = 'md') {
  const sizing = size === 'md' ? 'min-h-13 px-4 text-[17px]' : 'min-h-11 px-3 text-[16px]'
  return `w-full min-w-0 rounded-m border-2 border-line bg-bg ${sizing} text-fg placeholder:text-muted/70 focus:border-accent focus:outline-none aria-invalid:border-magenta data-invalid:border-magenta`
}

export const fieldLabelClass = 'font-display text-[13px] font-bold'

/** Erro (prioridade) ou dica abaixo de um campo */
export function FieldMessage({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (error) {
    return (
      <p id={`${id}-error`} className="text-[13px] font-semibold text-danger">
        {error}
      </p>
    )
  }
  if (hint) {
    return (
      <p id={`${id}-hint`} className="text-[13px] text-muted">
        {hint}
      </p>
    )
  }
  return null
}

/** aria-describedby que aponta para o erro ou a dica do campo */
export function describedBy(id: string, error?: string, hint?: string) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined
}

type FieldProps = {
  id: string
  label: string
  hint?: string
  error?: string
  /** "group" usa fieldset/legend (vários controles: rádios, imagem) */
  as?: 'single' | 'group'
  /** Explicação longa num modal, aberta pelo ícone ⓘ ao lado do rótulo */
  info?: InfoContent
  children: React.ReactNode
}

/**
 * Casca de todo campo de formulário: rótulo, controle e mensagem.
 */
export function Field({ id, label, hint, error, as = 'single', info, children }: FieldProps) {
  const infoButton = info ? <InfoButton {...info} label={label} /> : null

  if (as === 'group') {
    return (
      <fieldset className="flex flex-col gap-2">
        <legend className={`mb-1.5 flex items-center gap-1 ${fieldLabelClass}`}>
          {label}
          {infoButton}
        </legend>
        {children}
        <FieldMessage id={id} error={error} hint={hint} />
      </fieldset>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1">
        <label htmlFor={id} className={fieldLabelClass}>
          {label}
        </label>
        {infoButton}
      </div>
      {children}
      <FieldMessage id={id} error={error} hint={hint} />
    </div>
  )
}

type TextFieldProps = Omit<ComponentProps<'input'>, 'id' | 'prefix'> & {
  name: string
  label: string
  hint?: string
  error?: string
  /** Texto fixo antes do valor (ex.: "#" na hashtag) */
  prefix?: string
}

export function TextField({ name, label, hint, error, prefix, ...props }: TextFieldProps) {
  const id = `field-${name}`
  const input = (
    <input
      id={id}
      name={name}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(id, error, hint)}
      className={`${inputClass()} ${prefix ? 'pl-7' : ''}`}
      {...props}
    />
  )
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      {prefix ? (
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 font-mono text-[15px] text-muted"
          >
            {prefix}
          </span>
          {input}
        </div>
      ) : (
        input
      )}
    </Field>
  )
}

type TextAreaFieldProps = Omit<ComponentProps<'textarea'>, 'id'> & {
  name: string
  label: string
  hint?: string
  error?: string
}

export function TextAreaField({ name, label, hint, error, ...props }: TextAreaFieldProps) {
  const id = `field-${name}`
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <textarea
        id={id}
        name={name}
        rows={4}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={`${inputClass()} py-3 leading-relaxed`}
        {...props}
      />
    </Field>
  )
}

/**
 * Campo de uma linha com botão ao lado (busca, criar/renomear categoria).
 * O botão vem como children. Use labelHidden quando o contexto já explica.
 */
export function InlineField({
  id,
  label,
  labelHidden,
  error,
  children,
  ...props
}: Omit<ComponentProps<'input'>, 'id'> & {
  id: string
  label: string
  labelHidden?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={labelHidden ? 'sr-only' : fieldLabelClass}>
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error)}
          className={inputClass('sm')}
          {...props}
        />
        {children}
      </div>
      <FieldMessage id={id} error={error} />
    </div>
  )
}
