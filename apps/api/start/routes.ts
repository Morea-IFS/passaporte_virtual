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

    /**
     * Área do organizador: gestão de eventos e checkpoints.
     */
    router
      .group(() => {
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
