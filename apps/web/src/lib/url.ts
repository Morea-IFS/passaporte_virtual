/**
 * Monta um link com query string, ignorando parâmetros vazios.
 * Ex.: hrefWith('/admin', { pagina: 2, q: undefined }) → "/admin?pagina=2".
 */
export function hrefWith(path: string, params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams(
    Object.entries(params)
      .filter((entry): entry is [string, string | number] => Boolean(entry[1]))
      .map(([key, value]) => [key, String(value)])
  ).toString()
  return query ? `${path}?${query}` : path
}

/** Primeiro valor de um searchParam (que pode vir repetido) */
export function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

/** Só caminhos internos do site (evita redirecionar para outro domínio) */
export function safePath(path: string | undefined, fallback = '/') {
  return path && path.startsWith('/') && !path.startsWith('//') ? path : fallback
}
