import Checkpoint from '#models/checkpoint'
import CheckpointCategory from '#models/checkpoint_category'
import Event from '#models/event'
import User from '#models/user'
import Visitor from '#models/visitor'
import type { AuditAction, AuditResource } from '#services/audit'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'
import { DEFAULT_ADMIN } from './01_admin_seeder.js'

/**
 * Massa de testes (só em desenvolvimento): administradores, eventos em
 * andamento, futuro, encerrado e excluído, pontos, visitantes, carimbos e
 * um histórico de auditoria coerente com tudo isso.
 *
 * Sorteios com semente fixa: rodar de novo num banco limpo gera o mesmo
 * resultado. Não faz nada se a massa já existir (visitante "teste").
 * Para recomeçar: node ace migration:fresh --seed
 */

export const DEMO_PASSWORD = 'senha12345'
export const DEMO_VISITOR = { nickname: 'teste', recoveryCode: 'TEST-2345' }

/** Gerador determinístico (mulberry32) */
function seededRandom(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const random = seededRandom(2026)
const between = (min: number, max: number) => min + Math.floor(random() * (max - min + 1))
const chance = (probability: number) => random() < probability
const pick = <T>(items: readonly T[]) => items[Math.floor(random() * items.length)]
const shuffle = <T>(items: readonly T[]) => {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}
/** Instante aleatório entre dois outros */
const timeBetween = (start: DateTime, end: DateTime) =>
  DateTime.fromMillis(start.toMillis() + random() * Math.max(0, end.toMillis() - start.toMillis()))

type CheckpointSeed = {
  name: string
  category: string
  summary?: string
  /** Desativado neste instante (antes, recebeu carimbos) */
  deactivatedAt?: DateTime
  /** Excluído neste instante (antes, recebeu carimbos) */
  deletedAt?: DateTime
}

type EventSeed = {
  name: string
  location: string
  hashtag: string
  description: string
  startsOn: DateTime
  endsOn: DateTime
  createdAt: DateTime
  creator: User
  extraCategories?: string[]
  checkpoints: CheckpointSeed[]
}

const ADMINS = [
  { fullName: 'Maria Souza', email: 'maria.souza@passaporte.local' },
  { fullName: 'João Lima', email: 'joao.lima@passaporte.local' },
  { fullName: 'Ana Beatriz Rocha', email: 'ana.rocha@passaporte.local' },
  { fullName: 'Carla Mendes', email: 'carla.mendes@passaporte.local', inactive: true },
  { fullName: 'Pedro Alves', email: 'pedro.alves@passaporte.local', removed: true },
]

const FIRST_NAMES = [
  'ana',
  'bia',
  'carol',
  'duda',
  'elis',
  'fe',
  'gabi',
  'helo',
  'isa',
  'ju',
  'lari',
  'lu',
  'mari',
  'nina',
  'paty',
  'rafa',
  'sofia',
  'tati',
  'vivi',
  'yasmin',
  'bruno',
  'caio',
  'davi',
  'enzo',
  'gui',
  'heitor',
  'leo',
  'matheus',
  'pedro',
  'theo',
]
const NICK_WORDS = [
  'astro',
  'quimica',
  'robo',
  'dna',
  'fisica',
  'bio',
  'math',
  'eco',
  'code',
  'lab',
  'geo',
  'cosmos',
  'neuro',
  'foton',
]

const LOCATIONS = ['Bloco A', 'Bloco B', 'Pavilhão Central', 'Tenda Externa', 'Auditório']

export default class DemoSeeder extends BaseSeeder {
  static environment = ['development']

  private now = DateTime.now().startOf('minute')
  private audits: Record<string, unknown>[] = []
  private checkins: Record<string, unknown>[] = []

  async run() {
    const exists = await db
      .from('visitors')
      .whereRaw('lower(nickname) = ?', [DEMO_VISITOR.nickname])
      .first()
    if (exists) {
      console.log('Massa de testes já existe; nada a fazer (migration:fresh --seed recomeça)')
      return
    }

    await db.transaction(async (trx) => {
      const admins = await this.seedAdmins(trx)
      const events = await this.seedEvents(trx, admins)
      const visitors = await this.seedVisitors(trx, events.current, events.ended)
      this.seedCheckins(events.current, visitors, 0.75)
      this.seedCheckins(events.ended, visitors, 0.5)
      this.seedSessions(admins, events)

      for (let i = 0; i < this.checkins.length; i += 500) {
        await trx.table('checkins').multiInsert(this.checkins.slice(i, i + 500))
      }
      this.audits.sort(
        (a, b) => (a.created_at as Date).getTime() - (b.created_at as Date).getTime()
      )
      for (let i = 0; i < this.audits.length; i += 500) {
        await trx.table('audit_logs').multiInsert(this.audits.slice(i, i + 500))
      }
    })

    console.log(
      [
        `Massa de testes criada: ${this.checkins.length} carimbos, ${this.audits.length} registros de auditoria`,
        `Administradores: senha ${DEMO_PASSWORD} (${ADMINS.map(({ email }) => email).join(', ')})`,
        `Visitante: apelido ${DEMO_VISITOR.nickname}, código ${DEMO_VISITOR.recoveryCode}`,
      ].join('\n')
    )
  }

  private audit(
    at: DateTime,
    actor: User | { email: string },
    entry: {
      action: AuditAction
      resourceType: AuditResource
      resourceId?: number | string
      resourceName?: string
      eventId?: number
      details?: Record<string, string | number | boolean | null>
    }
  ) {
    const user = 'id' in actor ? actor : null
    this.audits.push({
      actor_user_id: user?.id ?? null,
      actor_name: user?.fullName ?? null,
      actor_email: actor.email,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId === undefined ? null : String(entry.resourceId),
      resource_name: entry.resourceName ?? null,
      event_id: entry.eventId ?? null,
      details: JSON.stringify(entry.details ?? {}),
      created_at: at.toJSDate(),
    })
  }

  private async seedAdmins(trx: TransactionClientContract) {
    const root = await User.query({ client: trx }).where('email', DEFAULT_ADMIN.email).firstOrFail()
    const start = this.now.minus({ days: 400 })
    this.audit(start, root, { action: 'login', resourceType: 'session' })

    const others: User[] = []
    for (const [index, admin] of ADMINS.entries()) {
      const createdAt =
        index < 2 ? start.plus({ hours: index + 1 }) : this.now.minus({ days: 45 - index })
      const user = await User.create(
        {
          fullName: admin.fullName,
          email: admin.email,
          password: DEMO_PASSWORD,
          isActive: true,
          createdAt,
        },
        { client: trx }
      )
      this.audit(createdAt, root, {
        action: 'create',
        resourceType: 'administrator',
        resourceId: user.id,
        resourceName: user.email,
        details: { fullName: user.fullName, email: user.email },
      })
      others.push(user)
    }

    const [maria, joao, ana, carla, pedro] = others

    // Ana trocou o nome de exibição
    this.audit(this.now.minus({ days: 30 }), root, {
      action: 'update',
      resourceType: 'administrator',
      resourceId: ana.id,
      resourceName: ana.email,
      details: {
        previousName: 'Ana Rocha',
        fullName: ana.fullName,
        previousEmail: ana.email,
        email: ana.email,
        passwordChanged: false,
      },
    })

    // Carla desativada; tentou entrar depois
    const deactivatedAt = this.now.minus({ days: 12 })
    carla.isActive = false
    await carla.useTransaction(trx).save()
    this.audit(deactivatedAt, root, {
      action: 'deactivate',
      resourceType: 'administrator',
      resourceId: carla.id,
      resourceName: carla.email,
      details: { isActive: false },
    })
    this.audit(
      deactivatedAt.plus({ days: 2, hours: 3 }),
      { email: carla.email },
      {
        action: 'login_failed',
        resourceType: 'session',
        details: { motivo: 'conta desativada' },
      }
    )

    // Pedro removido (exclusão lógica); tentou entrar depois
    const removedAt = this.now.minus({ days: 8 })
    pedro.isActive = false
    pedro.deletedAt = removedAt
    await pedro.useTransaction(trx).save()
    this.audit(removedAt, root, {
      action: 'delete',
      resourceType: 'administrator',
      resourceId: pedro.id,
      resourceName: pedro.email,
    })
    this.audit(
      removedAt.plus({ days: 1 }),
      { email: pedro.email },
      {
        action: 'login_failed',
        resourceType: 'session',
        details: { motivo: 'conta removida' },
      }
    )

    for (const email of ['teste@exemplo.com', 'admin@admin.com', maria.email]) {
      this.audit(
        timeBetween(this.now.minus({ days: 20 }), this.now),
        { email },
        {
          action: 'login_failed',
          resourceType: 'session',
          details: { motivo: 'e-mail ou senha incorretos' },
        }
      )
    }

    return { root, maria, joao, ana, carla, active: [root, maria, joao, ana] }
  }

  private async seedEvents(
    trx: TransactionClientContract,
    admins: Awaited<ReturnType<DemoSeeder['seedAdmins']>>
  ) {
    const today = this.now.startOf('day')
    const { root, maria, joao, carla } = admins

    const current = await this.createEvent(trx, {
      name: '23ª SNCT – Ciência Delas',
      location: 'Centro de Convenções – Pavilhão 2',
      hashtag: '#CienciaDelas',
      description:
        'Semana Nacional de Ciência e Tecnologia com foco nas mulheres que fazem ciência. Visite os estandes, carimbe seu passaporte e complete a jornada.',
      startsOn: today.minus({ days: 1 }),
      endsOn: today.plus({ days: 1 }),
      createdAt: this.now.minus({ days: 35 }),
      creator: maria,
      extraCategories: ['Exposição'],
      checkpoints: [
        {
          name: 'Mulheres na Astronomia',
          category: 'Pesquisa',
          summary: 'Telescópios, constelações e as astrônomas que mapearam o céu.',
        },
        {
          name: 'Biotecnologia e Saúde',
          category: 'Pesquisa',
          summary: 'Vacinas, enzimas e o laboratório por dentro.',
        },
        { name: 'Química Verde', category: 'Pesquisa' },
        {
          name: 'Robótica Educacional',
          category: 'Pesquisa',
          summary: 'Robôs montados por estudantes da rede pública.',
        },
        { name: 'Inteligência Artificial no Campo', category: 'Pesquisa' },
        {
          name: 'Energia Solar Comunitária',
          category: 'Pesquisa',
          deactivatedAt: this.now.minus({ hours: 5 }),
        },
        {
          name: 'Foguetes de Garrafa PET',
          category: 'Oficina',
          summary: 'Monte e lance seu foguete movido a água e ar.',
        },
        { name: 'Microscopia com Celular', category: 'Oficina' },
        { name: 'Programação com Blocos', category: 'Oficina' },
        {
          name: 'Extração de DNA da Banana',
          category: 'Oficina',
          summary: 'Com detergente, sal e álcool: dá para ver o DNA a olho nu.',
        },
        { name: 'Circuitos com Massinha', category: 'Oficina' },
        { name: 'Cientistas que Mudaram o Mundo', category: 'Apresentação' },
        { name: 'Matemática nas Artes', category: 'Apresentação' },
        { name: 'A Física do Futebol', category: 'Apresentação' },
        {
          name: 'Vozes da Amazônia',
          category: 'Apresentação',
          deletedAt: this.now.minus({ hours: 3 }),
        },
        {
          name: 'Teatro: Marie Curie',
          category: 'Cultural',
          summary: 'Peça curta sobre a vida da primeira mulher a ganhar um Nobel.',
        },
        { name: 'Sarau Ciência Delas', category: 'Cultural' },
        {
          name: 'Cordel da Ciência',
          category: 'Cultural',
          deactivatedAt: this.now.minus({ hours: 8 }),
        },
        { name: 'Introdução ao Arduino', category: 'Curso' },
        { name: 'Primeiros Passos em Python', category: 'Curso' },
        { name: 'Divulgação Científica nas Redes', category: 'Curso' },
        {
          name: 'Planetário Móvel',
          category: 'Exposição',
          summary: 'Sessões de 15 minutos sob a cúpula.',
        },
        { name: 'Museu de Minerais', category: 'Exposição' },
        { name: 'Linha do Tempo das Cientistas Brasileiras', category: 'Exposição' },
        { name: 'Fotografia Científica', category: 'Exposição' },
      ],
    })

    // Categoria criada e excluída antes de receber pontos
    const lecture = await CheckpointCategory.createFor(current.id, 'Palestra', trx)
    lecture.deletedAt = this.now.minus({ days: 20 })
    await lecture.useTransaction(trx).save()
    this.audit(this.now.minus({ days: 33 }), maria, {
      action: 'create',
      resourceType: 'category',
      resourceId: lecture.id,
      resourceName: lecture.name,
      eventId: current.id,
      details: { name: lecture.name },
    })
    this.audit(lecture.deletedAt, joao, {
      action: 'delete',
      resourceType: 'category',
      resourceId: lecture.id,
      resourceName: lecture.name,
      eventId: current.id,
      details: { movedToCategoryId: null },
    })
    this.audit(this.now.minus({ days: 28 }), maria, {
      action: 'update',
      resourceType: 'event',
      resourceId: current.id,
      resourceName: current.name,
      eventId: current.id,
      details: {
        startsOn: current.startsOn.toISODate(),
        endsOn: current.endsOn.toISODate(),
        location: current.location,
      },
    })

    const upcoming = await this.createEvent(trx, {
      name: 'Feira de Ciências das Escolas 2026',
      location: 'Ginásio Municipal',
      hashtag: '#FeiraDeCiencias',
      description: 'Projetos de estudantes do ensino fundamental e médio.',
      startsOn: today.plus({ days: 21 }),
      endsOn: today.plus({ days: 23 }),
      createdAt: this.now.minus({ days: 10 }),
      creator: joao,
      checkpoints: [
        { name: 'Vulcão de Bicarbonato', category: 'Oficina' },
        { name: 'Horta Vertical Inteligente', category: 'Pesquisa' },
        { name: 'Purificador de Água Caseiro', category: 'Pesquisa' },
        { name: 'Sistema Solar em Escala', category: 'Apresentação' },
        { name: 'Robô Seguidor de Linha', category: 'Pesquisa' },
        { name: 'Dança das Moléculas', category: 'Cultural' },
        { name: 'Ilusões de Ótica', category: 'Apresentação' },
        { name: 'Minicurso de Scratch', category: 'Curso' },
      ],
    })

    const ended = await this.createEvent(trx, {
      name: '22ª SNCT – Ciência para Todos',
      location: 'Campus Universitário – Praça Central',
      hashtag: '#SNCT2025',
      description: 'Edição anterior da Semana Nacional de Ciência e Tecnologia.',
      startsOn: today.minus({ days: 368 }),
      endsOn: today.minus({ days: 366 }),
      createdAt: this.now.minus({ days: 399 }),
      creator: root,
      checkpoints: [
        { name: 'Física Divertida', category: 'Apresentação' },
        { name: 'Laboratório de Química Aberto', category: 'Oficina' },
        { name: 'Observação Solar', category: 'Pesquisa' },
        { name: 'Impressão 3D', category: 'Oficina' },
        { name: 'Paleontologia Brasileira', category: 'Pesquisa' },
        { name: 'Corpo Humano Interativo', category: 'Apresentação' },
        { name: 'Coral Universitário', category: 'Cultural' },
        { name: 'Xadrez e Lógica', category: 'Curso' },
        { name: 'Energia dos Ventos', category: 'Pesquisa' },
        { name: 'Matemática com Origami', category: 'Oficina' },
        { name: 'Insetos do Cerrado', category: 'Pesquisa' },
        { name: 'Cinema e Ciência', category: 'Cultural' },
        { name: 'Eletrônica Básica', category: 'Curso' },
        { name: 'Realidade Virtual', category: 'Apresentação' },
      ],
    })

    // Evento cancelado: excluído com os pontos, mesmo deleted_at
    const cancelled = await this.createEvent(trx, {
      name: 'Mostra de Robótica (cancelada)',
      location: 'Escola Técnica Estadual',
      hashtag: '#MostraRobotica',
      description: 'Evento cancelado por falta de espaço.',
      startsOn: today.plus({ days: 40 }),
      endsOn: today.plus({ days: 40 }),
      createdAt: this.now.minus({ days: 20 }),
      creator: carla,
      checkpoints: [
        { name: 'Sumô de Robôs', category: 'Apresentação' },
        { name: 'Drones na Agricultura', category: 'Pesquisa' },
        { name: 'Braço Robótico', category: 'Oficina' },
      ],
    })
    const cancelledAt = this.now.minus({ days: 15 })
    await trx
      .from('checkpoints')
      .where('event_id', cancelled.id)
      .update({ deleted_at: cancelledAt.toJSDate(), updated_at: cancelledAt.toJSDate() })
    cancelled.deletedAt = cancelledAt
    await cancelled.useTransaction(trx).save()
    this.audit(cancelledAt, root, {
      action: 'delete',
      resourceType: 'event',
      resourceId: cancelled.id,
      resourceName: cancelled.name,
      eventId: cancelled.id,
    })

    return { current, upcoming, ended }
  }

  private async createEvent(trx: TransactionClientContract, seed: EventSeed) {
    const { creator, createdAt } = seed
    const slug = await Event.uniqueSlug(seed.name, trx)
    const event = await Event.create(
      {
        name: seed.name,
        slug,
        location: seed.location,
        hashtag: seed.hashtag,
        description: seed.description,
        startsOn: seed.startsOn,
        endsOn: seed.endsOn,
        createdAt,
      },
      { client: trx }
    )
    await CheckpointCategory.createDefaults(event.id, trx)
    for (const name of seed.extraCategories ?? []) {
      const category = await CheckpointCategory.createFor(event.id, name, trx)
      this.audit(createdAt.plus({ minutes: 5 }), creator, {
        action: 'create',
        resourceType: 'category',
        resourceId: category.id,
        resourceName: category.name,
        eventId: event.id,
        details: { name: category.name },
      })
    }
    this.audit(createdAt, creator, {
      action: 'create',
      resourceType: 'event',
      resourceId: event.id,
      resourceName: event.name,
      eventId: event.id,
      details: {
        startsOn: event.startsOn.toISODate(),
        endsOn: event.endsOn.toISODate(),
        location: event.location,
      },
    })

    const categories = await CheckpointCategory.query({ client: trx }).where('event_id', event.id)
    const categoryId = (name: string) => categories.find((category) => category.name === name)!.id

    // Metade dos pontos veio da planilha; o resto foi cadastrado um a um
    const imported = Math.ceil(seed.checkpoints.length / 2)
    const importedAt = createdAt.plus({ days: 1 })
    this.audit(importedAt, creator, {
      action: 'import',
      resourceType: 'checkpoint',
      resourceName: event.name,
      eventId: event.id,
      details: { created: imported },
    })

    for (const [index, checkpointSeed] of seed.checkpoints.entries()) {
      const checkpointCreatedAt =
        index < imported
          ? importedAt
          : createdAt.plus({ days: 2 + index - imported, hours: between(0, 8) })
      const checkpoint = await Checkpoint.create(
        {
          eventId: event.id,
          categoryId: categoryId(checkpointSeed.category),
          code: Checkpoint.formatCode(index + 1),
          name: checkpointSeed.name,
          summary: checkpointSeed.summary ?? null,
          location: `${pick(LOCATIONS)} – Estande ${index + 1}`,
          isActive: !checkpointSeed.deactivatedAt,
          createdAt: checkpointCreatedAt,
          deletedAt: checkpointSeed.deletedAt ?? null,
        },
        { client: trx }
      )
      this.checkpointSeeds.set(checkpoint.id, checkpointSeed)
      this.checkpointsByEvent.set(event.id, [
        ...(this.checkpointsByEvent.get(event.id) ?? []),
        checkpoint,
      ])

      if (index >= imported) {
        this.audit(checkpointCreatedAt, creator, {
          action: 'create',
          resourceType: 'checkpoint',
          resourceId: checkpoint.id,
          resourceName: checkpoint.name,
          eventId: event.id,
          details: { code: checkpoint.code, categoryId: checkpoint.categoryId, isActive: true },
        })
      }
      if (chance(0.25)) {
        this.audit(checkpointCreatedAt.plus({ days: 1, hours: between(1, 6) }), creator, {
          action: 'update',
          resourceType: 'checkpoint',
          resourceId: checkpoint.id,
          resourceName: checkpoint.name,
          eventId: event.id,
          details: { categoryId: checkpoint.categoryId, isActive: true },
        })
      }
      if (checkpointSeed.deactivatedAt) {
        this.audit(checkpointSeed.deactivatedAt, creator, {
          action: 'deactivate',
          resourceType: 'checkpoint',
          resourceId: checkpoint.id,
          resourceName: checkpoint.name,
          eventId: event.id,
          details: { isActive: false },
        })
      }
      if (checkpointSeed.deletedAt) {
        this.audit(checkpointSeed.deletedAt, creator, {
          action: 'delete',
          resourceType: 'checkpoint',
          resourceId: checkpoint.id,
          resourceName: checkpoint.name,
          eventId: event.id,
        })
      }
    }

    return event
  }

  private checkpointSeeds = new Map<number, CheckpointSeed>()
  private checkpointsByEvent = new Map<number, Checkpoint[]>()

  /** Parte dos visitantes vem da edição anterior (cadastro durante ela) */
  private async seedVisitors(trx: TransactionClientContract, current: Event, ended: Event) {
    const nicknames = new Set<string>()
    while (nicknames.size < 90) {
      nicknames.add(
        `${pick(FIRST_NAMES)}${pick(['.', '_', '-', ''])}${pick(NICK_WORDS)}`.slice(0, 20)
      )
    }

    const visitors: Visitor[] = []
    const create = async (nickname: string, recoveryCode: string, deleted = false) => {
      const visitor = new Visitor()
      visitor.useTransaction(trx)
      visitor.nickname = nickname
      visitor.recoveryCode = recoveryCode
      visitor.createdAt = chance(0.4)
        ? timeBetween(ended.startsOn.set({ hour: 8 }), ended.endsOn.set({ hour: 17 }))
        : timeBetween(current.startsOn.set({ hour: 8 }), this.now.minus({ minutes: 30 }))
      if (deleted) visitor.deletedAt = this.now.minus({ hours: 1 })
      await visitor.save()
      return visitor
    }

    visitors.push(await create(DEMO_VISITOR.nickname, DEMO_VISITOR.recoveryCode))
    for (const [index, nickname] of [...nicknames].entries()) {
      const visitor = await create(nickname, Visitor.generateRecoveryCode(), index >= 88)
      if (!visitor.deletedAt) visitors.push(visitor)
    }
    return visitors
  }

  /**
   * Carimbos no evento: cada visitante participa com essa probabilidade.
   * Uns poucos completam o passaporte; o visitante "teste" fica pela metade.
   */
  private seedCheckins(event: Event, visitors: Visitor[], participation: number) {
    const checkpoints = this.checkpointsByEvent.get(event.id) ?? []
    const isOngoing = event.endsOn >= this.now.startOf('day')
    const start = event.startsOn.set({ hour: 9 })
    const end = isOngoing ? this.now : event.endsOn.set({ hour: 18 })
    const open = checkpoints.filter((checkpoint) => {
      const seed = this.checkpointSeeds.get(checkpoint.id)!
      return !seed.deactivatedAt && !seed.deletedAt
    })

    for (const [index, visitor] of visitors.entries()) {
      const isDemo = visitor.nickname === DEMO_VISITOR.nickname
      if (visitor.createdAt > end) continue
      if (!isDemo && !chance(participation)) continue

      const visited = isDemo
        ? shuffle(open).slice(0, Math.floor(open.length / 2))
        : index % 15 === 1
          ? open
          : shuffle(checkpoints).slice(0, between(1, Math.min(14, checkpoints.length)))

      const visitorStart = visitor.createdAt > start ? visitor.createdAt : start
      for (const checkpoint of visited) {
        const seed = this.checkpointSeeds.get(checkpoint.id)!
        const until = seed.deletedAt ?? seed.deactivatedAt ?? end
        if (until <= visitorStart) continue
        const at = timeBetween(visitorStart, until).toJSDate()
        this.checkins.push({
          visitor_id: visitor.id,
          checkpoint_id: checkpoint.id,
          event_id: event.id,
          created_at: at,
          updated_at: at,
        })
      }
    }
  }

  /** Sessões no painel: login, telas abertas, downloads e às vezes logout */
  private seedSessions(
    admins: Awaited<ReturnType<DemoSeeder['seedAdmins']>>,
    events: Awaited<ReturnType<DemoSeeder['seedEvents']>>
  ) {
    const eventIds = [events.current.id, events.upcoming.id, events.ended.id]
    const pages = () => {
      const eventId = pick(eventIds)
      const checkpoint = pick(this.checkpointsByEvent.get(eventId) ?? [])
      return pick([
        '/admin',
        '/admin/eventos/novo',
        `/admin/eventos/${eventId}`,
        `/admin/eventos/${eventId}/editar`,
        `/admin/eventos/${eventId}/categorias`,
        `/admin/eventos/${eventId}/qrcodes`,
        `/admin/eventos/${eventId}/importar`,
        `/admin/eventos/${eventId}/pontos/novo`,
        `/admin/eventos/${eventId}/pontos/${checkpoint.id}`,
        '/admin/participantes',
        '/admin/auditoria',
        '/admin/administradores',
      ])
    }

    for (let session = 0; session < 70; session++) {
      const actor = pick(admins.active)
      let at = timeBetween(this.now.minus({ days: 40 }), this.now.minus({ minutes: 20 }))
      const later = () => (at = at.plus({ seconds: between(10, 240) }))

      this.audit(at, actor, { action: 'login', resourceType: 'session' })
      for (let view = between(2, 10); view > 0; view--) {
        this.audit(later(), actor, { action: 'view', resourceType: 'page', resourceName: pages() })
      }
      if (chance(0.2)) {
        this.audit(later(), actor, {
          action: 'download',
          resourceType: 'file',
          resourceName: pick(['/modelo-pontos.csv', '/modelo-pontos.xlsx']),
        })
      }
      if (chance(0.3)) {
        const event = pick([events.current, events.upcoming])
        const checkpoints = (this.checkpointsByEvent.get(event.id) ?? []).filter(
          (checkpoint) => checkpoint.isActive && !checkpoint.deletedAt
        )
        const formato = pick(['cartaz', 'etiquetas', 'entrada'] as const)
        this.audit(later(), actor, {
          action: 'download',
          resourceType: 'event',
          resourceId: event.id,
          resourceName: event.name,
          eventId: event.id,
          details:
            formato === 'entrada'
              ? { arquivo: 'PDF de QR code', formato }
              : {
                  arquivo: 'PDF de QR codes',
                  formato,
                  pontos: checkpoints.map((checkpoint) => checkpoint.code).join(', '),
                },
        })
      }
      if (chance(0.6)) this.audit(later(), actor, { action: 'logout', resourceType: 'session' })
    }
  }
}
