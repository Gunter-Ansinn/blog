'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  title?:         string
  cloudExecMs?:   number   // cloud model inference time (ms)
  edgeExecMs?:    number   // local/edge model inference time (ms)
  responseKB?:    number   // response payload size
  cloudQueueMs?:  number   // cold-start / queue wait
}

const GOLD    = '#C9A84C'
const MUTED   = 'rgba(232,226,216,0.4)'
const TEXT    = '#E8E2D8'
const BG2     = 'rgba(255,255,255,0.04)'

const SEG = {
  upload:   'rgba(100,160,255,0.80)',
  queue:    'rgba(200,150,55,0.80)',
  execute:  'rgba(201,168,76,0.90)',
  download: 'rgba(100,200,155,0.75)',
  edge:     'rgba(180,130,255,0.85)',
}

const W       = 540
const H       = 320
const ROW_H   = 44
const ROW_GAP = 28
const BAR_X   = 88
const BAR_MAX = W - BAR_X - 64

const ROW_Y = { cloud: 76, edge: 76 + ROW_H + ROW_GAP }

// Fixed ceiling so bars are anchored — 12s gives headroom for bad network + large payload
const SCALE_CEIL_MS = 12000

function msLabel(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`
}

function scale(ms: number): number {
  return Math.min(ms / SCALE_CEIL_MS, 1) * BAR_MAX
}

export default function CloudLatency({
  title        = 'Cloud vs Edge Latency',
  cloudExecMs  = 900,
  edgeExecMs   = 3200,
  responseKB   = 4,
  cloudQueueMs = 45,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [payloadKB,   setPayloadKB]   = useState(120)   // ~1 compressed screenshot
  const [networkMbps, setNetworkMbps] = useState(50)
  const [edgeSpeedX,  setEdgeSpeedX]  = useState(1.0)   // multiplier on edge compute

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, W, H)

    const uploadMs    = (payloadKB  * 8) / networkMbps
    const downloadMs  = (responseKB * 8) / networkMbps
    const edgeTotalMs = edgeExecMs / edgeSpeedX
    const cloudTotal  = uploadMs + cloudQueueMs + cloudExecMs + downloadMs
    const edgeTotal   = edgeTotalMs

    // ── Title ──────────────────────────────────────────────
    ctx.fillStyle = MUTED
    ctx.font = '10px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(title.toUpperCase(), 16, 20)

    // ── Scale axis tick at SCALE_CEIL_MS ───────────────────
    ctx.strokeStyle = 'rgba(201,168,76,0.10)'
    ctx.lineWidth = 1
    ctx.setLineDash([2, 4])
    ctx.beginPath()
    ctx.moveTo(BAR_X + BAR_MAX, ROW_Y.cloud - 10)
    ctx.lineTo(BAR_X + BAR_MAX, ROW_Y.edge + ROW_H + 10)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = MUTED
    ctx.font = '8px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(msLabel(SCALE_CEIL_MS), BAR_X + BAR_MAX, ROW_Y.cloud - 13)

    // ── Rows ───────────────────────────────────────────────
    const rows: { label: string; y: number; segs: { color: string; ms: number; tag: string }[]; total: number }[] = [
      {
        label: 'CLOUD', y: ROW_Y.cloud, total: cloudTotal,
        segs: [
          { color: SEG.upload,   ms: uploadMs,     tag: 'upload'   },
          { color: SEG.queue,    ms: cloudQueueMs, tag: 'queue'    },
          { color: SEG.execute,  ms: cloudExecMs,  tag: 'execute'  },
          { color: SEG.download, ms: downloadMs,   tag: 'dl'       },
        ],
      },
      {
        label: 'EDGE', y: ROW_Y.edge, total: edgeTotal,
        segs: [{ color: SEG.edge, ms: edgeTotal, tag: 'execute' }],
      },
    ]

    rows.forEach(({ label, y, segs, total }) => {
      // Track
      ctx.fillStyle = BG2
      ctx.fillRect(BAR_X, y, BAR_MAX, ROW_H)
      ctx.strokeStyle = 'rgba(201,168,76,0.12)'
      ctx.lineWidth = 1
      ctx.strokeRect(BAR_X, y, BAR_MAX, ROW_H)

      // Row label
      ctx.fillStyle = MUTED
      ctx.font = '9px monospace'
      ctx.textAlign = 'right'
      ctx.fillText(label, BAR_X - 6, y + ROW_H / 2 + 4)

      // Segments
      let cursor = BAR_X
      segs.forEach(seg => {
        const w = scale(seg.ms)
        if (w < 1) return
        ctx.fillStyle = seg.color
        ctx.fillRect(cursor, y + 1, w - 1, ROW_H - 2)
        if (w > 36) {
          ctx.fillStyle = 'rgba(0,0,0,0.55)'
          ctx.font = '8px monospace'
          ctx.textAlign = 'center'
          ctx.fillText(seg.tag, cursor + w / 2, y + ROW_H / 2 - 3)
          ctx.fillText(msLabel(seg.ms), cursor + w / 2, y + ROW_H / 2 + 8)
        }
        cursor += w
      })

      // Total & winner label
      const isWinner = total === Math.min(cloudTotal, edgeTotal)
      ctx.fillStyle = isWinner ? GOLD : TEXT
      ctx.font = isWinner ? '600 12px monospace' : '11px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(msLabel(total), BAR_X + BAR_MAX + 8, y + ROW_H / 2 + 4)
      if (isWinner) {
        ctx.fillStyle = 'rgba(201,168,76,0.55)'
        ctx.font = '8px monospace'
        ctx.fillText('faster', BAR_X + BAR_MAX + 8, y + ROW_H / 2 + 16)
      }
    })

    // ── Legend ─────────────────────────────────────────────
    const legendY = ROW_Y.edge + ROW_H + 26
    const items = [
      { color: SEG.upload,   label: 'upload' },
      { color: SEG.queue,    label: 'queue / cold start' },
      { color: SEG.execute,  label: 'cloud execute' },
      { color: SEG.download, label: 'download' },
      { color: SEG.edge,     label: 'edge execute' },
    ]
    let lx = BAR_X
    items.forEach(({ color, label }) => {
      ctx.fillStyle = color
      ctx.fillRect(lx, legendY, 8, 8)
      ctx.fillStyle = MUTED
      ctx.font = '9px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(label, lx + 12, legendY + 8)
      lx += ctx.measureText(label).width + 26
    })

  }, [payloadKB, networkMbps, edgeSpeedX, cloudExecMs, edgeExecMs, responseKB, cloudQueueMs, title])

  const sliderStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    fontSize: '0.75rem', fontFamily: 'monospace', color: 'rgba(232,226,216,0.55)',
  }

  return (
    <div style={{ margin: '2em auto', maxWidth: W, userSelect: 'none' }}>
      <canvas ref={ref} width={W} height={H} style={{ display: 'block', width: '100%' }} />
      <div style={{ paddingLeft: BAR_X, display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        <label style={sliderStyle}>
          <span style={{ width: 140 }}>payload {payloadKB} KB</span>
          <input type="range" min={4} max={6000} value={payloadKB}
            onChange={e => setPayloadKB(Number(e.target.value))}
            style={{ width: 180, accentColor: GOLD, cursor: 'pointer' }} />
        </label>
        <label style={sliderStyle}>
          <span style={{ width: 140 }}>network {networkMbps} Mbps</span>
          <input type="range" min={1} max={200} value={networkMbps}
            onChange={e => setNetworkMbps(Number(e.target.value))}
            style={{ width: 180, accentColor: GOLD, cursor: 'pointer' }} />
        </label>
        <label style={sliderStyle}>
          <span style={{ width: 140 }}>edge compute {edgeSpeedX.toFixed(1)}×</span>
          <input type="range" min={1} max={40} step={0.5} value={edgeSpeedX * 10}
            onChange={e => setEdgeSpeedX(Number(e.target.value) / 10)}
            style={{ width: 180, accentColor: GOLD, cursor: 'pointer' }} />
        </label>
      </div>
    </div>
  )
}
