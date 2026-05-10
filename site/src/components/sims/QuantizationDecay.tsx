'use client'

import { useEffect, useRef, useState } from 'react'

// ── Types ─────────────────────────────────────────────────────
export type QuantLevel = {
  label: string       // "INT4"
  bits: number        // 4
  quality: number     // 0–100, relative to FP32 baseline
  speedup: number     // e.g. 5.8 = 5.8× faster than FP32
  sizeRatio: number   // fraction of FP32 size, e.g. 0.125
}

interface Props {
  model?:   string
  metric?:  string
  data?:    QuantLevel[]
  cliffAfter?: string  // label of level where cliff begins, default "INT4"
}

// ── Defaults ──────────────────────────────────────────────────
const DEFAULTS: QuantLevel[] = [
  { label: 'FP32', bits: 32, quality: 100.0, speedup: 1.0,  sizeRatio: 1.000 },
  { label: 'BF16', bits: 16, quality: 99.6,  speedup: 1.95, sizeRatio: 0.500 },
  { label: 'FP16', bits: 16, quality: 99.3,  speedup: 2.0,  sizeRatio: 0.500 },
  { label: 'INT8', bits: 8,  quality: 97.1,  speedup: 3.6,  sizeRatio: 0.250 },
  { label: 'INT4', bits: 4,  quality: 88.4,  speedup: 5.9,  sizeRatio: 0.125 },
  { label: 'INT2', bits: 2,  quality: 62.5,  speedup: 8.7,  sizeRatio: 0.063 },
  { label: 'INT1', bits: 1,  quality: 29.0,  speedup: 11.5, sizeRatio: 0.031 },
]

// ── Palette ───────────────────────────────────────────────────
const GOLD     = '#C9A84C'
const TEXT     = '#E8E2D8'
const MUTED    = 'rgba(232,226,216,0.45)'
const DIM_FILL = 'rgba(201,168,76,0.06)'
const CLIFF_C  = 'rgba(220,90,90,0.4)'

function qualityColor(q: number): string {
  if (q >= 94) return 'rgba(201,168,76,0.88)'       // gold — safe
  if (q >= 80) return 'rgba(220,160,60,0.88)'       // amber — caution
  return 'rgba(210,75,75,0.85)'                      // red — degraded
}

function verdict(q: number): { label: string; color: string } {
  if (q >= 98) return { label: 'Negligible loss',     color: 'rgba(100,200,140,0.9)' }
  if (q >= 94) return { label: 'Minor loss',          color: 'rgba(200,200,80,0.9)'  }
  if (q >= 80) return { label: 'Notable degradation', color: 'rgba(230,150,60,0.9)'  }
  return          { label: 'Severe degradation',      color: 'rgba(210,75,75,0.9)'   }
}

// ── Layout constants ──────────────────────────────────────────
const W = 520
const H = 360
const PAD_L = 20
const PAD_R = 20
const PAD_T = 52
const PAD_B = 110
const CHART_H = H - PAD_T - PAD_B
const CHART_W = W - PAD_L - PAD_R

export default function QuantizationDecay({
  model      = 'LLaMA 3 8B',
  metric     = 'Relative Quality',
  data       = DEFAULTS,
  cliffAfter = 'INT4',
}: Props) {
  const ref      = useRef<HTMLCanvasElement>(null)
  const [hover, setHover]       = useState<number | null>(null)
  const [selected, setSelected] = useState<number>(3)   // INT8 by default

  const cliffIdx = data.findIndex(d => d.label === cliffAfter)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const active = hover ?? selected
    const n      = data.length
    const barGap = CHART_W / n
    const barW   = Math.floor(barGap * 0.52)
    const bx     = (i: number) => PAD_L + barGap * i + (barGap - barW) / 2

    ctx.clearRect(0, 0, W, H)

    // ── Header ─────────────────────────────────────────────
    ctx.fillStyle = MUTED
    ctx.font = '10px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(model.toUpperCase() + '  —  ' + metric.toUpperCase(), PAD_L, 18)

    // ── 100% reference line ────────────────────────────────
    ctx.strokeStyle = 'rgba(201,168,76,0.15)'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 5])
    ctx.beginPath(); ctx.moveTo(PAD_L, PAD_T); ctx.lineTo(W - PAD_R, PAD_T); ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = MUTED; ctx.font = '9px monospace'; ctx.textAlign = 'right'
    ctx.fillText('100%', PAD_L - 3, PAD_T + 4)

    // ── Cliff annotation ───────────────────────────────────
    if (cliffIdx >= 0 && cliffIdx < n - 1) {
      const cx = bx(cliffIdx) + barW + (bx(cliffIdx + 1) - bx(cliffIdx) - barW) / 2
      ctx.strokeStyle = CLIFF_C
      ctx.lineWidth = 1
      ctx.setLineDash([2, 4])
      ctx.beginPath(); ctx.moveTo(cx, PAD_T - 10); ctx.lineTo(cx, PAD_T + CHART_H); ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = CLIFF_C
      ctx.font = '9px monospace'; ctx.textAlign = 'center'
      ctx.fillText('quality cliff', cx, PAD_T - 13)
    }

    // ── Bars ───────────────────────────────────────────────
    data.forEach((lvl, i) => {
      const x      = bx(i)
      const isAct  = i === active
      const fillH  = (lvl.quality / 100) * CHART_H
      const emptyH = CHART_H - fillH
      const qCol   = qualityColor(lvl.quality)

      // empty top
      ctx.fillStyle = isAct ? 'rgba(201,168,76,0.09)' : DIM_FILL
      ctx.fillRect(x, PAD_T, barW, emptyH)

      // quality fill
      ctx.fillStyle = isAct ? qCol : qCol.replace(/[\d.]+\)$/, '0.5)')
      ctx.fillRect(x, PAD_T + emptyH, barW, fillH)

      // outline / glow
      if (isAct) {
        ctx.save()
        ctx.shadowColor = GOLD; ctx.shadowBlur = 10
        ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5
        ctx.strokeRect(x, PAD_T, barW, CHART_H)
        ctx.restore()
      } else {
        ctx.strokeStyle = 'rgba(201,168,76,0.18)'; ctx.lineWidth = 1
        ctx.strokeRect(x, PAD_T, barW, CHART_H)
      }

      // quality % inside bar
      if (fillH > 18) {
        ctx.fillStyle = isAct ? TEXT : 'rgba(232,226,216,0.6)'
        ctx.font = isAct ? '600 11px monospace' : '10px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(`${lvl.quality.toFixed(0)}%`, x + barW / 2, PAD_T + emptyH + Math.min(fillH / 2, 14) + 4)
      }

      // label below
      ctx.fillStyle = isAct ? GOLD : MUTED
      ctx.font = isAct ? '600 10px monospace' : '10px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(lvl.label, x + barW / 2, PAD_T + CHART_H + 16)

      // relative-size pill
      const pillW = Math.max(3, Math.round(barW * lvl.sizeRatio))
      ctx.fillStyle = isAct ? 'rgba(201,168,76,0.55)' : 'rgba(201,168,76,0.18)'
      ctx.fillRect(x + (barW - pillW) / 2, PAD_T + CHART_H + 24, pillW, 3)
    })

    // ── Detail panel ───────────────────────────────────────
    const lvl = data[active]
    if (!lvl) return
    const v   = verdict(lvl.quality)
    const py  = PAD_T + CHART_H + 46

    ctx.fillStyle = v.color
    ctx.font = '600 11px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`${lvl.label}  ·  ${v.label}`, PAD_L, py)

    ctx.fillStyle = MUTED; ctx.font = '11px monospace'
    const stats = [
      `quality   ${lvl.quality.toFixed(1)}% of FP32 baseline`,
      `speedup   ${lvl.speedup.toFixed(1)}×  faster inference`,
      `footprint ${(lvl.sizeRatio * 100).toFixed(1)}% of original size`,
    ]
    stats.forEach((s, i) => ctx.fillText(s, PAD_L + 8, py + 17 + i * 15))

  }, [hover, selected, data, model, metric, cliffIdx])

  const indexAt = (e: React.MouseEvent) => {
    const r    = ref.current!.getBoundingClientRect()
    const x    = (e.clientX - r.left) * (W / r.width)
    const y    = (e.clientY - r.top)  * (H / r.height)
    if (y < PAD_T || y > PAD_T + CHART_H) return null
    const n    = data.length
    const gap  = CHART_W / n
    const w    = Math.floor(gap * 0.52)
    for (let i = 0; i < n; i++) {
      const x0 = PAD_L + gap * i + (gap - w) / 2
      if (x >= x0 && x <= x0 + w) return i
    }
    return null
  }

  return (
    <canvas
      ref={ref} width={W} height={H}
      style={{ display: 'block', margin: '2em auto', maxWidth: '100%', cursor: 'pointer' }}
      onMouseMove={e => setHover(indexAt(e))}
      onMouseLeave={() => setHover(null)}
      onClick={e => { const i = indexAt(e); if (i !== null) setSelected(i) }}
    />
  )
}
