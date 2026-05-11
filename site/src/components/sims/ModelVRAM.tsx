'use client'

import { useEffect, useRef } from 'react'

const MODELS = [
  { label: '3B',  params: 3  },
  { label: '7B',  params: 7  },
  { label: '13B', params: 13 },
  { label: '30B', params: 30 },
  { label: '70B', params: 70 },
]

const QUANTS = [
  { label: 'Q4',   bpp: 0.5, color: 'rgba(100,200,155,0.85)' },
  { label: 'INT8', bpp: 1.0, color: 'rgba(100,160,255,0.80)' },
  { label: 'FP16', bpp: 2.0, color: 'rgba(201,168,76,0.90)'  },
]

const TIERS = [
  { gb: 8,   label: '8 GB',  sub: 'RTX 4060'  },
  { gb: 16,  label: '16 GB', sub: 'M2 Pro'    },
  { gb: 24,  label: '24 GB', sub: 'RTX 4090'  },
  { gb: 64,  label: '64 GB', sub: 'Mac Studio' },
]

const GOLD  = '#C9A84C'
const MUTED = 'rgba(232,226,216,0.45)'
const TEXT  = '#E8E2D8'

const W       = 560
const H       = 310
const BAR_X   = 52
const CHART_W = W - BAR_X - 28
const AXIS_Y  = 64
const ROW_H   = 40
const DOT_R   = 5

const GB_MIN  = 1
const GB_MAX  = 200
const LOG_MIN = Math.log10(GB_MIN)
const LOG_MAX = Math.log10(GB_MAX)

function xOf(gb: number): number {
  return BAR_X + ((Math.log10(Math.max(Math.min(gb, GB_MAX), GB_MIN)) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * CHART_W
}

function gbOf(params: number, bpp: number): number {
  return (params * 1e9 * bpp) / (1024 ** 3)
}

function gbLabel(gb: number): string {
  return gb < 1 ? `${Math.round(gb * 1024)} MB` : `${Math.round(gb)} GB`
}

interface Props {
  title?: string
}

export default function ModelVRAM({ title = 'Model Size vs. RAM Required' }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, W, H)

    // ── Title ──────────────────────────────────────────────────
    ctx.fillStyle = MUTED
    ctx.font = '10px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(title.toUpperCase(), BAR_X, 20)

    // ── Tier reference lines ───────────────────────────────────
    TIERS.forEach(tier => {
      const x = xOf(tier.gb)
      const bottom = AXIS_Y + MODELS.length * ROW_H

      ctx.strokeStyle = 'rgba(201,168,76,0.14)'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 4])
      ctx.beginPath()
      ctx.moveTo(x, AXIS_Y - 26)
      ctx.lineTo(x, bottom)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = GOLD
      ctx.font = '8px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(tier.label, x, AXIS_Y - 16)
      ctx.fillStyle = MUTED
      ctx.font = '7px monospace'
      ctx.fillText(tier.sub, x, AXIS_Y - 6)
    })

    // ── Model rows ─────────────────────────────────────────────
    MODELS.forEach((model, mi) => {
      const rowY = AXIS_Y + mi * ROW_H + ROW_H / 2

      // row label
      ctx.fillStyle = TEXT
      ctx.font = '10px monospace'
      ctx.textAlign = 'right'
      ctx.fillText(model.label, BAR_X - 10, rowY + 4)

      // subtle row track
      ctx.fillStyle = 'rgba(255,255,255,0.025)'
      ctx.fillRect(BAR_X, rowY - ROW_H / 2, CHART_W, ROW_H)

      // connecting line Q4 → FP16
      const xQ4  = xOf(gbOf(model.params, 0.5))
      const xFP16 = xOf(gbOf(model.params, 2.0))
      ctx.strokeStyle = 'rgba(232,226,216,0.10)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(xQ4, rowY)
      ctx.lineTo(xFP16, rowY)
      ctx.stroke()

      // dots + outer labels only
      QUANTS.forEach((q, qi) => {
        const gb      = gbOf(model.params, q.bpp)
        const x       = xOf(gb)
        const clipped = gb > GB_MAX

        ctx.beginPath()
        ctx.arc(x, rowY, DOT_R, 0, Math.PI * 2)
        ctx.fillStyle = clipped ? 'rgba(232,226,216,0.2)' : q.color
        ctx.fill()

        // label only for Q4 (left) and FP16 (right) to avoid crowding
        if (qi === 0 || qi === 2) {
          const label = clipped ? `>${GB_MAX} GB` : gbLabel(gb)
          ctx.fillStyle = clipped ? MUTED : q.color
          ctx.font = '8px monospace'
          ctx.textAlign = 'center'
          // nudge right edge label left if near canvas edge
          const lx = Math.min(x, W - 30)
          ctx.fillText(label, lx, rowY - DOT_R - 4)
        }
      })
    })

    // ── Legend ─────────────────────────────────────────────────
    const legY = AXIS_Y + MODELS.length * ROW_H + 22
    let lx = BAR_X
    QUANTS.forEach(q => {
      ctx.beginPath()
      ctx.arc(lx + 4, legY, 4, 0, Math.PI * 2)
      ctx.fillStyle = q.color
      ctx.fill()
      ctx.fillStyle = MUTED
      ctx.font = '9px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(q.label, lx + 13, legY + 3)
      lx += ctx.measureText(q.label).width + 36
    })

    // ── Footnote ───────────────────────────────────────────────
    ctx.fillStyle = 'rgba(232,226,216,0.18)'
    ctx.font = '8px monospace'
    ctx.textAlign = 'right'
    ctx.fillText('approximate · excludes KV cache and framework overhead', W - 8, H - 5)

  }, [title])

  return (
    <div style={{ margin: '2em auto', maxWidth: W, userSelect: 'none' }}>
      <canvas ref={ref} width={W} height={H} style={{ display: 'block', width: '100%' }} />
    </div>
  )
}
