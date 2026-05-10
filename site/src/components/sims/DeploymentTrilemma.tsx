'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const GOLD   = '#C9A84C'
const DIM    = 'rgba(201,168,76,0.18)'
const MUTED  = 'rgba(232,226,216,0.35)'
const TEXT   = '#E8E2D8'

const W = 480
const H = 400
const CX = W / 2
const R  = 150  // circumradius of triangle

// Equilateral triangle geometry
const TOP   = { x: CX,                  y: 48 }
const LEFT  = { x: CX - R * 0.866,      y: 48 + R * 1.5 }
const RIGHT = { x: CX + R * 0.866,      y: 48 + R * 1.5 }

const VERTS = [
  { label: 'Capability', sub: 'quality of outputs',      ...TOP   },
  { label: 'Cost',       sub: 'compute / memory',        ...LEFT  },
  { label: 'Speed',      sub: 'latency / throughput',    ...RIGHT },
]

// Named example models as barycentric coords [capability, cost_eff, speed]
// barycentric: how close to each vertex (sums to 1)
// cost here means "efficiency" — high = cheap/small, low = expensive/large
const MODELS: { name: string; b: [number, number, number]; color: string }[] = [
  { name: 'GPT-4 class',    b: [0.70, 0.05, 0.25], color: 'rgba(120,180,255,0.85)' },
  { name: 'Sonnet class',   b: [0.50, 0.20, 0.30], color: 'rgba(160,220,160,0.85)' },
  { name: 'Haiku / Flash',  b: [0.25, 0.30, 0.45], color: 'rgba(255,180,100,0.85)' },
  { name: 'Small SLM',      b: [0.15, 0.45, 0.40], color: 'rgba(255,120,120,0.85)' },
]

function baryToCart(b: [number, number, number]): { x: number; y: number } {
  return {
    x: b[0] * VERTS[0].x + b[1] * VERTS[1].x + b[2] * VERTS[2].x,
    y: b[0] * VERTS[0].y + b[1] * VERTS[1].y + b[2] * VERTS[2].y,
  }
}

function cartToBary(px: number, py: number): [number, number, number] {
  const { x: x1, y: y1 } = VERTS[0]
  const { x: x2, y: y2 } = VERTS[1]
  const { x: x3, y: y3 } = VERTS[2]
  const d = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3)
  const b0 = ((y2 - y3) * (px - x3) + (x3 - x2) * (py - y3)) / d
  const b1 = ((y3 - y1) * (px - x3) + (x1 - x3) * (py - y3)) / d
  const b2 = 1 - b0 - b1
  const sum = Math.max(b0, 0) + Math.max(b1, 0) + Math.max(b2, 0)
  return [Math.max(b0, 0) / sum, Math.max(b1, 0) / sum, Math.max(b2, 0) / sum]
}

function clampToBary(b: [number, number, number]): [number, number, number] {
  const clamped = b.map(v => Math.max(0, v)) as [number, number, number]
  const sum = clamped.reduce((a, v) => a + v, 0)
  return clamped.map(v => v / sum) as [number, number, number]
}

export default function DeploymentTrilemma() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [bary, setBary] = useState<[number, number, number]>([0.50, 0.20, 0.30])
  const [dragging, setDragging] = useState(false)
  const [hovered, setHovered] = useState<number | null>(null)

  const draw = useCallback((b: [number, number, number], hoveredModel: number | null) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, W, H)

    // ── Triangle fill ────────────────────────────────────────
    ctx.beginPath()
    ctx.moveTo(VERTS[0].x, VERTS[0].y)
    ctx.lineTo(VERTS[1].x, VERTS[1].y)
    ctx.lineTo(VERTS[2].x, VERTS[2].y)
    ctx.closePath()
    ctx.fillStyle = 'rgba(201,168,76,0.04)'
    ctx.fill()
    ctx.strokeStyle = DIM
    ctx.lineWidth = 1.5
    ctx.stroke()

    // ── Medians (faint) ──────────────────────────────────────
    VERTS.forEach((v, i) => {
      const opp = { x: (VERTS[(i+1)%3].x + VERTS[(i+2)%3].x)/2, y: (VERTS[(i+1)%3].y + VERTS[(i+2)%3].y)/2 }
      ctx.beginPath()
      ctx.moveTo(v.x, v.y)
      ctx.lineTo(opp.x, opp.y)
      ctx.strokeStyle = 'rgba(201,168,76,0.07)'
      ctx.lineWidth = 1
      ctx.stroke()
    })

    // ── Vertex labels ────────────────────────────────────────
    VERTS.forEach((v, i) => {
      const offsets = [{ x: 0, y: -18 }, { x: -14, y: 22 }, { x: 14, y: 22 }]
      const ox = offsets[i].x
      const oy = offsets[i].y
      ctx.fillStyle = GOLD
      ctx.font = '500 13px var(--font-body, Georgia, serif)'
      ctx.textAlign = 'center'
      ctx.fillText(v.label, v.x + ox, v.y + oy)
    })

    // ── Example models ───────────────────────────────────────
    MODELS.forEach((m, i) => {
      const pos = baryToCart(m.b)
      const isHov = hoveredModel === i
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, isHov ? 7 : 5, 0, Math.PI * 2)
      ctx.fillStyle = m.color
      ctx.fill()
      if (isHov) {
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'
        ctx.lineWidth = 1.5
        ctx.stroke()
        ctx.fillStyle = TEXT
        ctx.font = '11px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(m.name, pos.x, pos.y - 13)
      }
    })

    // ── User point ───────────────────────────────────────────
    const pt = baryToCart(b)
    // Lines to each vertex
    VERTS.forEach(v => {
      ctx.beginPath()
      ctx.moveTo(pt.x, pt.y)
      ctx.lineTo(v.x, v.y)
      ctx.strokeStyle = 'rgba(201,168,76,0.22)'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 4])
      ctx.stroke()
      ctx.setLineDash([])
    })

    ctx.save()
    ctx.shadowColor = GOLD
    ctx.shadowBlur = 14
    ctx.beginPath()
    ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2)
    ctx.fillStyle = GOLD
    ctx.fill()
    ctx.restore()

    // ── Bar readout ──────────────────────────────────────────
    const barY  = VERTS[1].y + 42
    const barW  = 300
    const barX  = (W - barW) / 2
    const barH  = 6
    const gap   = 7
    const labels = ['Capability', 'Cost eff.', 'Speed']
    b.forEach((val, i) => {
      const y = barY + i * (barH + gap + 14)
      ctx.fillStyle = MUTED
      ctx.font = '10px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(labels[i], barX, y - 2)
      ctx.fillStyle = 'rgba(201,168,76,0.12)'
      ctx.fillRect(barX + 62, y - barH, barW - 62, barH)
      ctx.fillStyle = GOLD
      ctx.fillRect(barX + 62, y - barH, (barW - 62) * val, barH)
      ctx.fillStyle = MUTED
      ctx.textAlign = 'right'
      ctx.fillText(`${Math.round(val * 100)}%`, barX + barW, y - 2)
    })
  }, [])

  useEffect(() => { draw(bary, hovered) }, [bary, hovered, draw])

  const getPoint = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = W / rect.width
    const scaleY = H / rect.height
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY }
  }

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getPoint(e)
    if (dragging) {
      setBary(clampToBary(cartToBary(x, y)))
    }
    // Hover detection for model dots
    const hov = MODELS.findIndex(m => {
      const pos = baryToCart(m.b)
      return Math.hypot(pos.x - x, pos.y - y) < 10
    })
    setHovered(hov === -1 ? null : hov)
  }, [dragging])

  return (
    <div style={{ margin: '2em auto', maxWidth: W, userSelect: 'none' }}>
      <canvas
        ref={canvasRef}
        width={W} height={H}
        style={{ display: 'block', width: '100%', cursor: dragging ? 'grabbing' : 'grab' }}
        onMouseDown={e => { setDragging(true); handleMove(e) }}
        onMouseMove={handleMove}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => { setDragging(false); setHovered(null) }}
        onTouchStart={e => { setDragging(true); handleMove(e) }}
        onTouchMove={handleMove}
        onTouchEnd={() => setDragging(false)}
      />
      <p style={{
        textAlign: 'center', fontSize: '0.8rem', fontStyle: 'italic',
        color: 'rgba(232,226,216,0.4)', marginTop: '0.5rem',
      }}>
        Drag the gold point · hover dots for model names
      </p>
    </div>
  )
}
