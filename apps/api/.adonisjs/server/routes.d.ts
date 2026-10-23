import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'profile.access_tokens.destroy': { paramsTuple?: []; params?: {} }
    'admin.events.index': { paramsTuple?: []; params?: {} }
    'admin.events.store': { paramsTuple?: []; params?: {} }
    'admin.events.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.events.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.events.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.events.checkpoints.index': { paramsTuple: [ParamValue]; params: {'eventId': ParamValue} }
    'admin.events.checkpoints.store': { paramsTuple: [ParamValue]; params: {'eventId': ParamValue} }
    'admin.events.checkpoints.import': { paramsTuple: [ParamValue]; params: {'eventId': ParamValue} }
    'admin.events.categories.index': { paramsTuple: [ParamValue]; params: {'eventId': ParamValue} }
    'admin.events.categories.store': { paramsTuple: [ParamValue]; params: {'eventId': ParamValue} }
    'admin.categories.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.categories.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.checkpoints.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.checkpoints.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.checkpoints.status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.checkpoints.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'admin.events.index': { paramsTuple?: []; params?: {} }
    'admin.events.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.events.checkpoints.index': { paramsTuple: [ParamValue]; params: {'eventId': ParamValue} }
    'admin.events.categories.index': { paramsTuple: [ParamValue]; params: {'eventId': ParamValue} }
    'admin.checkpoints.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  HEAD: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'admin.events.index': { paramsTuple?: []; params?: {} }
    'admin.events.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.events.checkpoints.index': { paramsTuple: [ParamValue]; params: {'eventId': ParamValue} }
    'admin.events.categories.index': { paramsTuple: [ParamValue]; params: {'eventId': ParamValue} }
    'admin.checkpoints.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  POST: {
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'profile.access_tokens.destroy': { paramsTuple?: []; params?: {} }
    'admin.events.store': { paramsTuple?: []; params?: {} }
    'admin.events.checkpoints.store': { paramsTuple: [ParamValue]; params: {'eventId': ParamValue} }
    'admin.events.checkpoints.import': { paramsTuple: [ParamValue]; params: {'eventId': ParamValue} }
    'admin.events.categories.store': { paramsTuple: [ParamValue]; params: {'eventId': ParamValue} }
  }
  PUT: {
    'admin.events.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.categories.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.checkpoints.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PATCH: {
    'admin.events.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.checkpoints.status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'admin.events.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.categories.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.checkpoints.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}