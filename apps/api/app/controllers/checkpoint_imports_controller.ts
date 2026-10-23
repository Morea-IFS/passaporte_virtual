import Event from '#models/event'
import Checkpoint from '#models/checkpoint'
import CheckpointCategory from '#models/checkpoint_category'
import { checkpointRowValidator, importCheckpointsValidator } from '#validators/checkpoint'
import { errors as vineErrors } from '@vinejs/vine'
import db from '@adonisjs/lucid/services/db'
import { parse } from 'csv-parse/sync'
import { readFile } from 'node:fs/promises'
import * as XLSX from 'xlsx'
import type { HttpContext } from '@adonisjs/core/http'

const MAX_ROWS = 500

/**
 * Cabeçalhos aceitos na planilha (comparados sem acento e sem caixa).
 */
const HEADERS: Record<string, 'name' | 'category' | 'summary' | 'location'> = {
  nome: 'name',
  name: 'name',
  categoria: 'category',
  category: 'category',
  resumo: 'summary',
  descricao: 'summary',
  summary: 'summary',
  local: 'location',
  localizacao: 'location',
  location: 'location',
}

type ImportRow = {
  line: number
  name: string
  category: { id: number; name: string; color: string }
  summary?: string | null
  location?: string | null
}

type ImportError = { line: number; messages: string[] }

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase()
}

export default class CheckpointImportsController {
  /**
   * Importa checkpoints de uma planilha: CSV (vírgula ou ponto e vírgula),
   * Excel (.xlsx/.xls) ou LibreOffice (.ods).
   * Tudo ou nada: se alguma linha tiver erro, nenhuma é salva.
   * Com dryRun=true, só valida e devolve a prévia.
   */
  async store({ params, request, serialize }: HttpContext) {
    const event = await Event.findOrFail(params.eventId)
    const { file, dryRun } = await request.validateUsing(importCheckpointsValidator)

    const content = await this.readAsCsv(file.tmpPath!, file.extname)
    if (content === null) {
      return serialize({
        rows: [],
        errors: [{ line: 1, messages: ['Não foi possível ler a planilha. Confira o arquivo.'] }],
        created: 0,
      })
    }
    const categories = await CheckpointCategory.query()
      .where('event_id', event.id)
      .orderBy('position', 'asc')
    const { rows, errors } = await this.parse(content, categories)

    if (dryRun || errors.length > 0 || rows.length === 0) {
      return serialize({ rows, errors, created: 0 })
    }

    await db.transaction(async (trx) => {
      const first = await Checkpoint.nextSequence(event.id, trx)
      await Checkpoint.createMany(
        rows.map(({ line: _, category, ...fields }, index) => ({
          ...fields,
          categoryId: category.id,
          eventId: event.id,
          code: Checkpoint.formatCode(first + index),
          isActive: true,
        })),
        { client: trx }
      )
    })

    return serialize({ rows, errors, created: rows.length })
  }

  /**
   * CSV é lido como texto. Excel (.xlsx/.xls) e LibreOffice (.ods) têm a
   * primeira aba convertida para CSV, assim tudo passa pela mesma validação
   * e os números de linha batem com os da planilha.
   */
  private async readAsCsv(path: string, extname: string | undefined) {
    if (extname === 'csv' || extname === 'txt') return readFile(path, 'utf8')

    try {
      const workbook = XLSX.read(await readFile(path), { type: 'buffer' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      return firstSheet ? XLSX.utils.sheet_to_csv(firstSheet, { FS: ',' }) : ''
    } catch {
      return null
    }
  }

  private async parse(content: string, categories: CheckpointCategory[]) {
    const byName = new Map(categories.map((category) => [normalize(category.name), category]))
    const available = categories.map((category) => category.name).join(', ')
    const errors: ImportError[] = []
    const rows: ImportRow[] = []

    let records: { record: Record<string, string>; info: { lines: number } }[]
    try {
      records = parse(content, {
        bom: true,
        delimiter: [',', ';'],
        columns: (header: string[]) => header.map((column) => HEADERS[normalize(column)] ?? false),
        info: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      })
    } catch {
      return {
        rows,
        errors: [{ line: 1, messages: ['Não foi possível ler o arquivo. Envie um CSV válido.'] }],
      }
    }

    const firstLine = content.replace(/^\uFEFF/, '').split(/\r?\n/, 1)[0] ?? ''
    const headers = firstLine.split(/[,;]/).map((column) => HEADERS[normalize(column)])
    const missing = (['name', 'category'] as const).filter((column) => !headers.includes(column))
    if (missing.length > 0) {
      const labels = { name: '"nome"', category: '"categoria"' }
      return {
        rows,
        errors: [
          {
            line: 1,
            messages: [
              `A planilha precisa ter a coluna ${missing.map((m) => labels[m]).join(' e ')}.`,
            ],
          },
        ],
      }
    }

    if (records.length > MAX_ROWS) {
      return {
        rows,
        errors: [{ line: 1, messages: [`Envie no máximo ${MAX_ROWS} linhas por vez.`] }],
      }
    }

    for (const { record, info } of records) {
      const messages: string[] = []
      const category = record.category ? byName.get(normalize(record.category)) : undefined
      if (!record.category) {
        messages.push('Categoria: campo obrigatório.')
      } else if (!category) {
        messages.push(`Categoria "${record.category}" não existe neste evento. Use: ${available}.`)
      }

      try {
        const fields = await checkpointRowValidator.validate({
          name: record.name,
          summary: record.summary || null,
          location: record.location || null,
        })
        if (category && messages.length === 0) {
          rows.push({
            line: info.lines,
            ...fields,
            category: { id: category.id, name: category.name, color: category.color },
          })
        }
      } catch (error) {
        if (!(error instanceof vineErrors.E_VALIDATION_ERROR)) throw error
        messages.unshift(...error.messages.map(({ message }: { message: string }) => message))
      }

      if (messages.length > 0) errors.push({ line: info.lines, messages })
    }

    return { rows, errors }
  }
}
