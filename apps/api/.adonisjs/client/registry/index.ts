/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'drive.fs.serve': {
    methods: ["GET","HEAD"],
    pattern: '/uploads/*',
    tokens: [[0,"uploads"],[2,"*"]],
    types: placeholder as Registry['drive.fs.serve']['types'],
  },
  'auth.access_tokens.store': {
    methods: ["POST"],
    pattern: '/api/v1/auth/login',
    tokens: [[0,"api"],[0,"v1"],[0,"auth"],[0,"login"]],
    types: placeholder as Registry['auth.access_tokens.store']['types'],
  },
  'profile.profile.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/profile',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"profile"]],
    types: placeholder as Registry['profile.profile.show']['types'],
  },
  'profile.access_tokens.destroy': {
    methods: ["POST"],
    pattern: '/api/v1/account/logout',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"logout"]],
    types: placeholder as Registry['profile.access_tokens.destroy']['types'],
  },
  'public.checkpoints.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/public/checkpoints/:token',
    tokens: [[0,"api"],[0,"v1"],[0,"public"],[0,"checkpoints"],[1,"token"]],
    types: placeholder as Registry['public.checkpoints.show']['types'],
  },
  'public.events.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/public/events',
    tokens: [[0,"api"],[0,"v1"],[0,"public"],[0,"events"]],
    types: placeholder as Registry['public.events.index']['types'],
  },
  'public.events.ranking': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/public/events/:slug/ranking',
    tokens: [[0,"api"],[0,"v1"],[0,"public"],[0,"events"],[1,"slug"],[0,"ranking"]],
    types: placeholder as Registry['public.events.ranking']['types'],
  },
  'public.events.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/public/events/:slug',
    tokens: [[0,"api"],[0,"v1"],[0,"public"],[0,"events"],[1,"slug"]],
    types: placeholder as Registry['public.events.show']['types'],
  },
  'visitor.nickname': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/visitor/nickname',
    tokens: [[0,"api"],[0,"v1"],[0,"visitor"],[0,"nickname"]],
    types: placeholder as Registry['visitor.nickname']['types'],
  },
  'visitor.register': {
    methods: ["POST"],
    pattern: '/api/v1/visitor',
    tokens: [[0,"api"],[0,"v1"],[0,"visitor"]],
    types: placeholder as Registry['visitor.register']['types'],
  },
  'visitor.recover': {
    methods: ["POST"],
    pattern: '/api/v1/visitor/recover',
    tokens: [[0,"api"],[0,"v1"],[0,"visitor"],[0,"recover"]],
    types: placeholder as Registry['visitor.recover']['types'],
  },
  'visitor.me': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/visitor/me',
    tokens: [[0,"api"],[0,"v1"],[0,"visitor"],[0,"me"]],
    types: placeholder as Registry['visitor.me']['types'],
  },
  'visitor.logout': {
    methods: ["POST"],
    pattern: '/api/v1/visitor/logout',
    tokens: [[0,"api"],[0,"v1"],[0,"visitor"],[0,"logout"]],
    types: placeholder as Registry['visitor.logout']['types'],
  },
  'visitor.checkins.store': {
    methods: ["POST"],
    pattern: '/api/v1/visitor/checkins',
    tokens: [[0,"api"],[0,"v1"],[0,"visitor"],[0,"checkins"]],
    types: placeholder as Registry['visitor.checkins.store']['types'],
  },
  'visitor.passports.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/visitor/passports',
    tokens: [[0,"api"],[0,"v1"],[0,"visitor"],[0,"passports"]],
    types: placeholder as Registry['visitor.passports.index']['types'],
  },
  'visitor.passports.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/visitor/passports/:slug',
    tokens: [[0,"api"],[0,"v1"],[0,"visitor"],[0,"passports"],[1,"slug"]],
    types: placeholder as Registry['visitor.passports.show']['types'],
  },
  'visitor.passports.join': {
    methods: ["POST"],
    pattern: '/api/v1/visitor/passports/:slug/join',
    tokens: [[0,"api"],[0,"v1"],[0,"visitor"],[0,"passports"],[1,"slug"],[0,"join"]],
    types: placeholder as Registry['visitor.passports.join']['types'],
  },
  'visitor.evaluation.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/visitor/events/:slug/evaluation',
    tokens: [[0,"api"],[0,"v1"],[0,"visitor"],[0,"events"],[1,"slug"],[0,"evaluation"]],
    types: placeholder as Registry['visitor.evaluation.show']['types'],
  },
  'visitor.evaluation.store': {
    methods: ["POST"],
    pattern: '/api/v1/visitor/events/:slug/evaluation',
    tokens: [[0,"api"],[0,"v1"],[0,"visitor"],[0,"events"],[1,"slug"],[0,"evaluation"]],
    types: placeholder as Registry['visitor.evaluation.store']['types'],
  },
  'admin.administrators.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/administrators',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"administrators"]],
    types: placeholder as Registry['admin.administrators.index']['types'],
  },
  'admin.administrators.store': {
    methods: ["POST"],
    pattern: '/api/v1/admin/administrators',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"administrators"]],
    types: placeholder as Registry['admin.administrators.store']['types'],
  },
  'admin.administrators.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/administrators/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"administrators"],[1,"id"]],
    types: placeholder as Registry['admin.administrators.show']['types'],
  },
  'admin.administrators.update': {
    methods: ["PUT","PATCH"],
    pattern: '/api/v1/admin/administrators/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"administrators"],[1,"id"]],
    types: placeholder as Registry['admin.administrators.update']['types'],
  },
  'admin.administrators.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/admin/administrators/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"administrators"],[1,"id"]],
    types: placeholder as Registry['admin.administrators.destroy']['types'],
  },
  'admin.administrators.status': {
    methods: ["PATCH"],
    pattern: '/api/v1/admin/administrators/:id/status',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"administrators"],[1,"id"],[0,"status"]],
    types: placeholder as Registry['admin.administrators.status']['types'],
  },
  'admin.audit.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/audit-logs',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"audit-logs"]],
    types: placeholder as Registry['admin.audit.index']['types'],
  },
  'admin.audit.options': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/audit-logs/options',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"audit-logs"],[0,"options"]],
    types: placeholder as Registry['admin.audit.options']['types'],
  },
  'admin.audit.track': {
    methods: ["POST"],
    pattern: '/api/v1/admin/audit-logs/track',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"audit-logs"],[0,"track"]],
    types: placeholder as Registry['admin.audit.track']['types'],
  },
  'admin.audit.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/audit-logs/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"audit-logs"],[1,"id"]],
    types: placeholder as Registry['admin.audit.show']['types'],
  },
  'admin.participants.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/participants',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"participants"]],
    types: placeholder as Registry['admin.participants.index']['types'],
  },
  'admin.participants.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/participants/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"participants"],[1,"id"]],
    types: placeholder as Registry['admin.participants.show']['types'],
  },
  'admin.participants.checkins': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/participants/:id/checkins',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"participants"],[1,"id"],[0,"checkins"]],
    types: placeholder as Registry['admin.participants.checkins']['types'],
  },
  'admin.events.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/events',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"events"]],
    types: placeholder as Registry['admin.events.index']['types'],
  },
  'admin.events.store': {
    methods: ["POST"],
    pattern: '/api/v1/admin/events',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"events"]],
    types: placeholder as Registry['admin.events.store']['types'],
  },
  'admin.events.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/events/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"events"],[1,"id"]],
    types: placeholder as Registry['admin.events.show']['types'],
  },
  'admin.events.update': {
    methods: ["PUT","PATCH"],
    pattern: '/api/v1/admin/events/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"events"],[1,"id"]],
    types: placeholder as Registry['admin.events.update']['types'],
  },
  'admin.events.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/admin/events/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"events"],[1,"id"]],
    types: placeholder as Registry['admin.events.destroy']['types'],
  },
  'admin.events.analytics': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/events/:eventId/analytics',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"events"],[1,"eventId"],[0,"analytics"]],
    types: placeholder as Registry['admin.events.analytics']['types'],
  },
  'admin.events.analytics.export': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/events/:eventId/analytics/export',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"events"],[1,"eventId"],[0,"analytics"],[0,"export"]],
    types: placeholder as Registry['admin.events.analytics.export']['types'],
  },
  'admin.events.evaluations': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/events/:eventId/evaluations',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"events"],[1,"eventId"],[0,"evaluations"]],
    types: placeholder as Registry['admin.events.evaluations']['types'],
  },
  'admin.events.checkpoints.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/events/:eventId/checkpoints',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"events"],[1,"eventId"],[0,"checkpoints"]],
    types: placeholder as Registry['admin.events.checkpoints.index']['types'],
  },
  'admin.events.checkpoints.store': {
    methods: ["POST"],
    pattern: '/api/v1/admin/events/:eventId/checkpoints',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"events"],[1,"eventId"],[0,"checkpoints"]],
    types: placeholder as Registry['admin.events.checkpoints.store']['types'],
  },
  'admin.events.checkpoints.import': {
    methods: ["POST"],
    pattern: '/api/v1/admin/events/:eventId/checkpoints/import',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"events"],[1,"eventId"],[0,"checkpoints"],[0,"import"]],
    types: placeholder as Registry['admin.events.checkpoints.import']['types'],
  },
  'admin.events.categories.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/events/:eventId/categories',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"events"],[1,"eventId"],[0,"categories"]],
    types: placeholder as Registry['admin.events.categories.index']['types'],
  },
  'admin.events.categories.store': {
    methods: ["POST"],
    pattern: '/api/v1/admin/events/:eventId/categories',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"events"],[1,"eventId"],[0,"categories"]],
    types: placeholder as Registry['admin.events.categories.store']['types'],
  },
  'admin.categories.update': {
    methods: ["PUT"],
    pattern: '/api/v1/admin/categories/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"categories"],[1,"id"]],
    types: placeholder as Registry['admin.categories.update']['types'],
  },
  'admin.categories.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/admin/categories/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"categories"],[1,"id"]],
    types: placeholder as Registry['admin.categories.destroy']['types'],
  },
  'admin.checkpoints.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/checkpoints/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"checkpoints"],[1,"id"]],
    types: placeholder as Registry['admin.checkpoints.show']['types'],
  },
  'admin.checkpoints.update': {
    methods: ["PUT"],
    pattern: '/api/v1/admin/checkpoints/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"checkpoints"],[1,"id"]],
    types: placeholder as Registry['admin.checkpoints.update']['types'],
  },
  'admin.checkpoints.status': {
    methods: ["PATCH"],
    pattern: '/api/v1/admin/checkpoints/:id/status',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"checkpoints"],[1,"id"],[0,"status"]],
    types: placeholder as Registry['admin.checkpoints.status']['types'],
  },
  'admin.events.qrcodes': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/events/:eventId/qrcodes',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"events"],[1,"eventId"],[0,"qrcodes"]],
    types: placeholder as Registry['admin.events.qrcodes']['types'],
  },
  'admin.checkpoints.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/admin/checkpoints/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"checkpoints"],[1,"id"]],
    types: placeholder as Registry['admin.checkpoints.destroy']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
