import { motion } from 'framer-motion'
import styles from './SectionHeading.module.css'

const word = {
  hidden: { y: '110%' },
  show: (i) => ({ y: '0%', transition: { duration: 0.9, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] } }),
}

/**
 *  01 ── about.py
 *  Curious by nature, builder by habit.
 */
export default function SectionHeading({ index, eyebrow, title, accent, align = 'left', children }) {
  const titleWords = title.split(' ')
  const accentWords = accent ? accent.split(' ') : []

  return (
    <header className={`${styles.heading} ${align === 'center' ? styles.center : ''}`}>
      <motion.div
        className={styles.eyebrow}
        initial={{ opacity: 0, x: -16 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-10% 0px' }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className={styles.index}>{String(index).padStart(2, '0')}</span>
        <span className={styles.rule} />
        <span>{eyebrow}</span>
      </motion.div>

      <motion.h2
        className={styles.title}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-10% 0px' }}
        aria-label={`${title} ${accent ?? ''}`.trim()}
      >
        {titleWords.map((w, i) => (
          <span className={styles.mask} key={`t-${i}`} aria-hidden="true">
            <motion.span className={styles.word} variants={word} custom={i}>
              {w}
            </motion.span>
          </span>
        ))}
        {accentWords.map((w, i) => (
          <span className={styles.mask} key={`a-${i}`} aria-hidden="true">
            <motion.span
              className={`${styles.word} ${styles.accent}`}
              variants={word}
              custom={titleWords.length + i}
            >
              {w}
            </motion.span>
          </span>
        ))}
      </motion.h2>

      {children && <div className={styles.sub}>{children}</div>}
    </header>
  )
}
