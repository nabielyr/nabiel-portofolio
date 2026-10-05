import { useEffect, useRef, useState } from 'react'
import { useIsTouch } from '../hooks/useMediaQuery'
import styles from './Cursor.module.css'

const INTERACTIVE = 'a, button, [role="button"], input, textarea, select, label, [data-cursor], .clickable'

/**
 * AI Target Reticle / Precision Node Cursor
 *
 * Performance Architecture:
 * - Direct GPU translate3d on DOM refs (0ms lag, zero React re-renders on mousemove).
 * - Smooth 120fps lerp loop for the outer reticle brackets.
 * - Instant 1:1 hardware tracking for the precision center dot.
 * - Pure CSS transitions for state morphs (default -> hover -> locked -> label).
 */
export default function Cursor() {
  const isTouch = useIsTouch()
  const dotRef = useRef(null)
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

    let rafId = null

    // Direct pointermove: instantaneous update for the center dot
    const onMove = (e) => {
      const { clientX, clientY } = e
      pos.current.targetX = clientX
      pos.current.targetY = clientY

      if (!pos.current.visible) {
        pos.current.visible = true
        pos.current.currentX = clientX
        pos.current.currentY = clientY
        if (layerRef.current) layerRef.current.style.opacity = '1'
      }

      // Zero-latency update for the center dot
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${clientX}px, ${clientY}px, 0)`
      }
    }

    // RAF loop: smooth interpolation for the cyber reticle brackets
    const updateLoop = () => {
      const p = pos.current
      if (p.visible) {
        // High-performance lerp factor: 0.20 provides snappy yet organic tracking
        p.currentX += (p.targetX - p.currentX) * 0.22
        p.currentY += (p.targetY - p.currentY) * 0.22

        if (reticleRef.current) {
          reticleRef.current.style.transform = `translate3d(${p.currentX}px, ${p.currentY}px, 0)`
        }
      }
      rafId = requestAnimationFrame(updateLoop)
    }

    rafId = requestAnimationFrame(updateLoop)

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

      {/* Central Precision Point (0ms instant hardware sync) */}
      <div ref={dotRef} className={styles.dotAnchor}>
        <div className={`${styles.dot} ${hover ? styles.dotHover : ''}`} />
      </div>
    </div>
  )
}
