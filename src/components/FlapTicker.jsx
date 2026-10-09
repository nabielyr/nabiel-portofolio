import { useEffect, useRef } from 'react'
import styles from './FlapTicker.module.css'

const STEP_MS = 170 // how often the text moves one tile to the left
const FLIP_MS = 70 // each half of a flip
const WAVE_MS = 5 // tiny left-to-right delay so a step rolls like a wave

/**
 * A marquee made from a row of split-flap tiles. The tiles stay put; the text
 * travels through them, every tile flipping when its letter changes - the way
 * a station ticker board works.
 *
 * Drawn on a single 2D canvas: one layer, no DOM or style work per step. The
 * flip is the classic 2D trick of squashing the falling half toward the hinge.
 */
export default function FlapTicker({ text, instant = false }) {
  const wrap = useRef(null)
  const canvasRef = useRef(null)
  const textRef = useRef(text)
  const offsetRef = useRef(0)

  // The loop reads the latest text without restarting (the clock updates every minute)
  useEffect(() => {
    textRef.current = text
  }, [text])

  useEffect(() => {
    const el = wrap.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let tiles = [] // { cur, prev, start }
    let dims = null
    let colors = null
    let raf = 0
    let stepTimer = 0
    let visible = true

    const readColors = () => {
      const css = getComputedStyle(el)
      colors = {
        top: css.getPropertyValue('--tile-top').trim(),
        bottom: css.getPropertyValue('--tile-bg').trim(),
        ink: css.getPropertyValue('--tile-ink').trim(),
      }
    }

    const measure = () => {
      const css = getComputedStyle(el)
      const w = parseFloat(css.getPropertyValue('--tile-w'))
      const h = parseFloat(css.getPropertyValue('--tile-h'))
      const gap = parseFloat(css.getPropertyValue('--tile-gap'))
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = el.clientWidth
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.height = `${h}px`
      const count = Math.ceil(width / (w + gap)) + 1
      dims = { w, h, gap, dpr, count, font: `800 ${Math.round(h * 0.62)}px "Big Shoulders Display", "Arial Narrow", sans-serif` }
      const chars = [...textRef.current.toUpperCase()]
      tiles = Array.from({ length: count }, (_, i) => {
        const ch = chars[(offsetRef.current + i) % chars.length]
        return { cur: ch, prev: ch, start: -Infinity }
      })
      readColors()
    }

    // Draw one half of a tile (top or bottom), optionally squashed toward the hinge
    const half = (x, ch, isTop, squash = 1) => {
      const { w, h } = dims
      const mid = h / 2
      ctx.save()
      ctx.translate(x, mid)
      ctx.scale(1, squash)
      ctx.beginPath()
      if (isTop) ctx.rect(0, -mid, w, mid - 0.5)
      else ctx.rect(0, 0.5, w, mid)
      ctx.clip()
      ctx.fillStyle = isTop ? colors.top : colors.bottom
      ctx.fillRect(0, -mid, w, h)
      // the falling leaf darkens as it turns away from the light
      if (squash < 1) {
        ctx.fillStyle = `rgba(0, 0, 0, ${(1 - squash) * 0.35})`
        ctx.fillRect(0, -mid, w, h)
      }
      ctx.fillStyle = colors.ink
      ctx.fillText(ch, w / 2, 1)
      ctx.restore()
    }

    const draw = (now) => {
      const { w, h, gap, dpr, font } = dims
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, canvas.width, h)
      ctx.font = font
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      let busy = false
      for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i]
        const x = i * (w + gap)
        const t = (now - tile.start) / FLIP_MS
        if (t >= 2 || tile.prev === tile.cur) {
          half(x, tile.cur, true)
          half(x, tile.cur, false)
          continue
        }
        busy = true
        if (t < 0) {
          half(x, tile.prev, true)
          half(x, tile.prev, false)
        } else if (t < 1) {
          // old top falls away revealing the new top; old bottom still showing
          half(x, tile.cur, true)
          half(x, tile.prev, false)
          half(x, tile.prev, true, Math.cos((t * Math.PI) / 2))
        } else {
          // new bottom swings down onto the old one
          half(x, tile.cur, true)
          half(x, tile.prev, false)
          half(x, tile.cur, false, Math.sin(((t - 1) * Math.PI) / 2))
        }
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

    const step = () => {
      if (visible && !document.hidden && dims) {
        const chars = [...textRef.current.toUpperCase()]
        offsetRef.current = (offsetRef.current + 1) % chars.length
        const now = performance.now()
        tiles.forEach((tile, i) => {
          const next = chars[(offsetRef.current + i) % chars.length]
          if (next !== tile.cur) {
            tile.prev = tile.cur
            tile.cur = next
            tile.start = now + i * WAVE_MS
          }
        })
        kick()
      }
      stepTimer = setTimeout(step, STEP_MS)
    }

    measure()
    // fonts may arrive after the first draw
    document.fonts?.ready.then(() => kick())
    kick()
    if (!instant) stepTimer = setTimeout(step, 900)

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
      readColors()
      kick()
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(stepTimer)
      ro.disconnect()
      io.disconnect()
      mo.disconnect()
    }
  }, [instant])

  return (
    <div ref={wrap} className={styles.ticker} role="marquee" aria-label={text}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
    </div>
  )
}
