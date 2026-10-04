import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '../context/contexts'
import styles from './Preloader.module.css'

const DURATION = 2000

/** "Training a model" intro: counter 0→100 with a log, then a curtain reveal. */
export default function Preloader({ onDone }) {
  const { t } = useLanguage()
  const [progress, setProgress] = useState(0)
  const steps = t('preloader.steps')

  useEffect(() => {
    let raf
    let timeout
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min(1, (now - start) / DURATION)
      // Uneven, "computational" pacing
      const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2.4) / 2
      setProgress(Math.round(eased * 100))
      if (p < 1) raf = requestAnimationFrame(tick)
      else timeout = setTimeout(onDone, 380)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timeout)
    }
  }, [onDone])

  const activeStep = Math.min(steps.length - 1, Math.floor(progress / (100 / steps.length)))

  return (
    <motion.div
      className={styles.preloader}
      initial={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      exit={{ clipPath: 'inset(0% 0% 100% 0%)' }}
      transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
      role="status"
      aria-live="polite"
    >
      <motion.div
        className={styles.content}
        exit={{ opacity: 0, y: -40 }}
        transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
      >
        <div className={styles.top}>
          <span>Nabiel Yandra</span>
          <span>Portfolio ©{new Date().getFullYear()}</span>
        </div>

        <div className={styles.center}>
          <div className={styles.counter}>
            <span className={styles.number}>{String(progress).padStart(3, '0')}</span>
            <span className={styles.percent}>%</span>
          </div>
        </div>

        <div className={styles.bottom}>
          <ul className={styles.log}>
            {steps.map((step, i) => (
              <li
                key={step}
                className={`${styles.logLine} ${i < activeStep || progress === 100 ? styles.done : ''} ${
                  i === activeStep && progress < 100 ? styles.active : ''
                } ${i > activeStep ? styles.pending : ''}`}
              >
                <span className={styles.prompt}>{i < activeStep || progress === 100 ? '✓' : '>'}</span>
                {step}
                {i === activeStep && progress < 100 && <span className={styles.caret} />}
              </li>
            ))}
            {progress === 100 && (
              <li className={`${styles.logLine} ${styles.ready}`}>
                <span className={styles.prompt}>●</span>
                {t('preloader.ready')}
              </li>
            )}
          </ul>
          <div className={styles.bar}>
            <div className={styles.fill} style={{ transform: `scaleX(${progress / 100})` }} />
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
