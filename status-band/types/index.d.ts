export type Snapshot = {
  branch: string
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
}

declare module 'claude-code' {
  interface PluginState {
    'status-band': { snapshot: Snapshot | null; isHidden: boolean }
  }
}
