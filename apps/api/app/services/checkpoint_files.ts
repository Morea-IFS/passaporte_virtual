import type Checkpoint from '#models/checkpoint'
import { randomUUID } from 'node:crypto'
import type { MultipartFile } from '@adonisjs/core/bodyparser'

type ImageField = 'imagePath' | 'logoPath'

/**
 * Salva a imagem enviada no Drive e devolve a chave. Arquivos ficam
 * em checkpoints/<eventId>/ para facilitar limpeza por evento.
 */
export async function storeCheckpointImage(eventId: number, file: MultipartFile) {
  const key = `checkpoints/${eventId}/${randomUUID()}.${file.extname}`
  await file.moveToDisk(key)
  return key
}

/**
 * Troca ou remove a imagem de um campo. O arquivo antigo fica no
 * storage (exclusão lógica: dá para voltar o caminho no banco).
 */
export async function replaceCheckpointImage(
  checkpoint: Checkpoint,
  field: ImageField,
  file: MultipartFile | undefined,
  remove: boolean | undefined
) {
  if (file) {
    checkpoint[field] = await storeCheckpointImage(checkpoint.eventId, file)
  } else if (remove) {
    checkpoint[field] = null
  }
}
