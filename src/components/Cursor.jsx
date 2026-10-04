import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useIsTouch } from '../hooks/useMediaQuery'
import styles from './Cursor.module.css'

const INTERACTIVE = 'a, button, [role="button"], input, textarea, select, label, [data-cursor]'

/**
 * Dot + trailing ring. The ring grows over interactive elements and can show
 * a label for elements with `data-cursor-label="View"`.
 */
export default function Cursor() {
  const isTouch = useIsTouch()
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const ringX = useSpring(x, { stiffness: 380, damping: 30, mass: 0.6 })
  const ringY = useSpring(y, { stiffness: 380, damping: 30, mass: 0.6 })
  const [hover, setHover] = useState(false)
  const [label, setLabel] = useState('')
  const [down, setDown] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isTouch) return undefined
    const root = document.documentElement
    root.classList.add('has-custom-cursor')

    const onMove = (e) => {
      x.set(e.clientX)
      y.set(e.clientY)
      setVisible(true)
    }
    const onOver = (e) => {
      const target = e.target instanceof Element ? e.target : null
      const interactive = target?.closest(INTERACTIVE)
      const labelled = target?.closest('[data-cursor-label]')
      setHover(Boolean(interactive || labelled))
      setLabel(labelled?.getAttribute('data-cursor-label') || '')
    }
    const onLeave = () => setVisible(false)
    const onDown = () => setDown(true)
    const onUp = () => setDown(false)

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerover', onOver, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    return () => {
      root.classList.remove('has-custom-cursor')
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerover', onOver)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
    }
  }, [isTouch, x, y])

  if (isTouch) return null

  const size = label ? 84 : hover ? 56 : 34

  return (
    <div className={styles.layer} aria-hidden="true" style={{ opacity: visible ? 1 : 0 }}>
      <motion.div className={styles.anchor} style={{ x: ringX, y: ringY }}>
        <motion.div
          className={`${styles.ring} ${hover ? styles.ringHover : ''} ${label ? styles.ringLabel : ''}`}
          animate={{ width: size, height: size, scale: down ? 0.85 : 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        >
          {label && (
            <motion.span
              className={styles.label}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              key={label}
            >
              {label}
            </motion.span>
          )}
        </motion.div>
      </motion.div>
      <motion.div className={styles.anchor} style={{ x, y }}>
        <div className={`${styles.dot} ${hover ? styles.dotHidden : ''}`} />
      </motion.div>
    </div>
  )
}
