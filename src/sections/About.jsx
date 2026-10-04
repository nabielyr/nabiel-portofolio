import { useEffect, useRef, useState } from 'react'
import { animate, motion, useInView, useScroll, useTransform } from 'framer-motion'
import { useLanguage } from '../context/contexts'
import SectionHeading from '../components/SectionHeading'
import Reveal from '../components/Reveal'
import styles from './About.module.css'

/** Each word lights up as the paragraph scrolls through the viewport. */
function ScrollText({ text }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 45%'] })
  const words = text.split(' ')
  return (
    <p ref={ref} className={styles.lead}>
      {words.map((w, i) => (
        <Word key={`${w}-${i}`} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
          {w}
        </Word>
      ))}
    </p>
  )
}

function Word({ children, progress, range }) {
  const opacity = useTransform(progress, range, [0.18, 1])
  return (
    <motion.span className={styles.leadWord} style={{ opacity }}>
      {children}{' '}
    </motion.span>
  )
}

function Counter({ value, suffix }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-15% 0px' })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return undefined
    const controls = animate(0, value, {
      duration: 1.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [inView, value])

  return (
    <span ref={ref} className={styles.statValue}>
      {display}
      <span className={styles.statSuffix}>{suffix}</span>
    </span>
  )
}

/** Tiny syntax-highlighted "class Nabiel" snippet. */
function CodeCard() {
  const lines = [
    [['kw', 'class '], ['cls', 'Nabiel'], ['p', '('], ['cls', 'Student'], ['p', '):']],
    [['p', '    '], ['var', 'university'], ['p', ' = '], ['str', '"Universitas Brawijaya"']],
    [['p', '    '], ['var', 'major'], ['p', '      = '], ['str', '"Information Systems"']],
    [['p', '    '], ['var', 'focus'], ['p', '      = ['], ['str', '"AI/ML"'], ['p', ', '], ['str', '"Data Science"'], ['p', ']']],
    [],
    [['p', '    '], ['kw', 'def '], ['fn', 'build'], ['p', '('], ['var', 'self'], ['p', ', '], ['var', 'idea'], ['p', '):']],
    [['p', '        '], ['kw', 'return '], ['var', 'idea'], ['p', '.'], ['fn', 'into_reality'], ['p', '()  '], ['cm', '# always']],
  ]
  return (
    <div className={styles.code}>
      <div className={styles.codeBar}>
        <span className={styles.dots}>
          <i />
          <i />
          <i />
        </span>
        <span className={styles.codeFile}>about.py</span>
      </div>
      <pre className={styles.pre}>
        {lines.map((tokens, i) => (
          <motion.code
            key={i}
            className={styles.codeLine}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 + i * 0.08, duration: 0.5 }}
          >
            <span className={styles.ln}>{i + 1}</span>
            {tokens.map(([type, value], j) => (
              <span key={j} className={styles[type]}>
                {value}
              </span>
            ))}
          </motion.code>
        ))}
      </pre>
    </div>
  )
}

export default function About() {
  const { t, lang } = useLanguage()
  const stats = t('about.stats')

  return (
    <section id="about" className="section">
      <div className="container">
        <SectionHeading index={1} eyebrow={t('about.eyebrow')} title={t('about.title')} accent={t('about.titleAccent')} key={lang} />

        <div className={styles.grid}>
          <div className={styles.text}>
            <ScrollText key={lang} text={t('about.lead')} />
            <Reveal as="p" className={styles.body}>
              {t('about.body')}
            </Reveal>

            <div className={styles.stats}>
              {stats.map((s, i) => (
                <Reveal key={s.label} delay={i * 0.1} className={styles.stat}>
                  <Counter value={s.value} suffix={s.suffix} />
                  <span className={styles.statLabel}>{s.label}</span>
                </Reveal>
              ))}
            </div>
          </div>

          <div className={styles.side}>
            <Reveal>
              <CodeCard />
            </Reveal>
            <Reveal delay={0.15} className={styles.current}>
              <span className={styles.currentDot} />
              <div>
                <span className={styles.currentLabel}>{t('about.currently')}</span>
                <p className={styles.currentRole}>{t('about.currentRole')}</p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
