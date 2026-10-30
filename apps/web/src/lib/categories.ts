/**
 * Categorias de ponto são cadastradas por evento; a API escolhe a cor
 * automaticamente entre estas (apps/api/app/models/checkpoint_category.ts).
 * Aqui ficam as classes de cada cor, escritas por extenso para o Tailwind.
 */
export const CATEGORY_COLORS = {
  azul: {
    chip: 'bg-azul text-creme',
    fill: 'bg-azul',
    checked: 'peer-checked:bg-azul peer-checked:text-creme',
  },
  laranja: {
    chip: 'bg-laranja text-violeta-noite',
    fill: 'bg-laranja',
    checked: 'peer-checked:bg-laranja peer-checked:text-violeta-noite',
  },
  magenta: {
    chip: 'bg-magenta/15 text-fg ring-1 ring-inset ring-magenta',
    fill: 'bg-magenta',
    checked:
      'peer-checked:bg-magenta/15 peer-checked:text-fg peer-checked:ring-2 peer-checked:ring-magenta',
  },
  verde: {
    chip: 'bg-verde text-violeta-noite',
    fill: 'bg-verde',
    checked: 'peer-checked:bg-verde peer-checked:text-violeta-noite',
  },
  turquesa: {
    chip: 'bg-turquesa text-violeta-noite',
    fill: 'bg-turquesa',
    checked: 'peer-checked:bg-turquesa peer-checked:text-violeta-noite',
  },
  amarelo: {
    chip: 'bg-amarelo text-violeta-noite',
    fill: 'bg-amarelo',
    checked: 'peer-checked:bg-amarelo peer-checked:text-violeta-noite',
  },
} as const

export type CategoryColor = keyof typeof CATEGORY_COLORS

/** Classes da cor, com fallback para azul se a API mandar uma cor desconhecida */
export function colorStyles(color: string) {
  return CATEGORY_COLORS[color as CategoryColor] ?? CATEGORY_COLORS.azul
}
