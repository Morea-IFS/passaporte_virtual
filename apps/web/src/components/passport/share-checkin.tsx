'use client'

import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { buttonClass, quietButtonClass } from '@/components/ui/button'
import { InlineError, Notice } from '@/components/ui/feedback'
import { DownloadIcon, ImageIcon } from '@/components/ui/icons'
import { Modal } from '@/components/ui/modal'
import { createStoryCard, shareStoryCard, type StoryCardDetails } from '@/lib/story-card'

type PreparedCard = { file: File; url: string }

/** O card só é oferecido depois de um carimbo confirmado pelo servidor. */
export function ShareCheckin(details: StoryCardDetails) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const photoRef = useRef<string | null>(null)
  const cardRef = useRef<PreparedCard | null>(null)
  const generationRef = useRef({ id: 0 })
  const [card, setCard] = useState<PreparedCard | null>(null)
  const [hasPhoto, setHasPhoto] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const generation = generationRef.current
    return () => {
      generation.id++
      if (photoRef.current) URL.revokeObjectURL(photoRef.current)
      if (cardRef.current) URL.revokeObjectURL(cardRef.current.url)
    }
  }, [])

  async function generate(photoUrl: string | null) {
    const generation = ++generationRef.current.id
    setGenerating(true)
    setError(null)
    setMessage(null)
    try {
      const file = await createStoryCard(details, photoUrl)
      if (generation !== generationRef.current.id) return
      const next = { file, url: URL.createObjectURL(file) }
      if (cardRef.current) URL.revokeObjectURL(cardRef.current.url)
      cardRef.current = next
      setCard(next)
    } catch {
      if (generation !== generationRef.current.id) return
      setError(
        photoUrl
          ? 'Não foi possível ler esta foto. Escolha uma imagem JPG, PNG ou WebP, ou remova a foto.'
          : 'Não foi possível criar o card neste navegador. Tente novamente ou use outro navegador.'
      )
      setCard(null)
    } finally {
      if (generation === generationRef.current.id) setGenerating(false)
    }
  }

  function open() {
    dialogRef.current?.showModal()
    void generate(photoRef.current)
  }

  function close() {
    generationRef.current.id++
    if (photoRef.current) URL.revokeObjectURL(photoRef.current)
    if (cardRef.current) URL.revokeObjectURL(cardRef.current.url)
    photoRef.current = null
    cardRef.current = null
    setCard(null)
    setHasPhoto(false)
    setError(null)
    setMessage(null)
    setGenerating(false)
  }

  function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    if ((file.type && !file.type.startsWith('image/')) || file.type === 'image/svg+xml') {
      setError('Escolha uma foto JPG, PNG ou WebP.')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('A foto deve ter até 20 MB. Escolha uma imagem menor.')
      return
    }
    if (photoRef.current) URL.revokeObjectURL(photoRef.current)
    photoRef.current = URL.createObjectURL(file)
    setHasPhoto(true)
    void generate(photoRef.current)
  }

  function removePhoto() {
    if (photoRef.current) URL.revokeObjectURL(photoRef.current)
    photoRef.current = null
    setHasPhoto(false)
    void generate(null)
  }

  async function share() {
    if (!card || generating || sharing) return
    setSharing(true)
    setError(null)
    setMessage(null)
    const outcome = await shareStoryCard(card.file, details)
    if (outcome === 'unsupported') {
      setMessage(
        'Este navegador não oferece compartilhamento de imagens. Baixe o card e adicione-o aos Stories pela galeria do Instagram.'
      )
    } else if (outcome === 'failed') {
      setMessage('Não foi possível abrir o compartilhamento. Baixe o card e envie pela galeria.')
    }
    setSharing(false)
  }

  return (
    <>
      <button type="button" onClick={open} className={buttonClass('ghost', { block: true })}>
        Compartilhar conquista
      </button>

      <Modal dialogRef={dialogRef} title="Seu card para Stories" locked={sharing} onClose={close}>
        <p className="text-left text-[14px] text-muted">
          Compartilhe a atividade e a hashtag do evento. Você também pode incluir uma foto sua.
        </p>

        <div
          className="relative mx-auto flex aspect-[9/16] w-full max-w-52 items-center justify-center overflow-hidden rounded-m bg-surface-2"
          aria-busy={generating}
        >
          {card && !generating ? (
            // eslint-disable-next-line @next/next/no-img-element -- preview de PNG local, sem servidor
            <img
              src={card.url}
              alt={`Card de Stories: ${details.checkpointName}, ${details.eventName}${details.hashtag ? `, ${details.hashtag}` : ''}`}
              width={1080}
              height={1920}
              className="h-full w-full object-contain"
            />
          ) : (
            <p role="status" className="px-4 text-center text-[14px] text-muted">
              {generating ? 'Preparando seu card...' : 'A prévia aparecerá aqui.'}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <label
              className={`${buttonClass('ghost', { size: 'sm' })} relative text-center focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-amarelo`}
            >
              <ImageIcon className="size-4 shrink-0" />
              Galeria
              <input
                type="file"
                accept="image/*"
                aria-label="Adicionar foto da galeria"
                onChange={selectPhoto}
                disabled={sharing}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>
            <label
              className={`${buttonClass('ghost', { size: 'sm' })} relative text-center focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-amarelo`}
            >
              Tirar foto
              <input
                type="file"
                accept="image/*"
                capture="user"
                aria-label="Tirar foto para o card"
                onChange={selectPhoto}
                disabled={sharing}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>
          </div>
          {hasPhoto ? (
            <button
              type="button"
              className={quietButtonClass()}
              onClick={removePhoto}
              disabled={sharing}
            >
              Remover foto
            </button>
          ) : null}
          <p className="text-left text-[12px] text-muted">
            Sua foto fica apenas neste celular, não é enviada nem salva pela aplicação. Ao fechar,
            ela é descartada. O card baixado fica na sua galeria ou pasta de downloads.
          </p>
        </div>

        <InlineError>{error}</InlineError>
        {message ? <Notice tone="neutral">{message}</Notice> : null}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={share}
            disabled={!card || generating || sharing}
            className={buttonClass('primary', { block: true })}
          >
            {sharing ? 'Compartilhando...' : 'Compartilhar no celular'}
          </button>
          {card && !generating ? (
            <a
              href={card.url}
              download={card.file.name}
              className={buttonClass('ghost', { block: true })}
            >
              <DownloadIcon className="size-4" />
              Baixar card (PNG)
            </a>
          ) : null}
          <p className="text-left text-[12px] text-muted">
            O Instagram pode não aparecer no menu de compartilhamento. Nesse caso, baixe a imagem e
            selecione-a ao criar um Story. Formato: 1080 × 1920 px.
          </p>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            disabled={sharing}
            className={buttonClass('ghost', { block: true })}
          >
            Fechar
          </button>
        </div>
      </Modal>
    </>
  )
}
