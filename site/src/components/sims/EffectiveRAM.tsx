'use client'

import { useEffect, useRef, useState } from 'react'

const GOLD  = '#C9A84C'
const MUTED = 'rgba(232,226,216,0.45)'
const TEXT  = '#E8E2D8'

const RAM_TIERS  = [8, 16, 24, 32, 64]

const OS_PRESETS = [
  {
    label:    'Linux',
    gb:       1.0,
    segLabel: 'OS',
    note:     null,
    unified:  false,
  },
  {
    label:    'Windows',
    gb:       2.5,
    segLabel: 'OS',
    note:     null,
    unified:  false,
  },
  {
    label:    'macOS',
    gb:       4.5,
    segLabel: 'OS + cache',
    note:     'macOS actively uses spare RAM for file cache and compressed memory. Actual kernel footprint is ~1 GB — the rest is reclaimed under pressure, but counts against your model headroom in practice.',
    unified:  false,
  },
  {
    label:    'MLX',
    gb:       1.5,
    segLabel: 'kernel',
    note:     'Apple Silicon uses unified memory — CPU and GPU share the same pool. MLX can address all of it for model weights. The OS footprint here is only the genuinely untouchable kernel reservation.',
    unified:  true,
  },
]

const MODEL_OPTS = [
  { label: '3B',  params: 3  },
  { label: '7B',  params: 7  },
  { label: '13B', params: 13 },
  { label: '30B', params: 30 },
]
const QUANT_OPTS = [
  { label: 'Q4',   bpp: 0.5 },
  { label: 'INT8', bpp: 1.0 },
  { label: 'FP16', bpp: 2.0 },
]

const SEG = {
  os:       'rgba(180, 70, 70, 0.80)',
  kernel:   'rgba(140, 90, 180, 0.75)',
  model:    'rgba(201,168, 76, 0.90)',
  headroom: 'rgba(100,200,155, 0.75)',
  empty:    'rgba(255,255,255, 0.04)',
}

const W     = 560
const H     = 178
const PAD   = 20
const BAR_W = W - PAD * 2
const BAR_Y = 50
const BAR_H = 64

function fmt(gb: number) {
  return `${gb % 1 === 0 ? gb : gb.toFixed(1)} GB`
}

function statusColor(headroom: number): string {
  if (headroom < 0)   return 'rgba(200, 70, 70, 0.95)'
  if (headroom < 1.5) return 'rgba(210,130, 50, 0.95)'
  if (headroom < 4)   return 'rgba(210,185, 60, 0.95)'
  return 'rgba(100,200,155, 0.95)'
}

function statusText(headroom: number, unified: boolean): string {
  if (headroom < 0)   return `won't fit  —  ${fmt(Math.abs(headroom))} short`
  if (unified)        return `${fmt(headroom)} available  —  full pool addressable by model`
  if (headroom < 1.5) return `very tight  —  ${fmt(headroom)} free for inference`
  if (headroom < 4)   return `workable  —  ${fmt(headroom)} free for inference`
  return `comfortable  —  ${fmt(headroom)} free for inference`
}

export default function EffectiveRAM() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [totalRAM, setTotalRAM] = useState(8)
  const [osIdx,    setOsIdx]    = useState(2)  // macOS default
  const [modelIdx, setModelIdx] = useState(1)  // 7B default
  const [quantIdx, setQuantIdx] = useState(0)  // Q4 default

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, W, H)

    const preset  = OS_PRESETS[osIdx]
    const osGB    = preset.gb
    const modelGB = (MODEL_OPTS[modelIdx].params * 1e9 * QUANT_OPTS[quantIdx].bpp) / (1024 ** 3)
    const avail   = totalRAM - osGB
    const headroom = avail - modelGB
    const fits    = headroom >= 0

    const osW    = (osGB / totalRAM) * BAR_W
    const modelW = (Math.min(modelGB, Math.max(avail, 0)) / totalRAM) * BAR_W
    const headW  = Math.max(0, (headroom / totalRAM) * BAR_W)

    const osColor = preset.unified ? SEG.kernel : SEG.os

    // ── Title ──────────────────────────────────────────────────
    ctx.fillStyle = MUTED
    ctx.font = '10px monospace'
    ctx.textAlign = 'left'
    ctx.fillText('EFFECTIVE RAM FOR INFERENCE', PAD, 20)

    ctx.fillStyle = GOLD
    ctx.font = '600 12px monospace'
    ctx.textAlign = 'right'
    ctx.fillText(`${fmt(totalRAM)} total`, W - PAD, 20)

    // ── Track ──────────────────────────────────────────────────
    ctx.fillStyle = SEG.empty
    ctx.fillRect(PAD, BAR_Y, BAR_W, BAR_H)
    ctx.strokeStyle = 'rgba(201,168,76,0.12)'
    ctx.lineWidth = 1
    ctx.strokeRect(PAD, BAR_Y, BAR_W, BAR_H)

    // ── OS segment ─────────────────────────────────────────────
    ctx.fillStyle = osColor
    ctx.fillRect(PAD + 1, BAR_Y + 1, osW - 2, BAR_H - 2)
    if (osW > 52) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.textAlign = 'center'
      ctx.font = '700 9px monospace'
      ctx.fillText(preset.segLabel.toUpperCase(), PAD + osW / 2, BAR_Y + BAR_H / 2 - 5)
      ctx.font = '9px monospace'
      ctx.fillText(fmt(osGB), PAD + osW / 2, BAR_Y + BAR_H / 2 + 8)
    }

    // ── Model segment ──────────────────────────────────────────
    if (modelW > 0) {
      ctx.fillStyle = fits ? SEG.model : 'rgba(201,168,76,0.45)'
      ctx.fillRect(PAD + osW + 1, BAR_Y + 1, modelW - 1, BAR_H - 2)
      if (modelW > 52) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)'
        ctx.textAlign = 'center'
        const mx = PAD + osW + modelW / 2
        ctx.font = '700 9px monospace'
        ctx.fillText('MODEL', mx, BAR_Y + BAR_H / 2 - 5)
        ctx.font = '9px monospace'
        ctx.fillText(fmt(modelGB), mx, BAR_Y + BAR_H / 2 + 8)
      }
    }

    // ── Headroom segment ───────────────────────────────────────
    if (fits && headW > 1) {
      ctx.fillStyle = SEG.headroom
      ctx.fillRect(PAD + osW + modelW + 1, BAR_Y + 1, headW - 2, BAR_H - 2)
      if (headW > 52) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)'
        ctx.textAlign = 'center'
        const hx = PAD + osW + modelW + headW / 2
        ctx.font = '700 9px monospace'
        ctx.fillText('FREE', hx, BAR_Y + BAR_H / 2 - 5)
        ctx.font = '9px monospace'
        ctx.fillText(fmt(headroom), hx, BAR_Y + BAR_H / 2 + 8)
      }
    }

    // ── Overflow hatching ──────────────────────────────────────
    if (!fits) {
      const hatchX = PAD + osW + modelW
      const hatchW = BAR_W - osW - modelW
      if (hatchW > 1) {
        ctx.save()
        ctx.beginPath()
        ctx.rect(hatchX + 1, BAR_Y + 1, hatchW - 2, BAR_H - 2)
        ctx.clip()
        ctx.strokeStyle = 'rgba(180,70,70,0.30)'
        ctx.lineWidth = 1.5
        for (let i = -BAR_H; i < BAR_W; i += 10) {
          ctx.beginPath()
          ctx.moveTo(hatchX + i, BAR_Y)
          ctx.lineTo(hatchX + i + BAR_H, BAR_Y + BAR_H)
          ctx.stroke()
        }
        ctx.restore()
      }
    }

    // ── Status ─────────────────────────────────────────────────
    const statusY = BAR_Y + BAR_H + 20
    ctx.fillStyle = statusColor(headroom)
    ctx.font = '600 11px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(statusText(headroom, preset.unified), PAD, statusY)

    // ── Legend ─────────────────────────────────────────────────
    const legY = statusY + 22
    const legend = [
      { color: osColor,      label: preset.segLabel  },
      { color: SEG.model,    label: 'model weights'  },
      { color: SEG.headroom, label: 'free for inference' },
    ]
    let lx = PAD
    legend.forEach(({ color, label }) => {
      ctx.fillStyle = color
      ctx.fillRect(lx, legY - 7, 8, 8)
      ctx.fillStyle = MUTED
      ctx.font = '9px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(label, lx + 12, legY)
      lx += ctx.measureText(label).width + 32
    })

  }, [totalRAM, osIdx, modelIdx, quantIdx])

  function btn(active: boolean): React.CSSProperties {
    return {
      fontFamily:   'monospace',
      fontSize:     '0.75rem',
      padding:      '0.2em 0.65em',
      borderWidth:  '1px',
      borderStyle:  'solid',
      borderColor:  active ? GOLD : 'rgba(201,168,76,0.3)',
      borderRadius: 2,
      cursor:       'pointer',
      background:   active ? GOLD : 'transparent',
      color:        active ? '#131110' : TEXT,
      transition:   'all 0.12s ease',
    }
  }

  const row: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    fontSize: '0.75rem', fontFamily: 'monospace', color: MUTED,
  }

  const currentNote = OS_PRESETS[osIdx].note

  return (
    <div style={{ margin: '2em auto', maxWidth: W, userSelect: 'none' }}>
      <canvas ref={ref} width={W} height={H} style={{ display: 'block', width: '100%' }} />
      <div style={{ paddingLeft: PAD, marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        <div style={row}>
          <span style={{ width: 80 }}>total ram</span>
          {RAM_TIERS.map(t => (
            <button key={t} style={btn(t === totalRAM)} onClick={() => setTotalRAM(t)}>{t} GB</button>
          ))}
        </div>
        <div style={row}>
          <span style={{ width: 80 }}>os</span>
          {OS_PRESETS.map((o, i) => (
            <button key={o.label} style={btn(i === osIdx)} onClick={() => setOsIdx(i)}>{o.label}</button>
          ))}
        </div>
        <div style={row}>
          <span style={{ width: 80 }}>model</span>
          {MODEL_OPTS.map((m, i) => (
            <button key={m.label} style={btn(i === modelIdx)} onClick={() => setModelIdx(i)}>{m.label}</button>
          ))}
        </div>
        <div style={row}>
          <span style={{ width: 80 }}>precision</span>
          {QUANT_OPTS.map((q, i) => (
            <button key={q.label} style={btn(i === quantIdx)} onClick={() => setQuantIdx(i)}>{q.label}</button>
          ))}
        </div>
        {currentNote && (
          <p style={{
            margin: '0.25rem 0 0',
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            color: MUTED,
            fontStyle: 'italic',
            lineHeight: 1.55,
            maxWidth: BAR_W,
          }}>
            {currentNote}
          </p>
        )}
      </div>
    </div>
  )
}
