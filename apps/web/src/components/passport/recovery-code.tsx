import { CopyButton } from '@/components/ui/copy-button'

/**
 * Código de recuperação do passaporte (RF21), com copiar e a explicação
 * de como usar em outro celular.
 */
export function RecoveryCode({ code, nickname }: { code: string; nickname?: string }) {
  return (
    <div className="flex w-full flex-col gap-1 rounded-m bg-surface-2 p-4 text-left">
      <p className="font-display text-[13px] font-bold">Seu código de recuperação</p>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xl font-bold tracking-wider text-accent">{code}</span>
        <CopyButton value={code} label="Copiar" />
      </div>
      <p className="text-[13px] text-muted">
        Guarde (um print serve). Em outro celular, toque em &quot;Já tenho passaporte&quot; e
        informe o apelido{nickname ? <b className="text-fg"> {nickname}</b> : null} e este código.
      </p>
    </div>
  )
}
