'use client'

import { useEffect, useRef, useState } from 'react'
import { buttonClass } from '@/components/ui/button'
import { Field, describedBy } from '@/components/ui/field'
import { ImageIcon, TrashIcon } from '@/components/ui/icons'
import { ImageCropDialog } from '@/components/ui/image-crop-dialog'
import { cropToFile, IMAGE_SPECS, loadImage, matchesAspect } from '@/lib/image'

/** Botões sobre a imagem: pílula clara com sombra, legível sobre qualquer foto */
const overlayButton =
  'inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full bg-surface/95 px-3.5 font-display text-[13px] font-extrabold text-accent shadow-[0_2px_10px_rgba(29,17,71,0.3)] hover:bg-surface'

type ImageInputProps = {
  name: keyof typeof IMAGE_SPECS
  label: string
  /** Para que serve a imagem (o tamanho ideal é acrescentado na dica) */
  description: string
  currentUrl: string | null
  error?: string
}

/**
 * Upload de imagem com prévia. Se a proporção não for a do formato, abre o
 * enquadramento; a imagem enviada já sai no tamanho final.
 */
export function ImageInput({ name, label, description, currentUrl, error }: ImageInputProps) {
  const spec = IMAGE_SPECS[name]
  const isLogo = name === 'logo'
  const id = `field-${name}`
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  // Imagem aguardando enquadramento (null depois de confirmar ou cancelar)
  const pendingRef = useRef<{ src: string; fileName: string } | null>(null)
  // Último arquivo confirmado: volta para o input se o enquadramento for cancelado
  const confirmedRef = useRef<File | null>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [removed, setRemoved] = useState(false)
  const [problem, setProblem] = useState<string>()

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const info = {
    title: label,
    content: (
      <>
        <p>{description}</p>
        <p>
          Tamanho ideal: <b className="text-fg">{spec.label}</b>. Em outra proporção, você ajusta o
          enquadramento ao escolher a imagem; ela é salva nesse tamanho.
        </p>
        <p>Formatos: JPG, PNG ou WebP, até 5 MB.</p>
      </>
    ),
  }
  const shown = preview ?? (removed ? null : currentUrl)

  /** Põe o arquivo no input do formulário (ou limpa, com null) */
  function setInputFile(file: File | null) {
    if (!inputRef.current) return
    const transfer = new DataTransfer()
    if (file) transfer.items.add(file)
    inputRef.current.files = transfer.files
  }

  function applyFile(file: File) {
    confirmedRef.current = file
    setInputFile(file)
    setPreview(URL.createObjectURL(file))
    setRemoved(false)
  }

  function discardPending() {
    if (pendingRef.current) URL.revokeObjectURL(pendingRef.current.src)
    pendingRef.current = null
    setCropSrc(null)
  }

  async function onSelect(file: File | undefined) {
    setProblem(undefined)
    if (!file) return
    const src = URL.createObjectURL(file)
    try {
      const image = await loadImage(src)
      const whole = { x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight }
      if (matchesAspect(whole.width, whole.height, spec)) {
        // Já na proporção certa: só ajusta para o tamanho final
        applyFile(await cropToFile(src, whole, spec, file.name))
        URL.revokeObjectURL(src)
        return
      }
      pendingRef.current = { src, fileName: file.name }
      setCropSrc(src)
      dialogRef.current?.showModal()
    } catch {
      URL.revokeObjectURL(src)
      setInputFile(confirmedRef.current)
      setProblem('Não foi possível ler esta imagem. Tente outro arquivo.')
    }
  }

  return (
    <Field id={id} label={label} as="group" error={error ?? problem} info={info}>
      {/* Input único do campo; os rótulos "Escolher"/"Trocar" apontam para ele */}
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-invalid={error || problem ? true : undefined}
        aria-describedby={describedBy(id, error ?? problem)}
        className="peer sr-only"
        onChange={(e) => onSelect(e.target.files?.[0])}
      />
      {removed ? (
        <input type="hidden" name={name === 'image' ? 'removeImage' : 'removeLogo'} value="on" />
      ) : null}

      <div
        className={`relative overflow-hidden rounded-m peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amarelo ${isLogo ? 'aspect-square w-44' : 'aspect-video w-full max-w-md'}`}
      >
        {shown ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- prévia local (blob:) ou upload da API */}
            <img
              src={shown}
              alt=""
              className={`size-full ${isLogo ? 'bg-creme object-contain p-3' : 'object-cover'}`}
            />
            <div className="absolute inset-x-2 bottom-2 flex justify-end gap-2">
              <label htmlFor={id} className={overlayButton}>
                Trocar
              </label>
              {currentUrl && !preview ? (
                <button type="button" onClick={() => setRemoved(true)} className={overlayButton}>
                  <TrashIcon className="size-4" />
                  <span className={isLogo ? 'sr-only' : ''}>Remover</span>
                </button>
              ) : null}
            </div>
          </>
        ) : removed ? (
          <div className="flex size-full flex-col items-center justify-center gap-2 border-2 border-dashed border-line bg-surface-2 p-4 text-center">
            <span className="text-[14px] text-muted">A imagem será removida ao salvar.</span>
            <button
              type="button"
              onClick={() => setRemoved(false)}
              className={buttonClass('ghost', { size: 'sm' })}
            >
              Desfazer
            </button>
          </div>
        ) : (
          <label
            htmlFor={id}
            className="flex size-full cursor-pointer flex-col items-center justify-center gap-1.5 border-2 border-dashed border-line bg-surface-2 p-4 text-center text-muted transition-colors hover:border-accent hover:text-accent"
          >
            <ImageIcon className="size-7" />
            <span className="font-display text-[14px] font-extrabold text-accent">
              Escolher imagem
            </span>
            <span className="text-[12px]">{spec.label}</span>
          </label>
        )}
      </div>

      <ImageCropDialog
        dialogRef={dialogRef}
        src={cropSrc}
        aspect={spec.width / spec.height}
        description={`A imagem será salva em ${spec.label}. Arraste para posicionar e use o zoom.`}
        onConfirm={async (area) => {
          const pending = pendingRef.current
          if (!pending) return
          try {
            applyFile(await cropToFile(pending.src, area, spec, pending.fileName))
          } catch {
            setInputFile(confirmedRef.current)
            setProblem('Não foi possível processar a imagem. Tente outro arquivo.')
          }
          discardPending()
          dialogRef.current?.close()
        }}
        onCancel={() => {
          // Fechou sem confirmar: volta ao último arquivo confirmado
          if (pendingRef.current) setInputFile(confirmedRef.current)
          discardPending()
          dialogRef.current?.close()
        }}
      />
    </Field>
  )
}
