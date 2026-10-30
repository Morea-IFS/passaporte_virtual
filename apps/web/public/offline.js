import {
  CHANGE_EVENT,
  readOffline,
  enqueueCheckin,
  retryCheckins,
  syncCheckins,
} from '/offline-store.mjs'

const message = document.getElementById('message')
const connection = document.getElementById('connection')
const list = document.getElementById('queue')
const retry = document.getElementById('retry')
let storage
let queuedScope
try {
  storage = localStorage
} catch {
  /* UI below explains unavailable device storage. */
}

function render() {
  connection.textContent = navigator.onLine
    ? 'Conexão disponível. Verificando a sincronização…'
    : 'Você está sem conexão.'
  const state = storage ? readOffline(storage) : { entries: [] }
  list.replaceChildren()
  if (!state.entries.length) {
    const item = document.createElement('li')
    item.textContent = 'Nenhuma visita guardada neste celular.'
    list.append(item)
  }
  state.entries.forEach((entry, index) => {
    const item = document.createElement('li')
    const labels = {
      pending: 'Pendente — aguardando validação',
      synced: 'Sincronizado — carimbo confirmado',
      error: 'Erro — tente novamente',
    }
    item.textContent = `Visita ${index + 1}: ${labels[entry.status]}. ${entry.message || ''}`
    list.append(item)
  })
}

async function sync() {
  if (!storage || !navigator.onLine) {
    render()
    return
  }
  retry.disabled = true
  try {
    await syncCheckins(storage)
    const state = readOffline(storage)
    connection.textContent = state.entries.some((entry) => entry.status === 'pending')
      ? 'Ainda há visitas aguardando validação. Mantenha o app aberto para tentar novamente.'
      : 'Sincronização verificada. Abra seu passaporte para ver os carimbos.'
    if (queuedScope && state.scope !== queuedScope) {
      message.textContent =
        'O passaporte deste celular mudou. Abra este QR novamente com conexão para registrar sua visita.'
    } else if (!state.scope)
      message.textContent = 'Conecte-se e crie ou recupere seu passaporte para registrar visitas.'
  } catch {
    connection.textContent = 'Aguardando uma conexão estável. Seus registros continuam guardados.'
  } finally {
    retry.disabled = false
  }
}

try {
  if (!storage) throw new Error('storage')
  const state = readOffline(storage)
  const match = location.pathname.match(/^\/c\/([A-Za-z0-9_-]{1,64})\/?$/)
  if (!state.scope) {
    message.textContent =
      'Este celular ainda precisa se conectar para criar ou recuperar seu passaporte. Este QR não foi registrado.'
  } else if (match) {
    queuedScope = state.scope
    const entry = enqueueCheckin(storage, state.scope, match[1])
    message.textContent =
      entry.status === 'synced'
        ? 'Este ponto já foi sincronizado. Abra o passaporte quando tiver conexão.'
        : 'QR guardado como visita pendente. O ponto e o evento serão verificados quando a conexão voltar.'
  } else {
    message.textContent =
      'Você pode abrir os QR codes dos pontos para guardar visitas pendentes. O passaporte completo volta com a conexão.'
  }
} catch {
  message.textContent =
    'O navegador não permitiu guardar esta visita. Conecte-se e abra o QR novamente para confirmar seu carimbo.'
}

retry.addEventListener('click', () => {
  if (storage) retryCheckins(storage)
  void sync()
})
window.addEventListener('online', () => {
  render()
  void sync()
})
window.addEventListener('offline', render)
window.addEventListener('storage', render)
window.addEventListener(CHANGE_EVENT, render)
setInterval(() => {
  if (navigator.onLine) void sync()
}, 30000)
render()
void sync()
