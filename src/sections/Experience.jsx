import { useState } from 'react'
import { useLanguage } from '../context/contexts'
import { experience } from '../data/experience'
import { education } from '../data/education'
import { profile } from '../data/profile'
import SectionHeading from '../components/SectionHeading'
import styles from './Experience.module.css'

// The data stays chronological (oldest first); the page shows the newest first
const newestFirst = [...experience].reverse()

/** Degree progress from the study start/end dates */
function useStudyProgress() {
  const [progress] = useState(() => {
    const year = 365.25 * 24 * 3600 * 1000
    const start = new Date(profile.studyStart).getTime()
    const end = new Date(profile.studyEnd).getTime()
    const now = Date.now()
    const ratio = Math.min(1, Math.max(0, (now - start) / (end - start)))
    const total = Math.round((end - start) / year)
    return { ratio, total, current: Math.min(total, Math.floor((now - start) / year) + 1) }
  })
  return progress
}

export default function Experience() {
  const { t, pick } = useLanguage()
  const progress = useStudyProgress()

  return (
    <section id="experience" className="section">
      <div className="container">
        <SectionHeading index={3} kicker={t('experience.kicker')} title={t('experience.title')} />

        <ol className={styles.list}>
          {newestFirst.map((item) => (
            <li key={item.id} className={styles.row}>
              <p className={styles.when}>
                <span>
                  {pick(item.start)} → {pick(item.end)}
                </span>
                {item.current && (
                  <span className={styles.now}>
                    <span className={styles.nowDot} aria-hidden="true" />
                    {t('experience.now')}
                  </span>
                )}
              </p>
              <div className={styles.what}>
                <h3 className={styles.role}>{pick(item.role)}</h3>
                <p className={styles.org}>
                  {item.logo && <img src={item.logo} alt="" width="22" height="22" loading="lazy" />}
                  {item.org}
                </p>
              </div>
              <p className={styles.desc}>{pick(item.description)}</p>
            </li>
          ))}
        </ol>

        <h3 className={styles.subTitle}>{t('experience.education')}</h3>
        {education.map((edu) => (
          <div key={edu.id} className={styles.edu}>
            <p className={styles.when}>{pick(edu.period)}</p>
            <div className={styles.what}>
              <h4 className={styles.role}>
                {edu.logo && <img className={styles.school} src={edu.logo} alt="" width="34" height="34" loading="lazy" />}
                {edu.school}
              </h4>
              <p className={styles.org}>
                {pick(edu.degree)} · {pick(edu.faculty)}
              </p>
              <div className={styles.progress} aria-label={`${t('experience.year')} ${progress.current} ${t('experience.of')} ${progress.total}`}>
                <span className={styles.bar}>
                  <span style={{ transform: `scaleX(${progress.ratio})` }} />
                </span>
                <span className={styles.progressText}>
                  {t('experience.year')} {progress.current} {t('experience.of')} {progress.total}
                </span>
              </div>
            </div>
            <ul className={styles.affiliations}>
              {edu.affiliations?.map((a) => (
                <li key={a.id}>
                  <img src={a.logo} alt="" width="26" height="26" loading="lazy" />
                  {a.name}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
