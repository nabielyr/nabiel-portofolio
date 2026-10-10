import { useEffect, useRef, useState } from 'react'
import { useIsTouch } from '../hooks/useMediaQuery'
import styles from './Cursor.module.css'

const INTERACTIVE = 'a, button, [role="button"], input, textarea, select, label, [data-cursor], .clickable'

// Ring follow speed (1/s). Frame-rate independent: same feel at 60Hz and 144Hz.
const FOLLOW = 30
const SETTLE = 0.1 // px - stop the loop once the ring has caught up

/**
 * Custom cursor
 *
 * - The precision dot is the native OS cursor (an SVG image set in global.css),
 *   so it is drawn by the hardware cursor plane with zero latency.
 * - A thin ring trails it with a time-based lerp written straight to a DOM ref
 *   via translate3d (no React re-renders on mousemove). The rAF loop only runs
 *   while the ring is still moving.
 * - The ring grows over links and buttons and becomes a label where an element
 *   asks for one (data-cursor-label, with an optional data-cursor-icon).
 */
export default function Cursor() {
  const isTouch = useIsTouch()
  const reticleRef = useRef(null)
  const layerRef = useRef(null)

  const [cursorState, setCursorState] = useState({
    hover: false,
    down: false,
    label: '',
    icon: '↗',
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
    let currentLabelledEl = null
    const onOver = (e) => {
      const target = e.target instanceof Element ? e.target : null
      const interactive = target?.closest(INTERACTIVE)
      const labelled = target?.closest('[data-cursor-label]')

      if (interactive !== currentInteractiveEl || labelled !== currentLabelledEl) {
        currentInteractiveEl = interactive
        currentLabelledEl = labelled
        // a link inside a labelled area (e.g. an icon) gets the plain hover ring
        const useLabel = labelled && (!interactive || interactive.contains(labelled))
        setCursorState((prev) => ({
          ...prev,
          hover: Boolean(interactive || labelled),
          label: useLabel ? labelled.getAttribute('data-cursor-label') || '' : '',
          icon: labelled?.getAttribute('data-cursor-icon') || '↗',
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

  const { hover, down, label, icon } = cursorState

  let modeClass = styles.defaultMode
  if (label) modeClass = styles.labelMode
  else if (down) modeClass = styles.downMode
  else if (hover) modeClass = styles.hoverMode

  return (
    <div ref={layerRef} className={styles.layer} aria-hidden="true">
      {/* A thin ring that trails the dot */}
      <div ref={reticleRef} className={styles.anchor}>
        <div className={`${styles.ring} ${modeClass}`}>
          {/* turns into a small label over project covers */}
          {label && (
            <span className={styles.labelText}>
              {label} {icon}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
