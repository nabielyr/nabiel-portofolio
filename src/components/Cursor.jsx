import { useEffect, useRef, useState } from 'react'
import { useIsTouch } from '../hooks/useMediaQuery'
import styles from './Cursor.module.css'

const INTERACTIVE = 'a, button, [role="button"], input, textarea, select, label, [data-cursor], .clickable'

// Reticle follow speed (1/s). Frame-rate independent: same feel at 60Hz and 144Hz.
const FOLLOW = 30
const SETTLE = 0.1 // px — stop the loop once the reticle has caught up

/**
 * AI Target Reticle / Precision Node Cursor
 *
 * Performance Architecture:
 * - The precision dot is the native OS cursor (an SVG image set in global.css),
 *   so it is drawn by the hardware cursor plane with zero latency and never
 *   stutters, even when the page is busy.
 * - The reticle brackets trail it with a time-based lerp written straight to a
 *   DOM ref via translate3d (zero React re-renders on mousemove). The rAF loop
 *   only runs while the reticle is still moving.
 * - Pure CSS transitions for state morphs (default -> hover -> locked -> label).
 */
export default function Cursor() {
  const isTouch = useIsTouch()
  const reticleRef = useRef(null)
  const layerRef = useRef(null)

  const [cursorState, setCursorState] = useState({
    hover: false,
    down: false,
    label: '',
  })

  // Mutable coordinates to avoid React re-renders during motion
  const pos = useRef({
    targetX: -100,
    targetY: -100,
    currentX: -100,
    currentY: -100,
    visible: false,
  })

  useEffect(() => {
    if (isTouch) return undefined
    const root = document.documentElement
    root.classList.add('has-custom-cursor')

    let rafId = 0
    let last = 0

    const place = (x, y) => {
      if (reticleRef.current) reticleRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
    }

    const tick = (now) => {
      const p = pos.current
      // rAF timestamps can trail performance.now() slightly on the first frame
      const dt = Math.min(Math.max(now - last, 0) / 1000, 0.1)
      last = now
      const k = 1 - Math.exp(-dt * FOLLOW)
      p.currentX += (p.targetX - p.currentX) * k
      p.currentY += (p.targetY - p.currentY) * k

      if (Math.abs(p.targetX - p.currentX) < SETTLE && Math.abs(p.targetY - p.currentY) < SETTLE) {
        p.currentX = p.targetX
        p.currentY = p.targetY
        place(p.currentX, p.currentY)
        rafId = 0
        return
      }
      place(p.currentX, p.currentY)
      rafId = requestAnimationFrame(tick)
    }

    const onMove = (e) => {
      const p = pos.current
      p.targetX = e.clientX
      p.targetY = e.clientY

      if (!p.visible) {
        p.visible = true
        p.currentX = e.clientX
        p.currentY = e.clientY
        place(p.currentX, p.currentY)
        if (layerRef.current) layerRef.current.style.opacity = '1'
      }

      if (!rafId) {
        last = performance.now()
        rafId = requestAnimationFrame(tick)
      }
    }

    // Context / element detection
    let currentInteractiveEl = null
    const onOver = (e) => {
      const target = e.target instanceof Element ? e.target : null
      const interactive = target?.closest(INTERACTIVE)
      const labelled = target?.closest('[data-cursor-label]')

      if (interactive !== currentInteractiveEl) {
        currentInteractiveEl = interactive
        const hasLabel = labelled?.getAttribute('data-cursor-label') || ''
        setCursorState((prev) => ({
          ...prev,
          hover: Boolean(interactive || labelled),
          label: hasLabel,
        }))
      }
    }

    const onLeave = () => {
      pos.current.visible = false
      if (layerRef.current) layerRef.current.style.opacity = '0'
    }

    const onDown = () => setCursorState((prev) => ({ ...prev, down: true }))
    const onUp = () => setCursorState((prev) => ({ ...prev, down: false }))

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerover', onOver, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)

    return () => {
      root.classList.remove('has-custom-cursor')
      cancelAnimationFrame(rafId)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerover', onOver)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
    }
  }, [isTouch])

  if (isTouch) return null

  const { hover, down, label } = cursorState

  let modeClass = styles.defaultMode
  if (label) modeClass = styles.labelMode
  else if (down) modeClass = styles.downMode
  else if (hover) modeClass = styles.hoverMode

  return (
    <div ref={layerRef} className={styles.layer} aria-hidden="true">
      {/* Outer AI Target Reticle (smooth lerp follow) */}
      <div ref={reticleRef} className={styles.reticleAnchor}>
        <div className={`${styles.reticle} ${modeClass}`}>
          {/* 4 Cybernetic Corner Brackets */}
          <span className={`${styles.bracket} ${styles.tl}`} />
          <span className={`${styles.bracket} ${styles.tr}`} />
          <span className={`${styles.bracket} ${styles.bl}`} />
          <span className={`${styles.bracket} ${styles.br}`} />

          {/* Central cross-hair micro lines visible on hover */}
          <span className={styles.crossH} />
          <span className={styles.crossV} />

          {/* Label badge when hovering project cards */}
          {label && <span className={styles.labelText}>{label} ↗</span>}
        </div>
      </div>
    </div>
  )
}
