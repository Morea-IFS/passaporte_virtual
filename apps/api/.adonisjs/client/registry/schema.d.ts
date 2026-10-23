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
