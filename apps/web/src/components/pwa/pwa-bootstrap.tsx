'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { buttonClass } from '@/components/ui/button'
import { Actions } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import {
  INSTALL_DISMISSED_KEY,
  canOfferInstall,
  installPromptMode,
  mobileInstallPlatform,
} from '@/lib/pwa-install.mjs'
import {
  CHANGE_EVENT,
  readOffline,
  retryCheckins,
  syncCheckins,
  type OfflineState,
} from '../../../public/offline-store.mjs'

type InstallEvent = Event & {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: string }>
}
type InstallPlatform = 'ios' | 'android' | 'other'

export function PwaBootstrap() {
  const pathname = usePathname()
  const installDialogRef = useRef<HTMLDialogElement>(null)
  const installShown = useRef(false)
  const [queue, setQueue] = useState<OfflineState>({
    scope: null,
    entries: [],
  })
  const [online, setOnline] = useState(true)
  const [install, setInstall] = useState<InstallEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [installChecked, setInstallChecked] = useState(false)
  const [installPlatform, setInstallPlatform] = useState<InstallPlatform | null>(null)
  const [installDismissed, setInstallDismissed] = useState(false)
  const [installFallbackReady, setInstallFallbackReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [syncError, setSyncError] = useState('')
  const visitorPage = !pathname.startsWith('/admin') && !pathname.startsWith('/recuperar')

  const sync = useCallback(async () => {
    if (!navigator.onLine) return
    setBusy(true)
    try {
      await syncCheckins(localStorage)
      setSyncError('')
    } catch {
      // A failed request leaves pending entries intact; never erase them for network trouble.
      setSyncError('Aguardando uma conexão estável para confirmar as visitas.')
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    if (!visitorPage) return
    if ('serviceWorker' in navigator && window.isSecureContext) {
      void navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .catch(() => {})
    }
    const read = () => {
      setOnline(navigator.onLine)
      setInstalled(
        window.matchMedia('(display-mode: standalone)').matches ||
          ('standalone' in navigator && navigator.standalone === true)
      )
      try {
        setQueue(readOffline(localStorage))
      } catch {
        /* Device storage unavailable. */
      }
    }
    const reconnect = () => {
      read()
      void sync()
    }
    const beforeInstall = (event: Event) => {
      event.preventDefault()
      setInstall(event as InstallEvent)
    }
    const appInstalled = () => {
      setInstalled(true)
      setInstall(null)
      installDialogRef.current?.close()
    }
    const initialSetup = window.setTimeout(() => {
      setInstallPlatform(
        mobileInstallPlatform({
          userAgent: navigator.userAgent,
          maxTouchPoints: navigator.maxTouchPoints,
          viewportWidth: window.innerWidth,
        })
      )
      try {
        setInstallDismissed(sessionStorage.getItem(INSTALL_DISMISSED_KEY) === '1')
      } catch {
        /* Session storage is optional. */
      }
      read()
      setInstallChecked(true)
      void sync()
    }, 0)
    window.addEventListener(CHANGE_EVENT, read)
    window.addEventListener('storage', read)
    window.addEventListener('online', reconnect)
    window.addEventListener('offline', read)
    window.addEventListener('focus', reconnect)
    window.addEventListener('beforeinstallprompt', beforeInstall)
    window.addEventListener('appinstalled', appInstalled)
    const timer = window.setInterval(() => {
      if (navigator.onLine) void sync()
    }, 30000)
    return () => {
      window.clearTimeout(initialSetup)
      window.clearInterval(timer)
      window.removeEventListener(CHANGE_EVENT, read)
      window.removeEventListener('storage', read)
      window.removeEventListener('online', reconnect)
      window.removeEventListener('offline', read)
      window.removeEventListener('focus', reconnect)
      window.removeEventListener('beforeinstallprompt', beforeInstall)
      window.removeEventListener('appinstalled', appInstalled)
    }
  }, [visitorPage, pathname, sync])

  const canInstall =
    installChecked &&
    canOfferInstall({
      pathname,
      platform: installPlatform,
      installed,
      dismissed: installDismissed,
    })

  useEffect(() => {
    if (!canInstall || install || installPlatform === 'ios') return
    const timer = window.setTimeout(() => setInstallFallbackReady(true), 3000)
    return () => window.clearTimeout(timer)
  }, [canInstall, install, installPlatform])

  const installMode = installPromptMode(installPlatform, Boolean(install), installFallbackReady)

  useEffect(() => {
    if (!canInstall) {
      installDialogRef.current?.close()
      return
    }
    if (!installMode || installShown.current) return
    installShown.current = true
    installDialogRef.current?.showModal()
  }, [canInstall, installMode])

  function rememberInstallDismissal() {
    try {
      sessionStorage.setItem(INSTALL_DISMISSED_KEY, '1')
    } catch {
      /* Session storage is optional. */
    }
  }

  function dismissInstall() {
    rememberInstallDismissal()
    setInstallDismissed(true)
  }

  async function requestInstall() {
    const prompt = install
    if (!prompt) return
    rememberInstallDismissal()
    setInstall(null)
    try {
      await prompt.prompt()
      await prompt.userChoice
    } catch {
      // Browsers may revoke a captured prompt after eligibility changes.
    } finally {
      installDialogRef.current?.close()
    }
  }

  if (!visitorPage) return null
  const pending = queue.entries.filter((entry) => entry.status === 'pending').length
  const failed = queue.entries.filter((entry) => entry.status === 'error').length
  const synced = queue.entries.filter((entry) => entry.status === 'synced').length

  return (
    <>
      <aside
        aria-label="Sincronização"
        className="mx-auto mb-6 flex w-full max-w-lg flex-col gap-3 px-5 text-[14px] text-muted"
      >
        {!online || pending || failed || synced ? (
          <details className="rounded-m border-2 border-line bg-surface px-4 py-2">
            <summary className="min-h-11 cursor-pointer py-2 font-semibold text-fg">
              {!online ? 'Sem conexão · ' : ''}
              {pending} pendentes · {synced} sincronizados
              {failed ? ` · ${failed} com erro` : ''}
            </summary>
            <p role="status" className="mb-2">
              {syncError ||
                'Visitas pendentes aguardam validação. A sincronização acontece com o app aberto quando a conexão voltar.'}
            </p>
            {queue.entries.length ? (
              <ul className="flex flex-col gap-2">
                {queue.entries.map((entry, index) => (
                  <li key={entry.qrToken} className="border-t border-line py-2">
                    Visita {index + 1}:{' '}
                    {entry.status === 'synced'
                      ? 'sincronizada, carimbo confirmado'
                      : entry.status === 'error'
                        ? 'erro ao confirmar'
                        : 'pendente de confirmação'}
                    .{entry.message ? ` ${entry.message}` : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Na primeira visita, conecte-se para criar ou recuperar seu passaporte.</p>
            )}
            {pending || failed ? (
              <button
                type="button"
                disabled={busy || !online}
                className={buttonClass('ghost', { block: true })}
                onClick={() => {
                  retryCheckins(localStorage)
                  void sync()
                }}
              >
                {busy ? 'Sincronizando…' : 'Tentar sincronizar novamente'}
              </button>
            ) : null}
          </details>
        ) : null}
      </aside>

      <Modal dialogRef={installDialogRef} title="Instalar o Passaporte" onClose={dismissInstall}>
        <div className="flex flex-col gap-3 text-[15px] text-muted">
          {installMode === 'native' ? (
            <p>
              Instale o Passaporte na tela inicial para abrir mais rápido e acompanhar as visitas
              como um aplicativo.
            </p>
          ) : installMode === 'ios' ? (
            <ol className="flex list-decimal flex-col gap-2 pl-5">
              <li>Toque no botão Compartilhar do navegador.</li>
              <li>Escolha “Adicionar à Tela de Início”.</li>
              <li>Confirme em “Adicionar”.</li>
            </ol>
          ) : (
            <div className="flex flex-col gap-2">
              <p>Este navegador não liberou a instalação automática.</p>
              <p>
                Procure por “Instalar aplicativo” ou “Adicionar à tela inicial” no menu. Se a opção
                não aparecer, abra esta página no Chrome ou Safari.
              </p>
            </div>
          )}
          <div className="rounded-m bg-surface-2 p-3 text-[13px] leading-relaxed">
            <p className="font-display font-bold text-fg">Antes de ficar sem internet</p>
            <p>
              Abra o Passaporte com Wi-Fi ou dados móveis e crie ou recupere seu passaporte. Depois,
              os QR codes lidos sem conexão ficam salvos neste celular e são enviados com o
              aplicativo aberto quando a internet voltar.
            </p>
          </div>
        </div>
        <Actions align="end">
          <button
            type="button"
            className={buttonClass('ghost')}
            onClick={() => installDialogRef.current?.close()}
          >
            {installMode === 'native' ? 'Agora não' : 'Entendi'}
          </button>
          {installMode === 'native' ? (
            <button
              type="button"
              autoFocus
              className={buttonClass('primary')}
              onClick={requestInstall}
            >
              Instalar agora
            </button>
          ) : null}
        </Actions>
      </Modal>
    </>
  )
}
