import { motion } from 'framer-motion'
import styles from './SectionHeading.module.css'

const ease = [0.22, 1, 0.36, 1]

/**
 *  (01) WORK ─────────────────────────────
 *  SELECTED WORK▪
 *
 * The title rises once when it scrolls in; `transform` strings keep the motion
 * on the compositor. The trigger sits on the <h2>, not the moving span - the
 * span starts clipped by its mask, and a fully clipped element never counts
 * as "in view".
 */
const rise = {
  hidden: { transform: 'translateY(105%)' },
  show: { transform: 'translateY(0%)', transition: { duration: 0.9, ease } },
}
export default function SectionHeading({ index, kicker, title, children, className = '' }) {
  return (
    <header className={`${styles.heading} ${className}`}>
      <p className={styles.kicker}>
        <span className={styles.index}>({String(index).padStart(2, '0')})</span>
        <span>{kicker}</span>
        <span className={styles.rule} aria-hidden="true" />
      </p>
      <motion.h2
        className={styles.title}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      >
        <span className={styles.mask}>
          <motion.span className={styles.inner} variants={rise}>
            {title}
            <span className={styles.dot} aria-hidden="true" />
          </motion.span>
        </span>
      </motion.h2>
      {children && <div className={styles.sub}>{children}</div>}
    </header>
  )
}
