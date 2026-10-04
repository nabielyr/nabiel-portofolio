import { motion, useScroll, useSpring, useTransform, useVelocity } from 'framer-motion'
import styles from './Marquee.module.css'

/** Infinite tech-stack ticker that skews with scroll velocity. */
export default function Marquee({ items, reverse = false }) {
  const { scrollY } = useScroll()
  const velocity = useVelocity(scrollY)
  const smooth = useSpring(velocity, { damping: 50, stiffness: 300 })
  const skew = useTransform(smooth, [-2000, 0, 2000], [8, 0, -8], { clamp: true })

  const row = items.map((item, i) => (
    <span key={`${item}-${i}`} className={styles.item}>
      <span className={i % 2 ? styles.outline : styles.solid}>{item}</span>
      <span className={styles.star} aria-hidden="true">
        ✦
      </span>
    </span>
  ))

  return (
    <div className={styles.marquee} aria-hidden="true">
      <motion.div className={`${styles.track} ${reverse ? styles.reverse : ''}`} style={{ skewX: skew }}>
        <div className={styles.group}>{row}</div>
        <div className={styles.group}>{row}</div>
      </motion.div>
    </div>
  )
}
