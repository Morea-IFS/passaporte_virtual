/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'
import db from '@adonisjs/lucid/services/db'

router.get('/', () => {
  return { hello: 'world' }
})

router.get('/health', async ({ response }) => {
  try {
    await db.rawQuery('SELECT 1')
    return { status: 'ok', database: 'up' }
  } catch {
    return response.serviceUnavailable({ status: 'error', database: 'down' })
  }
})

router
  .group(() => {
    /**
     * Não há cadastro público: organizadores são criados com
     * `node ace organizer:create`.
     */
    router
      .group(() => {
        router.post('login', [controllers.AccessTokens, 'store'])
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        router.get('profile', [controllers.Profile, 'show'])
        router.post('logout', [controllers.AccessTokens, 'destroy'])
      })
      .prefix('account')
      .as('profile')
      .use(middleware.auth())

    /**
     * Pública: página do ponto aberta pelo QR code.
     */
    router
      .get('public/checkpoints/:token', [controllers.PublicCheckpoints, 'show'])
      .as('public.checkpoints.show')

    router.get('public/events', [controllers.Passports, 'indexPublic']).as('public.events.index')
    router
      .get('public/events/:slug', [controllers.Passports, 'showPublic'])
      .as('public.events.show')

    /**
     * Visitante: apelido, recuperação, check-in e passaporte.
     */
    router
      .group(() => {
        router.get('nickname', [controllers.Visitors, 'availability']).as('nickname')
        router.post('/', [controllers.Visitors, 'register']).as('register')
        router.post('recover', [controllers.Visitors, 'recover']).as('recover')

        router
          .group(() => {
            router.get('me', [controllers.Visitors, 'me']).as('me')
            router.post('logout', [controllers.Visitors, 'logout']).as('logout')
            router.post('checkins', [controllers.Checkins, 'store']).as('checkins.store')
            router.get('passports', [controllers.Passports, 'index']).as('passports.index')
            router.get('passports/:slug', [controllers.Passports, 'show']).as('passports.show')
          })
          .use(middleware.visitor())
      })
      .prefix('visitor')
      .as('visitor')

    /**
     * Área do organizador: gestão de eventos e checkpoints.
     */
    router
      .group(() => {
        router.resource('administrators', controllers.Administrators).apiOnly()
        router
          .patch('administrators/:id/status', [controllers.Administrators, 'updateStatus'])
          .as('administrators.status')

        router.get('audit-logs', [controllers.AuditLogs, 'index']).as('audit.index')
        router.get('audit-logs/options', [controllers.AuditLogs, 'options']).as('audit.options')
        router.get('audit-logs/:id', [controllers.AuditLogs, 'show']).as('audit.show')

        router.get('participants', [controllers.Participants, 'index']).as('participants.index')
        router.get('participants/:id', [controllers.Participants, 'show']).as('participants.show')

        router.resource('events', controllers.Events).apiOnly()

        router
          .get('events/:eventId/checkpoints', [controllers.Checkpoints, 'index'])
          .as('events.checkpoints.index')
        router
          .post('events/:eventId/checkpoints', [controllers.Checkpoints, 'store'])
          .as('events.checkpoints.store')
        router
          .post('events/:eventId/checkpoints/import', [controllers.CheckpointImports, 'store'])
          .as('events.checkpoints.import')

        router
          .get('events/:eventId/categories', [controllers.CheckpointCategories, 'index'])
          .as('events.categories.index')
        router
          .post('events/:eventId/categories', [controllers.CheckpointCategories, 'store'])
          .as('events.categories.store')
        router
          .put('categories/:id', [controllers.CheckpointCategories, 'update'])
          .as('categories.update')
        router
          .delete('categories/:id', [controllers.CheckpointCategories, 'destroy'])
          .as('categories.destroy')

        router.get('checkpoints/:id', [controllers.Checkpoints, 'show']).as('checkpoints.show')
        router.put('checkpoints/:id', [controllers.Checkpoints, 'update']).as('checkpoints.update')
        router
          .patch('checkpoints/:id/status', [controllers.Checkpoints, 'updateStatus'])
          .as('checkpoints.status')
        router.get('events/:eventId/qrcodes', [controllers.QrCodes, 'show']).as('events.qrcodes')
        router
          .delete('checkpoints/:id', [controllers.Checkpoints, 'destroy'])
          .as('checkpoints.destroy')
      })
      .prefix('admin')
      .as('admin')
      .where('id', router.matchers.number())
      .where('eventId', router.matchers.number())
      .use(middleware.auth())
  })
  .prefix('/api/v1')
