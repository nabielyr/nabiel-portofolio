import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useLanguage } from '../context/contexts'
import { profile } from '../data/profile'
import { scrollToTarget } from '../lib/smoothScroll'
import FlapTicker from '../components/FlapTicker'
import TreatJar from '../components/TreatJar'
import { prepareOwl } from '../components/owl/loadOwl'
import styles from './Hero.module.css'

// Start fetching the owl's code and painting its feathers (in a worker) as
// soon as the page's script runs
prepareOwl()

/**
 * The name waits for its font, so it never swaps typeface halfway through
 * rising (re-rastering huge glyphs mid-animation dropped a frame).
 */
function useFontReady() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let alive = true
    const timeout = new Promise((resolve) => setTimeout(resolve, 900))
    const font = document.fonts?.load('800 1em "Big Shoulders Display"') ?? Promise.resolve()
    Promise.race([font, timeout])
      .catch(() => {})
      .then(() => alive && requestAnimationFrame(() => alive && setReady(true)))
    return () => {
      alive = false
    }
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

export default function Hero() {
  const { t } = useLanguage()
  const reduceMotion = useReducedMotion()
  const fontReady = useFontReady()
  // Mount the 3D owl as soon as its code and textures are in (they load with
  // the page). The name has started rising by then; the owl's GPU set-up
  // doesn't hold it up, since its textures are painted off the GPU and
  // uploaded a few per frame (checked with a trace: no compositor stalls).
  const [OwlCanvas, setOwlCanvas] = useState(null)
  useEffect(() => {
    if (!fontReady) return undefined
    let alive = true
    // a function in state must be wrapped, or React would call it
    prepareOwl().then((C) => alive && C && setOwlCanvas(() => C))
    return () => {
      alive = false
    }
  }, [fontReady])
  const owlApi = useRef(null)
  const narrow = useMediaQuery('(max-width: 860px)')
  // the hero section drives the owl's pointer events, so its tall canvas never blocks links
  const [heroEl, setHeroEl] = useState(null)
  // the owl's spot next to the name; on wide screens its canvas runs on to the page's right edge
  const [owlSpot, setOwlSpot] = useState(null)
  const time = useMalangTime()
  const [hoot, setHoot] = useState(null)
  const hootTimer = useRef(0)
  const hootIndex = useRef(0)

  useEffect(() => () => clearTimeout(hootTimer.current), [])

  // kind: 'hoot' (a click), 'wake' (a click that woke it up) or 'nom' (fed)
  const onHoot = (kind = 'hoot') => {
    const lines = t(kind === 'wake' ? 'hero.wakes' : kind === 'nom' ? 'hero.noms' : 'hero.hoots')
    const line = lines[hootIndex.current % lines.length]
    hootIndex.current += 1
    setHoot({ line, key: hootIndex.current })
    clearTimeout(hootTimer.current)
    hootTimer.current = setTimeout(() => setHoot(null), 1800)
  }

  const ticker = [
    { label: t('ticker.now'), value: t('ticker.nowText') },
    { label: t('ticker.time'), value: `${time} WIB` },
    { label: t('ticker.open'), value: t('ticker.openText') },
  ]
  const tickerLabel = ticker.map((i) => `${i.label} ${i.value}`).join(' · ')

  const owl = OwlCanvas && heroEl && (narrow || owlSpot) && (
    <OwlCanvas
      pose="hero"
      onHoot={onHoot}
      apiRef={owlApi}
      reduceMotion={reduceMotion}
      eventSource={heroEl}
      anchor={narrow ? null : owlSpot}
      framing={narrow ? 'fit' : 'stage'}
      unitPx={142}
    />
  )

  return (
    <section id="home" ref={setHeroEl} className={`${styles.hero} ${fontReady ? styles.go : ''}`}>
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

        <div ref={setOwlSpot} className={styles.owl}>
          {narrow && owl}
          {hoot && (
            <span key={hoot.key} className={styles.bubble} role="status">
              {hoot.line}
            </span>
          )}
        </div>
      </div>

      {!narrow && <div className={styles.owlStage}>{owl}</div>}

      {/* a jar of treats to feed Hoo, once he's here */}
      {OwlCanvas && (
        <TreatJar className={styles.treats} owlApi={owlApi} onFed={() => onHoot('nom')} label={t('hero.treat')} hint={t('hero.treatHint')} />
      )}

      <FlapTicker items={ticker} label={tickerLabel} dragLabel={t('ticker.drag')} instant={reduceMotion} />
    </section>
  )
}
