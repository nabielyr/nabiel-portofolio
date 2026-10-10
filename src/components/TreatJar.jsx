import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './TreatJar.module.css'

const NEAR_PX = 170 // the owl opens its beak when a treat comes this close
const FEED_PX = 90 // ...and takes it if it's let go this close to the beak
const HALF = 18 // half the size of the held cookie

function Cookie({ className }) {
  return (
    <svg className={className} width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
      <circle cx="18" cy="18" r="15" fill="#d99a52" stroke="#b5773a" strokeWidth="1.5" />
      <path d="M8 13a11 11 0 0 1 8-6" fill="none" stroke="#f0c58c" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="13" cy="16" rx="2.4" ry="2" fill="#4a2a1a" />
      <ellipse cx="22" cy="12" rx="2" ry="1.7" fill="#4a2a1a" />
      <ellipse cx="23" cy="22" rx="2.5" ry="2.1" fill="#4a2a1a" />
      <ellipse cx="15" cy="25" rx="1.8" ry="1.5" fill="#4a2a1a" />
    </svg>
  )
}

/**
 * A jar of cookies for Hoo. Drag one out and bring it to his beak: he opens
 * up as it gets close and eats it if you let go there; anywhere else and it
 * goes back in the jar. Keyboard: Enter/Space hands him one directly.
 *
 * The held cookie is moved by writing its transform straight to the DOM,
 * so dragging never re-renders React.
 */
export default function TreatJar({ owlApi, onFed, label, hint, className = '' }) {
  const jarRef = useRef(null)
  const heldRef = useRef(null)
  const drag = useRef(null)
  const [held, setHeld] = useState(null) // { x, y } where the drag started
  const [fed, setFed] = useState(false)

  const mouth = () => owlApi.current?.mouthOnPage() ?? null
  const place = (x, y) => {
    if (heldRef.current) heldRef.current.style.transform = `translate3d(${x - HALF}px, ${y - HALF}px, 0)`
  }

  const feed = () => {
    owlApi.current?.eat()
    onFed?.()
    setFed(true)
  }

  useEffect(() => {
    if (!held) return undefined
    const d = drag.current
    place(d.x, d.y)

    const onMove = (e) => {
      if (e.pointerId !== d.id) return
      d.x = e.clientX
      d.y = e.clientY
      place(d.x, d.y)
      const m = mouth()
      const near = !!m && Math.hypot(m.x - d.x, m.y - d.y) < NEAR_PX
      if (near !== d.near) {
        d.near = near
        owlApi.current?.anticipate(near)
      }
    }

    const finish = (to, eaten) => {
      const el = heldRef.current
      const from = el?.style.transform
      const done = () => {
        setHeld(null)
        if (eaten) feed()
      }
      if (!el?.animate) return done()
      const a = el.animate(
        [
          { transform: from, opacity: 1 },
          { transform: `translate3d(${to.x - HALF}px, ${to.y - HALF}px, 0) scale(${eaten ? 0.25 : 0.6})`, opacity: eaten ? 0.2 : 0 },
        ],
        { duration: eaten ? 170 : 260, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' },
      )
      a.onfinish = done
      return undefined
    }

    const onUp = (e) => {
      if (e.pointerId !== d.id) return
      cleanup()
      owlApi.current?.anticipate(false)
      const m = mouth()
      if (m && Math.hypot(m.x - d.x, m.y - d.y) < FEED_PX) {
        finish(m, true)
      } else {
        const r = jarRef.current.getBoundingClientRect()
        finish({ x: r.left + r.width / 2, y: r.top + r.height * 0.55 }, false)
      }
    }

    const cleanup = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return cleanup
    // owlApi is a ref; the drag lives in drag.current
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [held])

  const onPointerDown = (e) => {
    if (held || (e.pointerType === 'mouse' && e.button !== 0)) return
    e.preventDefault()
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, near: false }
    setHeld({ x: e.clientX, y: e.clientY })
  }

  // keyboard: hand one over straight away
  const onClick = (e) => {
    if (e.detail === 0) feed()
  }

  return (
    <div className={`${styles.wrap} ${className}`}>
      <button
        ref={jarRef}
        type="button"
        className={styles.jar}
        onPointerDown={onPointerDown}
        onClick={onClick}
        aria-label={label}
        data-cursor-label={label}
        data-cursor-icon="🍪"
      >
        <svg viewBox="0 0 64 80" aria-hidden="true">
          <defs>
            <clipPath id="jar-inside">
              <path d="M10 22h44v44a10 10 0 0 1-10 10H20a10 10 0 0 1-10-10z" />
            </clipPath>
          </defs>
          <path className={styles.glass} d="M10 22h44v44a10 10 0 0 1-10 10H20a10 10 0 0 1-10-10z" />
          <g clipPath="url(#jar-inside)">
            <g transform="translate(12 50) rotate(-12 9 9) scale(0.55)">
              <Cookie />
            </g>
            <g transform="translate(31 52) rotate(18 9 9) scale(0.55)">
              <Cookie />
            </g>
            <g transform="translate(20 38) rotate(4 9 9) scale(0.55)">
              <Cookie />
            </g>
            <g transform="translate(34 33) rotate(-20 9 9) scale(0.5)">
              <Cookie />
            </g>
          </g>
          <path className={styles.outline} d="M10 22h44v44a10 10 0 0 1-10 10H20a10 10 0 0 1-10-10z" />
          <path className={styles.shine} d="M16 30v26" />
          <g className={styles.lid}>
            <rect x="6" y="9" width="52" height="13" rx="3" />
            <path d="M12 15.5h40" />
          </g>
        </svg>
      </button>
      {!fed && (
        <p className={styles.hint} aria-hidden="true">
          <span className={styles.arrow}>↖</span> {hint}
        </p>
      )}

      {held &&
        createPortal(
          <div ref={heldRef} className={styles.held} aria-hidden="true">
            <Cookie />
          </div>,
          document.body,
        )}
    </div>
  )
}
