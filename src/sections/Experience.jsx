import { useRef } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'
import { useLanguage } from '../context/contexts'
import { experience } from '../data/experience'
import SectionHeading from '../components/SectionHeading'
import styles from './Experience.module.css'

/**
 * Timeline styled like a BPMN process: start event → tasks → end event.
 * The connector fills with an orange "data flow" as you scroll.
 */
export default function Experience() {
  const { t, pick, lang } = useLanguage()
  const listRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: listRef, offset: ['start 75%', 'end 55%'] })
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })

  return (
    <section id="experience" className="section">
      <div className="container">
        <SectionHeading
          index={2}
          eyebrow={t('experience.eyebrow')}
          title={t('experience.title')}
          accent={t('experience.titleAccent')}
          key={lang}
        />

        <div className={styles.timeline} ref={listRef}>
          <div className={styles.track} aria-hidden="true">
            <motion.div className={styles.trackFill} style={{ scaleY: fill }} />
          </div>

          <div className={`${styles.event} ${styles.startEvent}`} aria-hidden="true">
            <span className={styles.eventCircle} />
            <span className={styles.eventLabel}>{t('experience.start')}</span>
          </div>

          <ol className={styles.list}>
            {experience.map((item, i) => (
              <motion.li
                key={item.id}
                className={styles.item}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '0px 0px -20% 0px' }}
              >
                <motion.span
                  className={styles.node}
                  variants={{
                    hidden: { scale: 0.4, opacity: 0.3 },
                    show: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 18 } },
                  }}
                  aria-hidden="true"
                >
                  <span className={styles.nodeCore} />
                </motion.span>

                <motion.div
                  className={styles.meta}
                  variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0, transition: { duration: 0.7 } } }}
                >
                  <span className={styles.date}>
                    {pick(item.start)} — {pick(item.end)}
                  </span>
                  <span className={styles.step}>task_{String(i + 1).padStart(2, '0')}</span>
                </motion.div>

                <motion.article
                  className={styles.card}
                  variants={{
                    hidden: { opacity: 0, y: 40 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
                  }}
                >
                  <div className={styles.cardHead}>
                    <div className={styles.roleBlock}>
                      {item.logo && (
                        <div className={styles.orgLogoBox}>
                          <img
                            src={item.logo}
                            alt={item.org}
                            className={styles.orgLogoImg}
                            width="36"
                            height="36"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div>
                        <h3 className={styles.role}>{pick(item.role)}</h3>
                        <p className={styles.org}>{item.org}</p>
                      </div>
                    </div>
                    {item.current && (
                      <span className={styles.current}>
                        <span className={styles.currentDot} />
                        {t('experience.current')}
                      </span>
                    )}
                  </div>
                  <p className={styles.desc}>{pick(item.description)}</p>
                  <ul className={styles.tags}>
                    {item.tags.map((tag) => (
                      <li key={tag}>{tag}</li>
                    ))}
                  </ul>
                </motion.article>
              </motion.li>
            ))}
          </ol>

          <div className={`${styles.event} ${styles.endEvent}`} aria-hidden="true">
            <span className={styles.eventCircle} />
            <span className={styles.eventLabel}>{t('experience.next')}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
