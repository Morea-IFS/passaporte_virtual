'use client'

import { useState, useTransition } from 'react'
import { importCheckpoints, type ImportState } from '@/app/admin/actions'
import { buttonClass } from '@/components/ui/button'
import { CategoryChip } from '@/components/ui/category-chip'
import { Actions, Card, Panel } from '@/components/ui/card'
import { Notice } from '@/components/ui/feedback'
import { pluralize } from '@/lib/format'

/**
 * Dois passos: envia o arquivo para validar (prévia) e, sem erros,
 * envia de novo para salvar.
 */
export function ImportForm({ eventId }: { eventId: number }) {
  const [file, setFile] = useState<File | null>(null)
  const [state, setState] = useState<ImportState>({})
  const [pending, startTransition] = useTransition()
  const preview = state.preview

  function send(dryRun: boolean) {
    if (!file) return
    const formData = new FormData()
    formData.set('file', file)
    startTransition(async () => {
      setState(await importCheckpoints(eventId, formData, dryRun))
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <label
          htmlFor="field-file"
          className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-m border-2 border-dashed border-line bg-surface p-4 text-center focus-within:outline-3 focus-within:outline-amarelo"
        >
          <span className="font-display font-extrabold text-accent">
            {file ? file.name : 'Escolher planilha'}
          </span>
          <span className="text-[13px] text-muted">
            {file ? 'Toque para trocar' : 'Excel, LibreOffice ou CSV · até 5 MB e 500 linhas'}
          </span>
          <input
            id="field-file"
            type="file"
            accept=".csv,.xlsx,.xls,.ods,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/vnd.oasis.opendocument.spreadsheet"
            className="sr-only"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null)
              setState({})
            }}
          />
        </label>
        {!preview ? (
          <button
            type="button"
            disabled={!file || pending}
            className={buttonClass('primary')}
            onClick={() => send(true)}
          >
            {pending ? 'Lendo arquivo...' : 'Conferir planilha'}
          </button>
        ) : null}
      </div>

      <Notice tone="error">{state.error}</Notice>

      {preview ? (
        <section className="flex flex-col gap-4" aria-live="polite">
          {preview.errors.length > 0 ? (
            <Panel tone="danger">
              <p className="font-display font-extrabold text-magenta">
                {pluralize(preview.errors.length, 'linha precisa', 'linhas precisam')} de ajuste.
                Corrija o arquivo e envie de novo: nada foi salvo.
              </p>
              <ul className="flex flex-col gap-2 text-[15px]">
                {preview.errors.map((error) => (
                  <li key={error.line} className="flex gap-3">
                    <span className="w-16 shrink-0 font-mono text-[13px] text-muted">
                      linha {error.line}
                    </span>
                    <span>{error.messages.join(' ')}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : (
            <p className="font-display font-extrabold">
              {pluralize(preview.rows.length, 'ponto pronto', 'pontos prontos')} para importar.
            </p>
          )}

          {preview.rows.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {preview.rows.map((row) => (
                <Card key={row.line} interactive={false} className="gap-1.5 p-3">
                  <span className="font-mono text-[11px] text-muted">
                    linha {row.line}
                    {row.location ? ` · ${row.location}` : ''}
                  </span>
                  <span className="font-display leading-tight font-extrabold">{row.name}</span>
                  <span>
                    <CategoryChip category={row.category} />
                  </span>
                </Card>
              ))}
            </ul>
          ) : null}

          <Actions>
            <button
              type="button"
              className={buttonClass('ghost')}
              disabled={pending}
              onClick={() => setState({})}
            >
              Escolher outro arquivo
            </button>
            {preview.errors.length === 0 && preview.rows.length > 0 ? (
              <button
                type="button"
                className={buttonClass('primary')}
                disabled={pending}
                onClick={() => send(false)}
              >
                {pending
                  ? 'Importando...'
                  : `Importar ${pluralize(preview.rows.length, 'ponto', 'pontos')}`}
              </button>
            ) : null}
          </Actions>
        </section>
      ) : null}
    </div>
  )
}
