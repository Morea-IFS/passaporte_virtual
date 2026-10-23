import { colorStyles } from '@/lib/categories'
import type { CheckpointCategory } from '@/lib/types'

type CategoryPickerProps = {
  name: string
  categories: Pick<CheckpointCategory, 'id' | 'name' | 'color'>[]
  /** Não controlado (formulário) */
  defaultValue?: number
  /** Controlado */
  value?: number
  onChange?: (id: number) => void
  required?: boolean
}

/**
 * Escolha de uma categoria em chips coloridos (rádios). O chip marcado
 * ganha a cor da categoria.
 */
export function CategoryPicker({
  name,
  categories,
  defaultValue,
  value,
  onChange,
  required,
}: CategoryPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <label key={category.id}>
          <input
            type="radio"
            name={name}
            value={category.id}
            required={required}
            {...(onChange
              ? { checked: value === category.id, onChange: () => onChange(category.id) }
              : { defaultChecked: defaultValue === category.id })}
            className="peer sr-only"
          />
          <span
            className={`inline-flex min-h-11 items-center rounded-full border-2 border-line px-4 font-display text-[12px] font-bold tracking-wider whitespace-nowrap text-muted uppercase peer-checked:border-transparent peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amarelo ${colorStyles(category.color).checked}`}
          >
            {category.name}
          </span>
        </label>
      ))}
    </div>
  )
}
