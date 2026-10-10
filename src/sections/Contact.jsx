import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { useLanguage } from '../context/contexts'
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

/** Becomes true (once) when `el` comes within `margin` of the viewport */
function useSeen(el, margin, threshold = 0) {
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    if (!el || seen) return undefined
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && setSeen(true), { rootMargin: margin, threshold })
    io.observe(el)
    return () => io.disconnect()
  }, [el, seen, margin, threshold])
  return seen
}

// Big Shoulders Display: the cap line sits this far (in em) below the top of
// an inline span's box (ascent 0.984 - cap height 0.8125)
const CAP_GAP = 0.1715
// the owl's toes rest this many world units above the bottom of its canvas
const FEET_UNITS = 0.06
// owl size: pixels per world unit, per pixel of title font size
const OWL_SCALE = 0.33

/**
 * Where the contact owl's canvas goes: from just left of the letter it
 * perches on to the right edge of the page, and from the top of the section
 * down to that letter's cap line. Measured, so it follows the font size and
 * wherever the title wraps.
 */
function useStage(sectionEl, letterEl) {
  const [stage, setStage] = useState(null)
  useLayoutEffect(() => {
    if (!sectionEl || !letterEl) return undefined
    const measure = () => {
      const s = sectionEl.getBoundingClientRect()
      const l = letterEl.getBoundingClientRect()
      const fs = parseFloat(getComputedStyle(letterEl).fontSize)
      const unitPx = Math.max(36, fs * OWL_SCALE)
      const left = Math.max(0, l.left - s.left + l.width / 2 - unitPx * 1.9)
      const capLine = l.top - s.top + fs * CAP_GAP
      setStage({ left, width: s.width - left, height: capLine + FEET_UNITS * unitPx, unitPx })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(sectionEl)
    document.fonts?.ready.then(measure)
    return () => ro.disconnect()
  }, [sectionEl, letterEl])
  return stage
}

const links = profile.socials.filter((s) => s.id !== 'email')

export default function Contact() {
  const { t } = useLanguage()
  const reduceMotion = useReducedMotion()
  const time = useMalangTime()
  const [sectionEl, setSectionEl] = useState(null)
  const [letterEl, setLetterEl] = useState(null)
  // build the scene well before it's needed; start the flight once the title is in view
  const near = useSeen(sectionEl, '1200px')
  const titleInView = useSeen(letterEl, '0px 0px -25% 0px')
  const stage = useStage(sectionEl, letterEl)

  // Hoo lands on one letter with a flat top (set per language)
  const title = t('contact.title')
  const at = t('contact.perchAt')
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
          <h2 className={styles.title}>
            {title.slice(0, at)}
            <span ref={setLetterEl}>{title[at]}</span>
            {title.slice(at + 1)}
            <span className={styles.dot} aria-hidden="true" />
          </h2>
        </div>

        {/* Hoo flies in from the right and lands on that letter; the section feeds it pointer events */}
        {near && stage && (
          <div className={styles.stage} style={{ left: stage.left, width: stage.width, height: stage.height }}>
            <Suspense fallback={null}>
              <OwlCanvas
                pose="perch"
                reduceMotion={reduceMotion}
                eventSource={sectionEl}
                anchor={letterEl}
                ready={titleInView}
                framing="stage"
                unitPx={stage.unitPx}
              />
            </Suspense>
          </div>
        )}

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
