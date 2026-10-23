/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  drive: {
    fs: {
      serve: typeof routes['drive.fs.serve']
    }
  }
  auth: {
    accessTokens: {
      store: typeof routes['auth.access_tokens.store']
    }
  }
  profile: {
    profile: {
      show: typeof routes['profile.profile.show']
    }
    accessTokens: {
      destroy: typeof routes['profile.access_tokens.destroy']
    }
  }
  admin: {
    events: {
      index: typeof routes['admin.events.index']
      store: typeof routes['admin.events.store']
      show: typeof routes['admin.events.show']
      update: typeof routes['admin.events.update']
      destroy: typeof routes['admin.events.destroy']
      checkpoints: {
        index: typeof routes['admin.events.checkpoints.index']
        store: typeof routes['admin.events.checkpoints.store']
        import: typeof routes['admin.events.checkpoints.import']
      }
      categories: {
        index: typeof routes['admin.events.categories.index']
        store: typeof routes['admin.events.categories.store']
      }
    }
    categories: {
      update: typeof routes['admin.categories.update']
      destroy: typeof routes['admin.categories.destroy']
    }
    checkpoints: {
      show: typeof routes['admin.checkpoints.show']
      update: typeof routes['admin.checkpoints.update']
      status: typeof routes['admin.checkpoints.status']
      destroy: typeof routes['admin.checkpoints.destroy']
    }
  }
}
