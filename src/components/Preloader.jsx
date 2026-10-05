import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../context/contexts'
import { sceneReady } from '../lib/sceneReady'
import styles from './Preloader.module.css'

const DURATION = 2000
const HOLD = 380 // pause on 100% before the curtain lifts
const CURTAIN = 850 // keep in sync with .preloader transition in the CSS
const MAX_WAIT = 1500 // never sit on 000% longer than this (slow network / no WebGL)

/**
 * "Training a model" intro: counter 0→100 with a log, then a curtain reveal.
 *
 * - The count only starts once the hero scene and fonts are ready, so heavy
 *   one-off work (Three.js parse, GL context, shader compile, font swap)
 *   happens while the screen is still, not mid-count.
 * - The number and bar are written straight to the DOM; React only re-renders
 *   when the active log line changes.
 * - The curtain is a CSS transform transition, which runs on the compositor and
 *   stays smooth even while the hero mounts its animations underneath.
 */
export default function Preloader({ onReveal, onDone }) {
  const { t } = useLanguage()
  const steps = t('preloader.steps')
  const stepCount = steps.length
  const [stage, setStage] = useState(0) // index of the active step; stepCount = finished
  const [exiting, setExiting] = useState(false)
  const numberRef = useRef(null)
  const fillRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    let raf = 0
    let timer = 0
    let gateTimer = 0
    let lastValue = 0
    let lastStage = 0

    const render = (value) => {
      if (value === lastValue) return
      lastValue = value
      numberRef.current.textContent = String(value).padStart(3, '0')
      fillRef.current.style.transform = `scaleX(${value / 100})`
      const next = value === 100 ? stepCount : Math.min(stepCount - 1, Math.floor(value / (100 / stepCount)))
      if (next !== lastStage) {
        lastStage = next
        setStage(next)
      }
    }

    const exit = () => {
      setExiting(true)
      onReveal?.()
      timer = setTimeout(() => onDone?.(), CURTAIN + 50)
    }

    const count = (start) => {
      const tick = (now) => {
        const p = Math.min(1, (now - start) / DURATION)
        // Uneven, "computational" pacing
        const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2.4) / 2
        render(Math.round(eased * 100))
        if (p < 1) raf = requestAnimationFrame(tick)
        else timer = setTimeout(exit, HOLD)
      }
      tick(start)
    }

    const timeout = new Promise((resolve) => {
      gateTimer = setTimeout(resolve, MAX_WAIT)
    })
    const fonts = document.fonts?.ready ?? Promise.resolve()

    Promise.race([Promise.all([sceneReady, fonts]), timeout]).then(() => {
      if (cancelled) return
      raf = requestAnimationFrame(count)
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      clearTimeout(timer)
      clearTimeout(gateTimer)
    }
  }, [onReveal, onDone, stepCount])

  const finished = stage === stepCount

  return (
    <div className={`${styles.preloader} ${exiting ? styles.exit : ''}`} role="status" aria-live="polite">
      <div className={styles.content}>
        <div className={styles.top}>
          <span>Nabiel Yandra</span>
          <span>Portfolio ©{new Date().getFullYear()}</span>
        </div>

        <div className={styles.center}>
          <div className={styles.counter}>
            <span ref={numberRef} className={styles.number}>
              000
            </span>
            <span className={styles.percent}>%</span>
          </div>
        </div>

        <div className={styles.bottom}>
          <ul className={styles.log}>
            {steps.map((step, i) => (
              <li
                key={step}
                className={`${styles.logLine} ${i < stage ? styles.done : ''} ${i === stage ? styles.active : ''} ${
                  i > stage ? styles.pending : ''
                }`}
              >
                <span className={styles.prompt}>{i < stage ? '✓' : '>'}</span>
                {step}
                {i === stage && <span className={styles.caret} />}
              </li>
            ))}
            {finished && (
              <li className={`${styles.logLine} ${styles.ready}`}>
                <span className={styles.prompt}>●</span>
                {t('preloader.ready')}
              </li>
            )}
          </ul>
          <div className={styles.bar}>
            <div ref={fillRef} className={styles.fill} />
          </div>
        </div>
      </div>
    </div>
  )
}
