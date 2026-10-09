import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { useLanguage } from '../context/contexts'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { profile } from '../data/profile'
import { projects } from '../data/projects'
import { scrollToTarget } from '../lib/smoothScroll'
import SplitFlap from '../components/SplitFlap'
import styles from './Hero.module.css'

const OwlCanvas = lazy(() => import('../components/owl/OwlCanvas'))

/** Mount the 3D owl once the browser is idle, so the name paints first. */
function useIdleMount() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const go = () => setReady(true)
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(go, { timeout: 1200 })
      return () => window.cancelIdleCallback(id)
    }
    const id = setTimeout(go, 300)
    return () => clearTimeout(id)
  }, [])
  return ready
}

const timeInMalang = () =>
  new Date().toLocaleTimeString('en-GB', { timeZone: profile.timezone, hour: '2-digit', minute: '2-digit', hour12: false })

/** Local time in Malang, refreshed often enough to flip on the minute */
function useMalangTime() {
  const [time, setTime] = useState(timeInMalang)
  useEffect(() => {
    const id = setInterval(() => setTime(timeInMalang()), 10000)
    return () => clearInterval(id)
  }, [])
  return time
}

const github = profile.socials.find((s) => s.id === 'github')
const linkedin = profile.socials.find((s) => s.id === 'linkedin')
// "Last build" is the newest finished project; "Building" only shows while something is in progress
const lastBuild = projects.find((p) => p.status !== 'in-progress')
const building = projects.find((p) => p.status === 'in-progress')

export default function Hero() {
  const { t } = useLanguage()
  const reduceMotion = useReducedMotion()
  const narrow = useMediaQuery('(max-width: 860px)')
  const mountOwl = useIdleMount()
  const time = useMalangTime()
  const [hoot, setHoot] = useState(null)
  const hootTimer = useRef(0)
  const hootIndex = useRef(0)

  useEffect(() => () => clearTimeout(hootTimer.current), [])

  const onHoot = () => {
    const lines = t('hero.hoots')
    const line = lines[hootIndex.current % lines.length]
    hootIndex.current += 1
    setHoot({ line, key: hootIndex.current })
    clearTimeout(hootTimer.current)
    hootTimer.current = setTimeout(() => setHoot(null), 1800)
  }

  const board = [
    { id: 'now', label: t('board.now'), text: narrow ? t('board.nowShort') : t('board.nowText') },
    lastBuild && { id: 'last', label: t('board.last'), text: lastBuild.title },
    building && { id: 'building', label: t('board.building'), text: building.title },
    { id: 'time', label: t('board.time'), text: `${time} WIB` },
    { id: 'open', label: t('board.open'), text: t('board.openText') },
  ].filter(Boolean)

  return (
    <section id="home" className={styles.hero}>
      <div className={styles.top}>
        <div className={styles.text}>
          <h1 className={styles.name} aria-label={profile.name}>
            <span className={styles.line} aria-hidden="true">
              <span className={`${styles.word} ${styles.accent}`}>Nabiel</span>
            </span>
            <span className={styles.line} aria-hidden="true">
              <span className={styles.word} style={{ animationDelay: '0.08s' }}>
                Yandra<span className={styles.dot}>.</span>
              </span>
            </span>
          </h1>

          <div className={styles.intro}>
            <p className={styles.lead}>
              <span className={styles.hello}>{t('hero.hello')} 👋</span> {t('hero.intro')}
            </p>
            <p className={styles.meta}>
              <span>{t('hero.location')}</span>
              <span className={styles.status}>
                <span className={styles.statusDot} aria-hidden="true" />
                {t('hero.status')}
              </span>
            </p>
            <div className={styles.ctas}>
              <a
                href="#projects"
                className={`${styles.btn} ${styles.btnSolid}`}
                onClick={(e) => {
                  e.preventDefault()
                  scrollToTarget('#projects')
                }}
              >
                {t('hero.ctaWork')} <span aria-hidden="true">↓</span>
              </a>
              {profile.cv && (
                <a href={profile.cv} download className={styles.btn}>
                  {t('hero.ctaCv')} <span aria-hidden="true">↓</span>
                </a>
              )}
              <a href={github.url} target="_blank" rel="noopener noreferrer" className={styles.textLink}>
                GitHub ↗
              </a>
              <a href={linkedin.url} target="_blank" rel="noopener noreferrer" className={styles.textLink}>
                LinkedIn ↗
              </a>
            </div>
          </div>
        </div>

        <div className={styles.owl} title={t('hero.owlLabel')}>
          {mountOwl && (
            <Suspense fallback={null}>
              <OwlCanvas pose="hero" onHoot={onHoot} reduceMotion={reduceMotion} />
            </Suspense>
          )}
          {hoot && (
            <span key={hoot.key} className={styles.bubble} role="status">
              {hoot.line}
            </span>
          )}
        </div>
      </div>

      <div className={styles.boardWrap}>
        <SplitFlap rows={board} length={narrow ? 18 : 28} instant={reduceMotion} />
      </div>
    </section>
  )
}
