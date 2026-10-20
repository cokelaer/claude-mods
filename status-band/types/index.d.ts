export type Mode = 'top' | 'off'

export type Snapshot = {
  branch: string
  repo: string
  dirty: number
  cwd: string
  model: string
  contextPercent: number | null
  fiveHour: number | null
  sevenDay: number | null
  fiveHourReset: string | null
  sevenDayReset: string | null
  costUsd: number | null
  isWorking: boolean
  startedAt: number
  lastTurnSeconds: number | null
  effort: string | null
  cachePercent: number | null
}

declare module 'claude-code' {
  interface PluginState {
    'status-band': { snapshot: Snapshot | null; mode: Mode }
  }
}
