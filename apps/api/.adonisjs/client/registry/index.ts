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
