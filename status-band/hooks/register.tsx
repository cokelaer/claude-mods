import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Mode, Snapshot } from '../types'

const snapshot = atom({ plugin: 'status-band', key: 'snapshot' } as const, null)
const mode = atom({ plugin: 'status-band', key: 'mode' } as const, 'top')

const PANE = 'status-band'
const MODES: Mode[] = ['top', 'side', 'off']

const pct = (n: number | null) => (n === null ? '–' : `${Math.round(n)}%`)

const colorFor = (n: number | null) => {
  if (n === null || n < 33) return 'green'
  if (n < 66) return 'rgb(255,140,0)'
  return 'red'
}

const bar = (n: number | null) => {
  const total = 6
  const filled = n === null ? 0 : Math.max(0, Math.min(total, Math.round((n / 100) * total)))
  return '▰'.repeat(filled) + '▱'.repeat(total - filled)
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const clockTime = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

const resetLabel = (iso: string | undefined, withDay: boolean) => {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return withDay ? `${DAYS[d.getDay()]} ${clockTime(d)}` : clockTime(d)
}

async function refresh($: any, patch: Partial<Snapshot>) {
  const usage = await $.session.usage()
  let branch = ''
  try {
    const r = await $.process.run(['git', 'branch', '--show-current'])
    if (r.exitCode === 0) branch = r.stdout.trim()
  } catch {
    // not a repo or git missing
  }
  const model = await $.session.model()
  const rate = (kind: string) => usage.rateLimits.find((l: any) => l.kind === kind)?.percentUsed ?? null
  await update($, snapshot, (prev: Snapshot | null) => ({
    isWorking: false,
    startedAt: 0,
    lastTurnSeconds: null,
    effort: null,
    ...prev,
    branch,
    model,
    contextPercent: usage.context.percent ?? null,
    fiveHour: rate('five_hour'),
    sevenDay: rate('seven_day'),
    fiveHourReset: resetLabel(usage.rateLimits.find((l: any) => l.kind === 'five_hour')?.resetsAt, false),
    sevenDayReset: resetLabel(usage.rateLimits.find((l: any) => l.kind === 'seven_day')?.resetsAt, true),
    costUsd: usage.cost?.usd ?? null,
    ...patch,
  }))
}

async function applyMode($: any, next: Mode) {
  await update($, mode, () => next)
  if (next === 'side') await $.ui.open({ id: PANE, title: 'Status' })
  else await $.ui.close({ id: PANE })
}

function rows(ui: any, s: Snapshot, vertical: boolean, onHide: () => void) {
  const { Box, Button, Text } = ui
  const hide = <Button key="hide" label="✕" hotkey="x" onPress={onHide} />
  const head = [
    <Text bold color="magenta">{s.model}</Text>,
    <Text color={s.isWorking ? 'yellow' : 'green'}>{s.isWorking ? '● working' : '○ idle'}</Text>,
  ]
  const ctx = (
    <Box>
      <Text>ctx </Text>
      <Text color={colorFor(s.contextPercent)}>{bar(s.contextPercent)} {pct(s.contextPercent)}</Text>
    </Box>
  )
  const effort = s.effort ? <Text color="blue">effort {s.effort}</Text> : null
  const cost = s.costUsd !== null ? <Text dimColor>${s.costUsd.toFixed(2)}</Text> : null
  const branch = s.branch ? <Text color="cyan">🌿 {s.branch}</Text> : null
  const five = (
    <Box>
      <Text color={colorFor(s.fiveHour)}>session {pct(s.fiveHour)}</Text>
      {s.fiveHourReset ? <Text dimColor> (resets {s.fiveHourReset})</Text> : null}
    </Box>
  )
  const seven = (
    <Box>
      <Text color={colorFor(s.sevenDay)}>week {pct(s.sevenDay)}</Text>
      {s.sevenDayReset ? <Text dimColor> (resets {s.sevenDayReset})</Text> : null}
    </Box>
  )
  const last = s.lastTurnSeconds !== null ? <Text dimColor>last turn {s.lastTurnSeconds}s</Text> : null

  if (vertical) {
    return (
      <Box flexDirection="column">
        {head[0]}
        {head[1]}
        {ctx}
        {effort}
        {cost}
        {branch}
        {five}
        {seven}
        {last}
      </Box>
    )
  }
  return (
    <Box borderStyle="round" borderColor="gray" paddingX={1} flexDirection="column">
      <Box justifyContent="space-between">
        <Box>
          {head[0]}
          <Text> </Text>
          {head[1]}
          <Text dimColor> · </Text>
          {ctx}
          {cost ? <Text dimColor> · ${s.costUsd!.toFixed(2)}</Text> : null}
          {branch ? <Text color="cyan"> · 🌿 {s.branch}</Text> : null}
        </Box>
        <Box>
          {effort ? <Text color="blue">effort {s.effort} </Text> : null}
          {hide}
        </Box>
      </Box>
      <Box>
        {five}
        <Text dimColor> · </Text>
        {seven}
        {last ? <Text dimColor> · last turn {s.lastTurnSeconds}s</Text> : null}
      </Box>
    </Box>
  )
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'status-band',
      description: 'Status band: top, side, or off (no argument cycles)',
      argumentHint: '[top|side|off]',
    })
    const result = await next(e)
    await refresh($, {})
    if ((await read($, mode)) === 'side') await $.ui.open({ id: PANE, title: 'Status' })
    return result
  })

  on('command.run', { command: 'status-band' }, async ($, e) => {
    const arg = e.args.trim() as Mode
    const current = await read($, mode)
    const next = MODES.includes(arg) ? arg : MODES[(MODES.indexOf(current) + 1) % MODES.length]
    await applyMode($, next)
    return { text: `Status band: ${next}.` }
  })

  on('session.measure', async ($, e, next) => {
    await refresh($, {})
    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    await refresh($, { isWorking: true, startedAt: await $.clock.now() })
    return next(e)
  })

  on('turn.step', async function* ($, e, next) {
    if (!e.agentId) {
      const effort = e.effort === undefined ? null : String(e.effort)
      const prev = await read($, snapshot)
      if (prev && prev.effort !== effort) await update($, snapshot, (p: Snapshot | null) => (p ? { ...p, effort } : p))
    }
    return yield* next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const prev = await read($, snapshot)
    const seconds = prev && prev.startedAt ? Math.round(((await $.clock.now()) - prev.startedAt) / 1000) : null
    await refresh($, { isWorking: false, lastTurnSeconds: seconds })
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const s = await read($, snapshot)
    if (e.props.hasSurvey || s === null || (await read($, mode)) !== 'top') return next(e)
    return rows($.ui.resolve(e), s, false, () => applyMode($, 'off'))
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const s = await read($, snapshot)
    const { Text } = $.ui.resolve(e)
    if (s === null) return <Text dimColor>No data yet.</Text>
    return rows($.ui.resolve(e), s, true, () => applyMode($, 'off'))
  })
}
