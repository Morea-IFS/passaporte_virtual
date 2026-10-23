import vine from '@vinejs/vine'

/** Tamanho de página padrão de todas as listas do painel */
export const PER_PAGE = 20

export const pageValidator = vine.create({
  page: vine.number().withoutDecimals().min(1).optional(),
})
