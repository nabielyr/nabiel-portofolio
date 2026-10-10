import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { useLanguage } from '../context/contexts'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { profile } from '../data/profile'
import styles from './Contact.module.css'

const OwlCanvas = lazy(() => import('../components/owl/OwlCanvas'))

const timeInMalang = () =>
  new Date().toLocaleTimeString('en-GB', { timeZone: profile.timezone, hour: '2-digit', minute: '2-digit', hour12: false })

function useMalangTime() {
  const [time, setTime] = useState(timeInMalang)
  useEffect(() => {
    const id = setInterval(() => setTime(timeInMalang()), 10000)
    return () => clearInterval(id)
  }, [])
  return time
}

/** Only create the second WebGL scene once the section is about to be seen */
function useNearView(el) {
  const [near, setNear] = useState(false)
  useEffect(() => {
    if (!el || near) return undefined
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && setNear(true), { rootMargin: '400px' })
    io.observe(el)
    return () => io.disconnect()
  }, [el, near])
  return near
}

const links = profile.socials.filter((s) => s.id !== 'email')

export default function Contact() {
  const { t } = useLanguage()
  const reduceMotion = useReducedMotion()
  const narrow = useMediaQuery('(max-width: 760px)')
  const time = useMalangTime()
  const [sectionEl, setSectionEl] = useState(null)
  const near = useNearView(sectionEl)
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef(0)

  useEffect(() => () => clearTimeout(copyTimer.current), [])

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied(true)
      clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      window.location.href = `mailto:${profile.email}`
    }
  }

  return (
    <section id="contact" ref={setSectionEl} className={`section ${styles.contact}`}>
      <div className="container">
        <p className={styles.kicker}>
          <span className={styles.index}>(05)</span>
          <span>{t('contact.kicker')}</span>
          <span className={styles.rule} aria-hidden="true" />
        </p>

        <div className={styles.titleWrap}>
          {/* Hoo stands on the letters; the section feeds it pointer events */}
          <div className={styles.perch}>
            {near && sectionEl && (
              <Suspense fallback={null}>
                <OwlCanvas
                  pose="perch"
                  reduceMotion={reduceMotion}
                  eventSource={sectionEl}
                  framing="stage"
                  unitPx={narrow ? 46 : 84}
                />
              </Suspense>
            )}
          </div>
          <h2 className={styles.title}>
            {t('contact.title')}
            <span className={styles.dot} aria-hidden="true" />
          </h2>
        </div>

        <div className={styles.grid}>
          <div>
            <p className={styles.lead}>{t('contact.lead')}</p>
            <p className={styles.status}>
              <span className={styles.statusDot} aria-hidden="true" />
              {t('contact.status')}
            </p>

            <div className={styles.emailRow}>
              <a className={styles.email} href={`mailto:${profile.email}`}>
                {profile.email}
              </a>
              <button id="copy-email-btn" className={styles.copy} onClick={copyEmail} aria-live="polite">
                {copied ? t('contact.copied') : t('contact.copy')}
              </button>
            </div>

            {profile.cv && (
              <a className={styles.cv} href={profile.cv} download>
                {t('contact.cv')} ↓
              </a>
            )}
          </div>

          <div>
            <p className={styles.sideLabel}>{t('contact.elsewhere')}</p>
            <ul className={styles.links}>
              {links.map((s) => (
                <li key={s.id}>
                  <a id={`social-${s.id}`} href={s.url} target="_blank" rel="noopener noreferrer">
                    <span className={styles.linkName}>{s.label}</span>
                    <span className={styles.linkHandle}>{s.handle}</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className={styles.clock}>
              {t('contact.localTime')} <strong>{time} WIB</strong>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
