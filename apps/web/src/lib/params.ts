import { notFound } from 'next/navigation'

/**
 * Converte um parâmetro de rota em id numérico; qualquer outra coisa é 404.
 */
export function parseId(value: string) {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) notFound()
  return id
}

/**
 * Número da página a partir de ?pagina=N (padrão 1).
 */
export function parsePage(value: string | string[] | undefined) {
  const page = Number(Array.isArray(value) ? value[0] : value)
  return Number.isInteger(page) && page > 0 ? page : 1
}
