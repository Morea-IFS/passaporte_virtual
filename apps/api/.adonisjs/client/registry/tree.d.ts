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
  public: {
    checkpoints: {
      show: typeof routes['public.checkpoints.show']
    }
    events: {
      index: typeof routes['public.events.index']
      ranking: typeof routes['public.events.ranking']
      show: typeof routes['public.events.show']
    }
  }
  visitor: {
    nickname: typeof routes['visitor.nickname']
    register: typeof routes['visitor.register']
    recover: typeof routes['visitor.recover']
    me: typeof routes['visitor.me']
    logout: typeof routes['visitor.logout']
    checkins: {
      store: typeof routes['visitor.checkins.store']
    }
    passports: {
      index: typeof routes['visitor.passports.index']
      show: typeof routes['visitor.passports.show']
      join: typeof routes['visitor.passports.join']
    }
    evaluation: {
      show: typeof routes['visitor.evaluation.show']
      store: typeof routes['visitor.evaluation.store']
    }
  }
  admin: {
    administrators: {
      index: typeof routes['admin.administrators.index']
      store: typeof routes['admin.administrators.store']
      show: typeof routes['admin.administrators.show']
      update: typeof routes['admin.administrators.update']
      destroy: typeof routes['admin.administrators.destroy']
      status: typeof routes['admin.administrators.status']
    }
    audit: {
      index: typeof routes['admin.audit.index']
      options: typeof routes['admin.audit.options']
      track: typeof routes['admin.audit.track']
      show: typeof routes['admin.audit.show']
    }
    participants: {
      index: typeof routes['admin.participants.index']
      show: typeof routes['admin.participants.show']
      checkins: typeof routes['admin.participants.checkins']
    }
    events: {
      index: typeof routes['admin.events.index']
      store: typeof routes['admin.events.store']
      show: typeof routes['admin.events.show']
      update: typeof routes['admin.events.update']
      destroy: typeof routes['admin.events.destroy']
      analytics: typeof routes['admin.events.analytics'] & {
        export: typeof routes['admin.events.analytics.export']
      }
      evaluations: typeof routes['admin.events.evaluations']
      checkpoints: {
        index: typeof routes['admin.events.checkpoints.index']
        store: typeof routes['admin.events.checkpoints.store']
        import: typeof routes['admin.events.checkpoints.import']
      }
      categories: {
        index: typeof routes['admin.events.categories.index']
        store: typeof routes['admin.events.categories.store']
      }
      qrcodes: typeof routes['admin.events.qrcodes']
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
