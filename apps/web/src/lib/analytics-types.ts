import type { Page } from '@/lib/types'

export type RankingEntry = {
  position: number
  nickname: string
  visited: number
  total: number
}

export type PublicRanking = {
  event: { name: string; slug: string }
  ranking: Page<RankingEntry>
}

export type EventAnalytics = {
  event: { id: number; name: string; slug: string }
  timezone: string
  generatedAt: string
  summary: {
    participants: number
    visitorsWithCheckins: number
    totalCheckins: number
    averageVisited: number
    completedPassports: number
    activeCheckpoints: number
  }
  checkpoints: { id: number; code: string; name: string; isActive: boolean; visits: number }[]
  categories: { id: number; name: string; color: string; visits: number }[]
  daily: { date: string; visits: number }[]
  hourly: { hour: number; visits: number }[]
  progress: { label: string; count: number }[]
  ranking: Page<RankingEntry>
}
