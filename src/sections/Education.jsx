import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiBookOpen, FiMapPin } from 'react-icons/fi'
import { useLanguage } from '../context/contexts'
import { education } from '../data/education'
import { profile } from '../data/profile'
import SectionHeading from '../components/SectionHeading'
import Reveal from '../components/Reveal'
import styles from './Education.module.css'

/** Degree progress computed from study start/end dates. */
function useStudyProgress() {
  const [progress] = useState(() => {
    const start = new Date(profile.studyStart).getTime()
    const end = new Date(profile.studyEnd).getTime()
    const now = Date.now()
    const ratio = Math.min(1, Math.max(0, (now - start) / (end - start)))
    const totalYears = Math.round((end - start) / (365.25 * 24 * 3600 * 1000))
    const year = Math.min(totalYears, Math.floor((now - start) / (365.25 * 24 * 3600 * 1000)) + 1)
    return { percent: Math.round(ratio * 100), year, totalYears }
  })

  return progress
}

export default function Education() {
  const { t, pick, lang } = useLanguage()
  const progress = useStudyProgress()

  return (
    <section id="education" className="section">
      <div className="container">
        <SectionHeading
          index={3}
          eyebrow={t('education.eyebrow')}
          title={t('education.title')}
          accent={t('education.titleAccent')}
          key={lang}
        />

        {education.map((edu) => (
          <Reveal key={edu.id} className={styles.card}>
            <div className={styles.glow} aria-hidden="true" />
            <div className={styles.head}>
              <div className={styles.emblem}>
                <FiBookOpen />
              </div>
              <div className={styles.titles}>
                <h3 className={styles.school}>{edu.school}</h3>
                <p className={styles.degree}>{pick(edu.degree)}</p>
                <p className={styles.faculty}>
                  <FiMapPin /> {pick(edu.faculty)} · Malang
                </p>
              </div>
              <span className={styles.period}>{pick(edu.period)}</span>
            </div>

            <p className={styles.desc}>{pick(edu.description)}</p>

            <ul className={styles.highlights}>
              {pick(edu.highlights).map((h, i) => (
                <motion.li
                  key={h}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.07, type: 'spring', stiffness: 260, damping: 20 }}
                >
                  {h}
                </motion.li>
              ))}
            </ul>

            <div className={styles.progress}>
              <div className={styles.progressHead}>
                <span className={styles.progressLabel}>
                  <span className={styles.prompt}>$</span> {t('education.progress')}
                </span>
                <span className={styles.progressValue}>
                  {t('education.year')} {progress.year} {t('education.of')} {progress.totalYears} · {progress.percent}%
                </span>
              </div>
              <div className={styles.bar}>
                <motion.div
                  className={styles.barFill}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: progress.percent / 100 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                />
                {Array.from({ length: progress.totalYears - 1 }, (_, i) => (
                  <span
                    key={i}
                    className={styles.tick}
                    style={{ left: `${((i + 1) / progress.totalYears) * 100}%` }}
                  />
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
