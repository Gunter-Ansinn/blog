'use client'

import { useEffect, useRef } from 'react'

interface Props {
  title?:      string
  uploadMs?:   number
  queueMs?:    number
  execMs?:     number
  downloadMs?: number
}

const GOLD  = '#C9A84C'
const MUTED = 'rgba(232,226,216,0.45)'

const SEGS = [
  { key: 'upload',   label: 'upload',   sub: 'screenshot payload',  color: 'rgba(100,160,255,0.85)' },
  { key: 'queue',    label: 'queue',    sub: 'cold start / wait',   color: 'rgba(200,150,55,0.85)'  },
  { key: 'execute',  label: 'execute',  sub: 'model inference',     color: 'rgba(201,168,76,0.95)'  },
  { key: 'download', label: 'download', sub: 'response payload',    color: 'rgba(100,200,155,0.80)' },
]

const W     = 560
const H     = 188
const PAD_X = 16
const BAR_W = W - PAD_X * 2
const BAR_Y = 52
const BAR_H = 58

function msLabel(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`
}

export default function LatencyBreakdown({
  title      = 'Cloud Request — Per Action Cost',
  uploadMs   = 480,
  queueMs    = 50,
  execMs     = 900,
  downloadMs = 6,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, W, H)

    const values = [uploadMs, queueMs, execMs, downloadMs]
    const total  = values.reduce((a, b) => a + b, 0)

    // ── Title ──────────────────────────────────────────────────
    ctx.fillStyle = MUTED
    ctx.font = '10px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(title.toUpperCase(), PAD_X, 20)

    ctx.fillStyle = GOLD
    ctx.font = '600 13px monospace'
    ctx.textAlign = 'right'
    ctx.fillText(`total  ${msLabel(total)}`, W - PAD_X, 20)

    // ── Track ──────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.04)'
    ctx.fillRect(PAD_X, BAR_Y, BAR_W, BAR_H)
    ctx.strokeStyle = 'rgba(201,168,76,0.15)'
    ctx.lineWidth = 1
    ctx.strokeRect(PAD_X, BAR_Y, BAR_W, BAR_H)

    // ── Segments ───────────────────────────────────────────────
    let cursor = PAD_X
    SEGS.forEach((seg, i) => {
      const ms = values[i]
      const w  = (ms / total) * BAR_W
      if (w < 1) return

      ctx.fillStyle = seg.color
      ctx.fillRect(cursor + 1, BAR_Y + 1, w - 2, BAR_H - 2)

      // Text inside bar (only if wide enough)
      if (w > 60) {
        const cx = cursor + w / 2
        ctx.fillStyle = 'rgba(0,0,0,0.68)'
        ctx.textAlign = 'center'
        ctx.font = '700 10px monospace'
        ctx.fillText(seg.label.toUpperCase(), cx, BAR_Y + BAR_H / 2 - 6)
        ctx.font = '10px monospace'
        ctx.fillText(msLabel(ms), cx, BAR_Y + BAR_H / 2 + 9)
      }

      cursor += w
    })

    // ── Per-segment connectors + external labels for narrow segs
    let cur2 = PAD_X
    SEGS.forEach((seg, i) => {
      const ms = values[i]
      const w  = (ms / total) * BAR_W
      if (w < 1) { cur2 += w; return }

      if (w <= 60) {
        // Drop a small vertical line below the center of the segment, label below
        const cx = cur2 + w / 2
        ctx.strokeStyle = seg.color
        ctx.lineWidth = 1
        ctx.setLineDash([2, 2])
        ctx.beginPath()
        ctx.moveTo(cx, BAR_Y + BAR_H)
        ctx.lineTo(cx, BAR_Y + BAR_H + 14)
        ctx.stroke()
        ctx.setLineDash([])

        ctx.fillStyle = seg.color
        ctx.font = '9px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(`${seg.label}  ${msLabel(ms)}`, cx, BAR_Y + BAR_H + 24)
      }

      cur2 += w
    })

    // ── Legend row (2×2 grid) ──────────────────────────────────
    const LEG_Y = BAR_Y + BAR_H + 42
    const COL2  = PAD_X + (BAR_W / 2) + 8
    SEGS.forEach((seg, i) => {
      const lx = i < 2 ? PAD_X : COL2
      const ly = LEG_Y + (i % 2) * 16
      ctx.fillStyle = seg.color
      ctx.fillRect(lx, ly, 8, 8)
      ctx.fillStyle = MUTED
      ctx.font = '9px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`${seg.label}  —  ${seg.sub}`, lx + 12, ly + 8)
    })

    // ── Footnote ───────────────────────────────────────────────
    ctx.fillStyle = 'rgba(232,226,216,0.2)'
    ctx.font = '8px monospace'
    ctx.textAlign = 'right'
    ctx.fillText('25 Mbps  ·  1500 KB screenshot  ·  2 KB response  ·  50ms queue', W - PAD_X, H - 4)

  }, [title, uploadMs, queueMs, execMs, downloadMs])

  return (
    <div style={{ margin: '2em auto', maxWidth: W, userSelect: 'none' }}>
      <canvas ref={ref} width={W} height={H} style={{ display: 'block', width: '100%' }} />
    </div>
  )
}
