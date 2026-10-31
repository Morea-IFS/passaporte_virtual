'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { buttonClass } from '@/components/ui/button'
import {
  CHANGE_EVENT,
  readOffline,
  retryCheckins,
  syncCheckins,
  type OfflineState,
} from '../../../public/offline-store.mjs'

type InstallEvent = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> }

export function PwaBootstrap() {
  const pathname = usePathname()
  const [queue, setQueue] = useState<OfflineState>({ scope: null, entries: [] })
  const [online, setOnline] = useState(true)
  const [install, setInstall] = useState<InstallEvent | null>(null)
  const [installed, setInstalled] = useState(false)
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
    const initialRead = window.setTimeout(reconnect, 0)
    window.addEventListener(CHANGE_EVENT, read)
    window.addEventListener('storage', read)
    window.addEventListener('online', reconnect)
    window.addEventListener('offline', read)
    window.addEventListener('focus', reconnect)
    window.addEventListener('beforeinstallprompt', beforeInstall)
    const timer = window.setInterval(() => {
      if (navigator.onLine) void sync()
    }, 30000)
    return () => {
      window.clearTimeout(initialRead)
      window.clearInterval(timer)
      window.removeEventListener(CHANGE_EVENT, read)
      window.removeEventListener('storage', read)
      window.removeEventListener('online', reconnect)
      window.removeEventListener('offline', read)
      window.removeEventListener('focus', reconnect)
      window.removeEventListener('beforeinstallprompt', beforeInstall)
    }
  }, [visitorPage, pathname, sync])

  if (!visitorPage) return null
  const pending = queue.entries.filter((entry) => entry.status === 'pending').length
  const failed = queue.entries.filter((entry) => entry.status === 'error').length
  const synced = queue.entries.filter((entry) => entry.status === 'synced').length

  return (
    <aside
      aria-label="Aplicativo e sincronização"
      className="mx-auto mb-6 flex w-full max-w-lg flex-col gap-3 px-5 text-[14px] text-muted"
    >
      {!online || pending || failed || synced ? (
        <details className="rounded-m border-2 border-line bg-surface px-4 py-2">
          <summary className="min-h-11 cursor-pointer py-2 font-semibold text-fg">
            {!online ? 'Sem conexão · ' : ''}
            {pending} pendentes · {synced} sincronizados{failed ? ` · ${failed} com erro` : ''}
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
      {!installed ? (
        <details>
          <summary className="min-h-11 cursor-pointer py-3 text-center font-semibold">
            Instalar no celular
          </summary>
          <p>
            iPhone: no Safari, toque em Compartilhar e em “Adicionar à Tela de Início”. Android: no
            menu do navegador, escolha “Instalar aplicativo” ou “Adicionar à tela inicial”.
          </p>
          <p className="mt-2">Abra uma vez com conexão antes de usar os QR codes offline.</p>
          {install ? (
            <button
              type="button"
              className={buttonClass('ghost', { block: true })}
              onClick={async () => {
                await install.prompt()
                await install.userChoice
                setInstall(null)
              }}
            >
              Instalar Passaporte
            </button>
          ) : null}
        </details>
      ) : null}
    </aside>
  )
}
