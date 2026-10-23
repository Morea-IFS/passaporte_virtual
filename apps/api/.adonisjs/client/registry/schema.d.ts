/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractRawResponse, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'drive.fs.serve': {
    methods: ["GET","HEAD"]
    pattern: '/uploads/*'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { '*': ParamValue[] }
      query: {}
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
    }
  }
  'auth.access_tokens.store': {
    methods: ["POST"]
    pattern: '/api/v1/auth/login'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').loginValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').loginValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'profile.profile.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/account/profile'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['show']>>>
    }
  }
  'profile.access_tokens.destroy': {
    methods: ["POST"]
    pattern: '/api/v1/account/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['destroy']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['destroy']>>>
    }
  }
  'public.checkpoints.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/public/checkpoints/:token'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { token: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/public_checkpoints_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/public_checkpoints_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/public_checkpoints_controller').default['show']>>>
    }
  }
  'public.events.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/public/events'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/passports_controller').default['indexPublic']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/passports_controller').default['indexPublic']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/passports_controller').default['indexPublic']>>>
    }
  }
  'public.events.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/public/events/:slug'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { slug: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/passports_controller').default['showPublic']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/passports_controller').default['showPublic']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/passports_controller').default['showPublic']>>>
    }
  }
  'visitor.nickname': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/visitor/nickname'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/visitor').nicknameAvailabilityValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/visitors_controller').default['availability']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/visitors_controller').default['availability']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/visitors_controller').default['availability']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'visitor.register': {
    methods: ["POST"]
    pattern: '/api/v1/visitor'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/visitor').registerVisitorValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/visitor').registerVisitorValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/visitors_controller').default['register']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/visitors_controller').default['register']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/visitors_controller').default['register']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'visitor.recover': {
    methods: ["POST"]
    pattern: '/api/v1/visitor/recover'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/visitor').recoverVisitorValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/visitor').recoverVisitorValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/visitors_controller').default['recover']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/visitors_controller').default['recover']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/visitors_controller').default['recover']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'visitor.me': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/visitor/me'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/visitors_controller').default['me']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/visitors_controller').default['me']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/visitors_controller').default['me']>>>
    }
  }
  'visitor.logout': {
    methods: ["POST"]
    pattern: '/api/v1/visitor/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/visitors_controller').default['logout']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/visitors_controller').default['logout']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/visitors_controller').default['logout']>>>
    }
  }
  'visitor.checkins.store': {
    methods: ["POST"]
    pattern: '/api/v1/visitor/checkins'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/visitor').checkinValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/visitor').checkinValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/checkins_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/checkins_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/checkins_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'visitor.passports.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/visitor/passports'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/passports_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/passports_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/passports_controller').default['index']>>>
    }
  }
  'visitor.passports.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/visitor/passports/:slug'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { slug: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/passports_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/passports_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/passports_controller').default['show']>>>
    }
  }
  'admin.administrators.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/administrators'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/administrator').administratorFiltersValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/administrators_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/administrators_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/administrators_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.administrators.store': {
    methods: ["POST"]
    pattern: '/api/v1/admin/administrators'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/administrator').createAdministratorValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/administrator').createAdministratorValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/administrators_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/administrators_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/administrators_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.administrators.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/administrators/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/administrators_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/administrators_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/administrators_controller').default['show']>>>
    }
  }
  'admin.administrators.update': {
    methods: ["PUT","PATCH"]
    pattern: '/api/v1/admin/administrators/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/administrator').updateAdministratorValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/administrator').updateAdministratorValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/administrators_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/administrators_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/administrators_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.administrators.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/admin/administrators/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/administrators_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/administrators_controller').default['destroy']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/administrators_controller').default['destroy']>>>
    }
  }
  'admin.administrators.status': {
    methods: ["PATCH"]
    pattern: '/api/v1/admin/administrators/:id/status'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/administrator').administratorStatusValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/administrator').administratorStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/administrators_controller').default['updateStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/administrators_controller').default['updateStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/administrators_controller').default['updateStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.audit.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/audit-logs'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/audit').auditFiltersValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/audit_logs_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/audit_logs_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/audit_logs_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.audit.options': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/audit-logs/options'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/audit_logs_controller').default['options']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/audit_logs_controller').default['options']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/audit_logs_controller').default['options']>>>
    }
  }
  'admin.audit.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/audit-logs/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/audit_logs_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/audit_logs_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/audit_logs_controller').default['show']>>>
    }
  }
  'admin.participants.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/participants'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/audit').participantFiltersValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/participants_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/participants_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/participants_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.participants.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/participants/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/participants_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/participants_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/participants_controller').default['show']>>>
    }
  }
  'admin.events.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/events'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/pagination').pageValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/events_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/events_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/events_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.events.store': {
    methods: ["POST"]
    pattern: '/api/v1/admin/events'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/event').createEventValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/event').createEventValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/events_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/events_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/events_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.events.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/events/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/events_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/events_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/events_controller').default['show']>>>
    }
  }
  'admin.events.update': {
    methods: ["PUT","PATCH"]
    pattern: '/api/v1/admin/events/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/event').updateEventValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/event').updateEventValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/events_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/events_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/events_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.events.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/admin/events/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/events_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/events_controller').default['destroy']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/events_controller').default['destroy']>>>
    }
  }
  'admin.events.checkpoints.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/events/:eventId/checkpoints'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { eventId: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/checkpoint').checkpointFiltersValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/checkpoints_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/checkpoints_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/checkpoints_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.events.checkpoints.store': {
    methods: ["POST"]
    pattern: '/api/v1/admin/events/:eventId/checkpoints'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/checkpoint').createCheckpointValidator)>>
      paramsTuple: [ParamValue]
      params: { eventId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/checkpoint').createCheckpointValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/checkpoints_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/checkpoints_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/checkpoints_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.events.checkpoints.import': {
    methods: ["POST"]
    pattern: '/api/v1/admin/events/:eventId/checkpoints/import'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/checkpoint').importCheckpointsValidator)>>
      paramsTuple: [ParamValue]
      params: { eventId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/checkpoint').importCheckpointsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/checkpoint_imports_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/checkpoint_imports_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/checkpoint_imports_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.events.categories.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/events/:eventId/categories'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { eventId: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/pagination').pageValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/checkpoint_categories_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/checkpoint_categories_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/checkpoint_categories_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.events.categories.store': {
    methods: ["POST"]
    pattern: '/api/v1/admin/events/:eventId/categories'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/checkpoint_category').checkpointCategoryValidator)>>
      paramsTuple: [ParamValue]
      params: { eventId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/checkpoint_category').checkpointCategoryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/checkpoint_categories_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/checkpoint_categories_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/checkpoint_categories_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.categories.update': {
    methods: ["PUT"]
    pattern: '/api/v1/admin/categories/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/checkpoint_category').checkpointCategoryValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/checkpoint_category').checkpointCategoryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/checkpoint_categories_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/checkpoint_categories_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/checkpoint_categories_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.categories.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/admin/categories/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/checkpoint_category').deleteCheckpointCategoryValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/checkpoint_category').deleteCheckpointCategoryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/checkpoint_categories_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/checkpoint_categories_controller').default['destroy']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/checkpoint_categories_controller').default['destroy']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.checkpoints.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/checkpoints/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/checkpoints_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/checkpoints_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/checkpoints_controller').default['show']>>>
    }
  }
  'admin.checkpoints.update': {
    methods: ["PUT"]
    pattern: '/api/v1/admin/checkpoints/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/checkpoint').updateCheckpointValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/checkpoint').updateCheckpointValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/checkpoints_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/checkpoints_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/checkpoints_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.checkpoints.status': {
    methods: ["PATCH"]
    pattern: '/api/v1/admin/checkpoints/:id/status'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/checkpoint').checkpointStatusValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/checkpoint').checkpointStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/checkpoints_controller').default['updateStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/checkpoints_controller').default['updateStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/checkpoints_controller').default['updateStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.events.qrcodes': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/events/:eventId/qrcodes'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { eventId: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/checkpoint').qrCodesExportValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/qr_codes_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/qr_codes_controller').default['show']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/qr_codes_controller').default['show']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.checkpoints.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/admin/checkpoints/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/checkpoints_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/checkpoints_controller').default['destroy']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/checkpoints_controller').default['destroy']>>>
    }
  }
}
