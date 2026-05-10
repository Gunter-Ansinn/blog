'use client'

import { useEffect, useRef } from 'react'

const CANVAS_W   = 400
const GRID       = 8          // 8×8 cells
const CELL       = 25         // px per cell
const IMAGE_SIZE = GRID * CELL                         // 200px
const IMAGE_X    = (CANVAS_W - IMAGE_SIZE) / 2        // 100px
const IMAGE_Y    = 40

const PATCH         = 2                                // 2×2 cells per patch
const PATCHES_ROW   = GRID / PATCH                    // 4
const N_PATCHES     = PATCHES_ROW * PATCHES_ROW       // 16

const SEQ_CELL    = 18
const SEQ_GAP     = 4
const SEQ_TOTAL_W = N_PATCHES * (SEQ_CELL + SEQ_GAP) - SEQ_GAP
const SEQ_X       = (CANVAS_W - SEQ_TOTAL_W) / 2
const SEQ_Y       = IMAGE_Y + IMAGE_SIZE + 38
const CANVAS_H    = SEQ_Y + SEQ_CELL + 32

const GOLD     = '#C9A84C'
const GOLD_DIM = 'rgba(201,168,76,0.18)'
const OVERLAY  = 'rgba(0,0,0,0.48)'

// Pseudo-image: warm hue gradient that looks like photo colour regions
function cellColor(r: number, c: number): string {
  const nx = c / (GRID - 1)
  const ny = r / (GRID - 1)
  const h = (nx * 180 + ny * 100 + Math.sin(nx * Math.PI * 2 + ny) * 35 + 200) % 360
  const s = 52 + Math.sin(nx * 3 + ny * 2) * 14
  const l = 43 + Math.cos(nx * 4 + ny * 3) * 9
  return `hsl(${h.toFixed(0)},${s.toFixed(0)}%,${l.toFixed(0)}%)`
}

const COLORS: string[][] = Array.from({ length: GRID }, (_, r) =>
  Array.from({ length: GRID }, (_, c) => cellColor(r, c))
)

function patchColor(idx: number): string {
  const pr = Math.floor(idx / PATCHES_ROW)
  const pc = idx % PATCHES_ROW
  return COLORS[pr * PATCH][pc * PATCH]
}

const FPS              = 60
const FRAMES_PER_PATCH = Math.round(FPS * 0.45)
const PAUSE            = Math.round(FPS * 1.6)
const TOTAL            = N_PATCHES * FRAMES_PER_PATCH + PAUSE

export default function ImageChunking() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    let frame = 0
    let raf: number

    function tick() {
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

      const currentPatch = Math.min(
        Math.floor(frame / FRAMES_PER_PATCH),
        N_PATCHES - 1
      )
      const within = (frame % FRAMES_PER_PATCH) / FRAMES_PER_PATCH

      // ── Image cells ──────────────────────────────────────────
      for (let r = 0; r < GRID; r++) {
        for (let c = 0; c < GRID; c++) {
          const pIdx = Math.floor(r / PATCH) * PATCHES_ROW + Math.floor(c / PATCH)
          const x = IMAGE_X + c * CELL
          const y = IMAGE_Y + r * CELL
          ctx.fillStyle = COLORS[r][c]
          ctx.fillRect(x, y, CELL - 1, CELL - 1)
          if (pIdx < currentPatch) {
            ctx.fillStyle = OVERLAY
            ctx.fillRect(x, y, CELL - 1, CELL - 1)
          }
        }
      }

      // ── Active patch highlight ────────────────────────────────
      const aRow = Math.floor(currentPatch / PATCHES_ROW)
      const aCol = currentPatch % PATCHES_ROW
      const hx   = IMAGE_X + aCol * PATCH * CELL
      const hy   = IMAGE_Y + aRow * PATCH * CELL
      const hs   = PATCH * CELL - 1

      ctx.save()
      ctx.shadowColor  = GOLD
      ctx.shadowBlur   = 12
      ctx.strokeStyle  = GOLD
      ctx.lineWidth    = 2
      ctx.strokeRect(hx, hy, hs, hs)
      ctx.restore()

      // ── Patch counter label ───────────────────────────────────
      ctx.fillStyle  = GOLD
      ctx.font       = '10px monospace'
      ctx.textAlign  = 'center'
      ctx.fillText(`patch ${currentPatch + 1} / ${N_PATCHES}`, CANVAS_W / 2, IMAGE_Y + IMAGE_SIZE + 18)

      // ── Token sequence ────────────────────────────────────────
      for (let i = 0; i < N_PATCHES; i++) {
        const sx = SEQ_X + i * (SEQ_CELL + SEQ_GAP)
        if (i < currentPatch || (i === currentPatch && within > 0.45)) {
          ctx.fillStyle   = patchColor(i)
          ctx.fillRect(sx, SEQ_Y, SEQ_CELL, SEQ_CELL)
          ctx.strokeStyle = 'rgba(201,168,76,0.55)'
          ctx.lineWidth   = 1
          ctx.strokeRect(sx, SEQ_Y, SEQ_CELL, SEQ_CELL)
        } else {
          ctx.strokeStyle = GOLD_DIM
          ctx.lineWidth   = 1
          ctx.strokeRect(sx, SEQ_Y, SEQ_CELL, SEQ_CELL)
        }
      }

      frame = (frame + 1) % TOTAL
      raf = requestAnimationFrame(tick)
    }

    tick()
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <canvas
      ref={ref}
      width={CANVAS_W}
      height={CANVAS_H}
      style={{ display: 'block', margin: '2em auto', maxWidth: '100%' }}
    />
  )
}
