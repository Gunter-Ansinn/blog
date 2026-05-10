'use client'

import { useEffect, useRef, useState } from 'react'

// ── Types ─────────────────────────────────────────────────────
export type RoutingTier = {
  name: string           // "Haiku / Flash"
  params?: string        // "7B" — shown as annotation
  latencyMs: number      // median inference latency
  quality: number        // 0–100 relative quality score
  costPerMTok: number    // USD per million output tokens
  threshold: number      // query complexity 0–100 at which this tier activates
  color?: string
}

interface Props {
  title?: string
  tiers?: RoutingTier[]
}

// ── Defaults ──────────────────────────────────────────────────
const DEFAULT_TIERS: RoutingTier[] = [
  {
    name: 'Local SLM',   params: '1–3B',
    latencyMs: 40,  quality: 42,  costPerMTok: 0,
    threshold: 0,   color: 'rgba(180,140,255,0.85)',
  },
  {
    name: 'Haiku class', params: '7–8B',
    latencyMs: 280, quality: 68,  costPerMTok: 0.25,
    threshold: 30,  color: 'rgba(100,200,160,0.85)',
  },
  {
    name: 'Sonnet class', params: '70B',
    latencyMs: 900, quality: 88,  costPerMTok: 3.0,
    threshold: 60,  color: 'rgba(201,168,76,0.9)',
  },
  {
    name: 'Opus class',  params: '400B+',
    latencyMs: 3200, quality: 100, costPerMTok: 15.0,
    threshold: 85,  color: 'rgba(255,120,100,0.85)',
  },
]

// ── Palette ───────────────────────────────────────────────────
const GOLD   = '#C9A84C'
const TEXT   = '#E8E2D8'
const MUTED  = 'rgba(232,226,216,0.4)'
const BG2    = 'rgba(255,255,255,0.04)'

const W = 520
const H = 300

export default function ModelRouting({ title = 'Routing by Query Complexity', tiers = DEFAULT_TIERS }: Props) {
  const ref     = useRef<HTMLCanvasElement>(null)
  const [complexity, setComplexity] = useState(45)

  // Which tier is active: highest tier whose threshold ≤ complexity
  const activeIdx = tiers.reduce((best, t, i) => (t.threshold <= complexity ? i : best), 0)
  const active    = tiers[activeIdx]

  const TIER_H   = Math.min(54, (H - 60) / tiers.length)
  const TIER_GAP = 6
  const TIER_X   = 290
  const TIER_W   = W - TIER_X - 16
  const TIERS_TOP = (H - tiers.length * (TIER_H + TIER_GAP) + TIER_GAP) / 2 + 20

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, W, H)

    // ── Title ─────────────────────────────────────────────
    ctx.fillStyle = MUTED
    ctx.font = '10px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(title.toUpperCase(), 16, 18)

    // ── Left panel: complexity meter ───────────────────────
    const meterX = 24
    const meterW = 110
    const meterY = 42
    const meterH = H - meterY - 30

    // Meter track
    ctx.fillStyle = BG2
    ctx.fillRect(meterX, meterY, meterW, meterH)
    ctx.strokeStyle = 'rgba(201,168,76,0.15)'
    ctx.lineWidth = 1
    ctx.strokeRect(meterX, meterY, meterW, meterH)

    // Threshold bands with tier colors
    tiers.forEach((t, i) => {
      const next  = tiers[i + 1]
      const lo    = t.threshold / 100
      const hi    = next ? next.threshold / 100 : 1
      const yTop  = meterY + (1 - hi) * meterH
      const yH    = (hi - lo) * meterH
      ctx.fillStyle = (t.color ?? GOLD).replace(/[\d.]+\)$/, '0.12)')
      ctx.fillRect(meterX + 1, yTop, meterW - 2, yH)

      // Threshold tick
      if (i > 0) {
        ctx.strokeStyle = (t.color ?? GOLD).replace(/[\d.]+\)$/, '0.35)')
        ctx.lineWidth = 1
        ctx.setLineDash([2, 3])
        ctx.beginPath()
        ctx.moveTo(meterX, yTop)
        ctx.lineTo(meterX + meterW, yTop)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = MUTED; ctx.font = '8px monospace'; ctx.textAlign = 'left'
        ctx.fillText(`${t.threshold}`, meterX + meterW + 3, yTop + 4)
      }
    })

    // Complexity fill (gold level indicator)
    const fillTop = meterY + (1 - complexity / 100) * meterH
    const fillH   = (complexity / 100) * meterH
    ctx.fillStyle = 'rgba(201,168,76,0.18)'
    ctx.fillRect(meterX + 1, fillTop, meterW - 2, fillH)

    // Current level marker line
    ctx.save()
    ctx.shadowColor = GOLD; ctx.shadowBlur = 8
    ctx.strokeStyle = GOLD; ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(meterX, fillTop)
    ctx.lineTo(meterX + meterW, fillTop)
    ctx.stroke()
    ctx.restore()

    // Complexity label
    ctx.fillStyle = GOLD; ctx.font = '700 20px monospace'; ctx.textAlign = 'center'
    ctx.fillText(`${complexity}`, meterX + meterW / 2, H - 12)
    ctx.fillStyle = MUTED; ctx.font = '9px monospace'
    ctx.fillText('COMPLEXITY', meterX + meterW / 2, H - 1)

    // ── Routing arrow ──────────────────────────────────────
    const arrowX0 = meterX + meterW + 24
    const arrowX1 = TIER_X - 12
    const tierY   = TIERS_TOP + activeIdx * (TIER_H + TIER_GAP) + TIER_H / 2

    ctx.save()
    ctx.shadowColor = active.color ?? GOLD; ctx.shadowBlur = 6
    ctx.strokeStyle = active.color ?? GOLD; ctx.lineWidth = 1.5
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(arrowX0, H / 2)
    ctx.bezierCurveTo(arrowX0 + 30, H / 2, arrowX1 - 30, tierY, arrowX1, tierY)
    ctx.stroke()
    ctx.setLineDash([])
    // Arrowhead
    ctx.beginPath()
    ctx.moveTo(arrowX1, tierY)
    ctx.lineTo(arrowX1 - 8, tierY - 4)
    ctx.lineTo(arrowX1 - 8, tierY + 4)
    ctx.closePath()
    ctx.fillStyle = active.color ?? GOLD
    ctx.fill()
    ctx.restore()

    // ── Tier boxes ─────────────────────────────────────────
    tiers.forEach((t, i) => {
      const ty    = TIERS_TOP + i * (TIER_H + TIER_GAP)
      const isAct = i === activeIdx
      const col   = t.color ?? GOLD

      // Box fill
      ctx.fillStyle = isAct ? col.replace(/[\d.]+\)$/, '0.12)') : BG2
      ctx.fillRect(TIER_X, ty, TIER_W, TIER_H)

      // Box border
      if (isAct) {
        ctx.save()
        ctx.shadowColor = col; ctx.shadowBlur = 10
        ctx.strokeStyle = col; ctx.lineWidth = 1.5
        ctx.strokeRect(TIER_X, ty, TIER_W, TIER_H)
        ctx.restore()
      } else {
        ctx.strokeStyle = 'rgba(232,226,216,0.12)'; ctx.lineWidth = 1
        ctx.strokeRect(TIER_X, ty, TIER_W, TIER_H)
      }

      // Tier name
      ctx.fillStyle = isAct ? TEXT : MUTED
      ctx.font = isAct ? '600 11px monospace' : '10px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(t.name, TIER_X + 10, ty + TIER_H / 2 - (t.params ? 6 : 0))
      if (t.params) {
        ctx.fillStyle = isAct ? col : 'rgba(232,226,216,0.25)'
        ctx.font = '9px monospace'
        ctx.fillText(t.params, TIER_X + 10, ty + TIER_H / 2 + 8)
      }

      // Stats (right-aligned inside box)
      if (isAct) {
        const stats = [
          `${t.latencyMs >= 1000 ? (t.latencyMs / 1000).toFixed(1) + 's' : t.latencyMs + 'ms'}`,
          t.costPerMTok === 0 ? 'free' : `$${t.costPerMTok}/M`,
          `q=${t.quality}%`,
        ]
        ctx.fillStyle = MUTED; ctx.font = '9px monospace'; ctx.textAlign = 'right'
        stats.forEach((s, si) => ctx.fillText(s, TIER_X + TIER_W - 8, ty + 14 + si * 13))
      }
    })

  }, [complexity, activeIdx, active, tiers, title, TIER_H, TIER_GAP, TIER_X, TIER_W, TIERS_TOP])

  return (
    <div style={{ margin: '2em auto', maxWidth: W, userSelect: 'none' }}>
      <canvas
        ref={ref} width={W} height={H}
        style={{ display: 'block', width: '100%' }}
      />
      <div style={{ padding: '0 24px 0 24px' }}>
        <input
          type="range" min={0} max={100} value={complexity}
          onChange={e => setComplexity(Number(e.target.value))}
          style={{ width: '120px', accentColor: GOLD, cursor: 'pointer' }}
        />
      </div>
    </div>
  )
}
