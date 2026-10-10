import { useEffect, useRef } from 'react'
import styles from './FlapTicker.module.css'

const STEP_MS = 280 // how often the text moves one tile to the left
const FLIP_MS = 95 // each half of a flip
const WAVE_MS = 4 // tiny delay from tile to tile so a step rolls like a wave
const RESUME_MS = 500 // pause after the pointer leaves before the board moves on
const FRICTION = 0.004 // how fast a flung board slows down (per ms)
const DOT = '•'

/** [{ label, value }] -> one long row of { ch, accent } cells, looped */
function toCells(items) {
  const cells = []
  const push = (str, accent) => [...str.toUpperCase()].forEach((ch) => cells.push({ ch, accent }))
  items.forEach(({ label, value }) => {
    push(label, true)
    push(' ', false)
    push(value, false)
    push('  ', false)
    cells.push({ ch: DOT, accent: true })
    push('  ', false)
  })
  return cells
}

/**
 * A marquee made from a row of split-flap tiles set into a dark board. The
 * tiles stay put; the text travels through them, every tile flipping when its
 * letter changes - the way a station ticker board works.
 *
 * It stops while the pointer is over it, and can be dragged (or flung) left
 * and right: every tile's width of drag moves the text one tile.
 *
 * Drawn on a single 2D canvas: one layer, no DOM or style work per step. The
 * flip is the classic 2D trick of squashing the moving half toward the hinge.
 */
export default function FlapTicker({ items, label, dragLabel, instant = false }) {
  const wrap = useRef(null)
  const canvasRef = useRef(null)
  const cellsRef = useRef(toCells(items))
  const offsetRef = useRef(0)

  // The loop reads the latest cells without restarting (the clock updates every minute)
  useEffect(() => {
    cellsRef.current = toCells(items)
  }, [items])

  useEffect(() => {
    const el = wrap.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let tiles = [] // { cur, prev, start } where cur/prev are cells
    let d = null // dimensions + paints
    let raf = 0
    let stepTimer = 0
    let visible = true
    // pointer state: hovering or dragging stops the auto steps
    let hover = false
    let drag = null // { id, lastX, lastT, v } while a pointer is down
    let glide = null // { v, last, raf } after a fling
    let acc = 0 // px dragged that haven't added up to a whole tile yet
    let resumeAt = 0

    const readTheme = () => {
      const css = getComputedStyle(el)
      const v = (name) => css.getPropertyValue(name).trim()
      const { h } = d
      const mid = h / 2
      const grad = (y0, y1, a, b) => {
        const g = ctx.createLinearGradient(0, y0, 0, y1)
        g.addColorStop(0, a)
        g.addColorStop(1, b)
        return g
      }
      // gradients live in tile-local space (origin on the hinge), so one set serves every tile
      const { height, rail } = d
      const frame = ctx.createLinearGradient(0, 0, 0, height)
      frame.addColorStop(0, v('--frame-a'))
      frame.addColorStop(0.5, v('--frame-b'))
      frame.addColorStop(1, v('--frame-c'))
      // inner shadow at the top and bottom of the recessed slot
      const slotShade = ctx.createLinearGradient(0, rail, 0, height - rail)
      slotShade.addColorStop(0, 'rgba(0, 0, 0, 0.45)')
      slotShade.addColorStop(0.12, 'rgba(0, 0, 0, 0)')
      slotShade.addColorStop(0.88, 'rgba(0, 0, 0, 0)')
      slotShade.addColorStop(1, 'rgba(0, 0, 0, 0.35)')
      d.paint = {
        frame,
        slot: v('--slot'),
        slotShade,
        railTop: v('--rail-top'),
        railBottom: v('--rail-bottom'),
        rivet: v('--rivet'),
        top: grad(-mid, 0, v('--tile-top-a'), v('--tile-top-b')),
        bottom: grad(0, mid, v('--tile-bottom-a'), v('--tile-bottom-b')),
        ink: v('--tile-ink'),
        accent: v('--tile-accent'),
        pin: v('--tile-pin'),
      }
    }

    const measure = () => {
      const css = getComputedStyle(el)
      const num = (name) => parseFloat(css.getPropertyValue(name))
      const w = num('--tile-w')
      const h = num('--tile-h')
      const gap = num('--tile-gap')
      const pad = num('--board-pad')
      const rail = num('--rail')
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = el.clientWidth
      const height = h + pad * 2
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.height = `${height}px`
      const count = Math.ceil(width / (w + gap)) + 1
      d = {
        w, h, gap, pad, rail, dpr, width, height, count,
        r: Math.max(3, w * 0.13),
        font: `800 ${Math.round(h * 0.6)}px "Big Shoulders Display", "Arial Narrow", sans-serif`,
      }
      readTheme()
      const cells = cellsRef.current
      tiles = Array.from({ length: count }, (_, i) => {
        const cell = cells[(offsetRef.current + i) % cells.length]
        return { cur: cell, prev: cell, start: -Infinity }
      })
    }

    const roundedHalf = (isTop) => {
      const { w, h, r } = d
      const mid = h / 2
      ctx.beginPath()
      const y = isTop ? -mid : 1
      const hh = mid - 1
      const radii = isTop ? [r, r, 0, 0] : [0, 0, r, r]
      if (ctx.roundRect) ctx.roundRect(0, y, w, hh, radii)
      else ctx.rect(0, y, w, hh)
    }

    // One half of a tile in tile-local space (origin on the hinge), optionally squashed
    const half = (x, y, cell, isTop, squash = 1, shade = 0) => {
      const { w, h } = d
      const p = d.paint
      ctx.save()
      ctx.translate(x, y + h / 2)
      ctx.scale(1, squash)
      roundedHalf(isTop)
      ctx.fillStyle = isTop ? p.top : p.bottom
      ctx.fill()
      ctx.save()
      ctx.clip()
      if (cell.ch === DOT) {
        ctx.fillStyle = p.accent
        ctx.beginPath()
        ctx.arc(w / 2, 0, h * 0.085, 0, Math.PI * 2)
        ctx.fill()
      } else if (cell.ch !== ' ') {
        ctx.fillStyle = cell.accent ? p.accent : p.ink
        ctx.fillText(cell.ch, w / 2, h * 0.03)
      }
      if (isTop) {
        // a hairline of light along the top edge
        ctx.fillStyle = 'rgba(255, 255, 255, 0.07)'
        ctx.fillRect(0, -h / 2, w, 1)
      }
      if (shade) {
        ctx.fillStyle = shade > 0 ? `rgba(0, 0, 0, ${shade})` : `rgba(255, 255, 255, ${-shade})`
        ctx.fillRect(0, -h / 2, w, h)
      }
      ctx.restore()
      ctx.restore()
    }

    const pins = (x, y) => {
      const { w, h } = d
      ctx.fillStyle = d.paint.pin
      const pw = Math.max(2, w * 0.08)
      const ph = Math.max(4, h * 0.12)
      ctx.fillRect(x - pw * 0.35, y + h / 2 - ph / 2, pw, ph)
      ctx.fillRect(x + w - pw * 0.65, y + h / 2 - ph / 2, pw, ph)
    }

    // The board itself: a navy frame with lighter rails, rivets and a recessed slot
    const housing = () => {
      const { width, height, rail } = d
      const p = d.paint
      ctx.fillStyle = p.frame
      ctx.fillRect(0, 0, width, height)
      // recessed slot the tiles sit in
      const slotY = rail + 2
      const slotH = height - rail * 2 - 4
      ctx.fillStyle = p.slot
      ctx.fillRect(0, slotY, width, slotH)
      ctx.fillStyle = p.slotShade
      ctx.fillRect(0, slotY, width, slotH)
      // rails with a catch of light on their edges
      ctx.fillStyle = p.railTop
      ctx.fillRect(0, 0, width, rail)
      ctx.fillStyle = p.railBottom
      ctx.fillRect(0, height - rail, width, rail)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.14)'
      ctx.fillRect(0, 0, width, 1)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)'
      ctx.fillRect(0, height - rail, width, 1)
      // rivets along both rails
      for (let x = 24; x < width; x += 112) {
        for (const y of [rail / 2, height - rail / 2]) {
          ctx.fillStyle = p.rivet
          ctx.beginPath()
          ctx.arc(x, y, 1.6, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
          ctx.fillRect(x - 0.8, y - 1.1, 0.9, 0.9)
        }
      }
    }

    const shadowUnder = (x, y) => {
      const { w, h, r } = d
      ctx.fillStyle = 'rgba(0, 0, 0, 0.38)'
      ctx.beginPath()
      if (ctx.roundRect) ctx.roundRect(x + 1, y + 2.5, w, h, r)
      else ctx.rect(x + 1, y + 2.5, w, h)
      ctx.fill()
    }

    const draw = (now) => {
      const { w, gap, pad, dpr, font } = d
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      housing()
      ctx.font = font
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const y = pad
      let busy = false
      for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i]
        const x = i * (w + gap) + gap / 2
        const t = (now - tile.start) / FLIP_MS
        shadowUnder(x, y)
        if (t >= 2 || tile.prev === tile.cur) {
          half(x, y, tile.cur, true)
          half(x, y, tile.cur, false)
        } else if (t < 0) {
          busy = true
          half(x, y, tile.prev, true)
          half(x, y, tile.prev, false)
        } else if (t < 1) {
          // the old upper leaf falls toward us, revealing the new top behind it
          busy = true
          half(x, y, tile.cur, true)
          half(x, y, tile.prev, false)
          const k = Math.cos((t * Math.PI) / 2)
          half(x, y, tile.prev, true, k, (1 - k) * 0.4)
        } else {
          // the new lower leaf swings down onto the old bottom
          busy = true
          half(x, y, tile.cur, true)
          half(x, y, tile.prev, false)
          const k = Math.sin(((t - 1) * Math.PI) / 2)
          half(x, y, tile.cur, false, k, -(1 - k) * 0.12)
        }
        pins(x, y)
      }
      return busy
    }

    const loop = (now) => {
      raf = 0
      if (draw(now)) raf = requestAnimationFrame(loop)
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(loop)
    }

    // move the text one tile: +1 = to the left (the normal direction), -1 = to the right
    const shift = (dir) => {
      const cells = cellsRef.current
      offsetRef.current = (offsetRef.current + dir + cells.length) % cells.length
      const now = performance.now()
      const last = tiles.length - 1
      tiles.forEach((tile, i) => {
        const next = cells[(offsetRef.current + i) % cells.length]
        if (next.ch !== tile.cur.ch || next.accent !== tile.cur.accent) {
          tile.prev = tile.cur
          tile.cur = next
          // the wave rolls the way the text travels
          tile.start = now + (dir > 0 ? i : last - i) * WAVE_MS
        } else {
          tile.cur = next
        }
      })
      kick()
    }

    // turn dragged pixels into whole-tile moves
    const travel = (px) => {
      const cell = d.w + d.gap
      acc += px
      while (acc >= cell) {
        shift(-1)
        acc -= cell
      }
      while (acc <= -cell) {
        shift(1)
        acc += cell
      }
    }

    const held = () => hover || drag || glide || performance.now() < resumeAt

    const step = () => {
      if (visible && !document.hidden && d && !held()) shift(1)
      stepTimer = setTimeout(step, STEP_MS)
    }

    const stopGlide = () => {
      if (!glide) return
      cancelAnimationFrame(glide.raf)
      glide = null
    }

    const glideFrame = (now) => {
      const g = glide
      const dt = Math.min(now - g.last, 50)
      g.last = now
      travel(g.v * dt)
      g.v *= Math.exp(-FRICTION * dt)
      if (Math.abs(g.v) < 0.04) {
        glide = null
        acc = 0
        resumeAt = performance.now() + RESUME_MS
        return
      }
      g.raf = requestAnimationFrame(glideFrame)
    }

    const onEnter = (e) => {
      if (e.pointerType === 'mouse') hover = true
    }
    const onLeave = (e) => {
      if (e.pointerType !== 'mouse') return
      hover = false
      resumeAt = performance.now() + RESUME_MS
    }
    const onDown = (e) => {
      if (e.button !== 0 || !d) return
      stopGlide()
      acc = 0
      drag = { id: e.pointerId, lastX: e.clientX, lastT: e.timeStamp, v: 0 }
      el.setPointerCapture?.(e.pointerId)
    }
    const onMove = (e) => {
      if (!drag || e.pointerId !== drag.id) return
      const dx = e.clientX - drag.lastX
      const dt = Math.max(1, e.timeStamp - drag.lastT)
      drag.lastX = e.clientX
      drag.lastT = e.timeStamp
      // smoothed speed in px/ms, used for the fling
      drag.v = drag.v * 0.6 + (dx / dt) * 0.4
      travel(dx)
    }
    const onUp = (e) => {
      if (!drag || e.pointerId !== drag.id) return
      const { v } = drag
      const stale = e.timeStamp - drag.lastT > 80 // the pointer stopped before letting go
      drag = null
      if (!stale && Math.abs(v) > 0.25) {
        glide = { v: Math.max(-4, Math.min(4, v)), last: performance.now(), raf: 0 }
        glide.raf = requestAnimationFrame(glideFrame)
      } else {
        acc = 0
        resumeAt = performance.now() + RESUME_MS
      }
    }

    measure()
    document.fonts?.ready.then(() => kick())
    kick()
    if (!instant) stepTimer = setTimeout(step, 1000)

    const ro = new ResizeObserver(() => {
      measure()
      kick()
    })
    ro.observe(el)

    // pause while off screen
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
    })
    io.observe(el)

    // repaint in the new colours when the theme flips
    const mo = new MutationObserver(() => {
      readTheme()
      kick()
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    el.addEventListener('pointerenter', onEnter)
    el.addEventListener('pointerleave', onLeave)
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(stepTimer)
      stopGlide()
      el.removeEventListener('pointerenter', onEnter)
      el.removeEventListener('pointerleave', onLeave)
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      ro.disconnect()
      io.disconnect()
      mo.disconnect()
    }
  }, [instant])

  return (
    <div
      ref={wrap}
      className={styles.ticker}
      role="marquee"
      aria-label={label}
      data-cursor-label={dragLabel}
      data-cursor-icon="↔"
    >
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
    </div>
  )
}
