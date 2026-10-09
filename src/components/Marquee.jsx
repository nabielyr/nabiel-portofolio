import { motion, useScroll, useSpring, useTransform, useVelocity } from 'framer-motion'
import styles from './Marquee.module.css'

/**
 * A slow ticker between two hairlines, like a printed banner.
 * It leans a few degrees with scroll speed - enough to feel physical,
 * not enough to be a show.
 */
export default function Marquee({ items, separator = '✦', reverse = false, size = 'md' }) {
  const { scrollY } = useScroll()
  const velocity = useVelocity(scrollY)
  const smooth = useSpring(velocity, { damping: 50, stiffness: 300 })
  const skew = useTransform(smooth, [-2500, 0, 2500], [3, 0, -3], { clamp: true })

  const row = items.map((item, i) => (
    <span key={`${item}-${i}`} className={styles.item}>
      <span>{item}</span>
      <span className={styles.sep} aria-hidden="true">
        {separator}
      </span>
    </span>
  ))

  return (
    <div className={`${styles.marquee} ${styles[size]}`} aria-hidden="true">
      <motion.div className={`${styles.track} ${reverse ? styles.reverse : ''}`} style={{ skewX: skew }}>
        <div className={styles.group}>{row}</div>
        <div className={styles.group}>{row}</div>
      </motion.div>
    </div>
  )
}
