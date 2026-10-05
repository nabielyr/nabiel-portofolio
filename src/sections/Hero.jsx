import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import { FiArrowDown, FiArrowUpRight } from 'react-icons/fi'
import { useLanguage, useTheme } from '../context/contexts'
import { useIsTouch, useMediaQuery } from '../hooks/useMediaQuery'
import { profile } from '../data/profile'
import { scrollToTarget } from '../lib/smoothScroll'
import { markSceneReady } from '../lib/sceneReady'
import Button from '../components/Button'
import RotatingText from '../components/RotatingText'
import styles from './Hero.module.css'

const NeuralCanvas = lazy(() => import('../components/NeuralCanvas'))
// Eagerly prefetch 3D canvas so shaders compile during preloader instead of blocking hero entrance
if (typeof window !== 'undefined') {
  import('../components/NeuralCanvas').catch(() => {})
}

const ease = [0.22, 1, 0.36, 1]

// Invisible (< 1/255) but not 0: Chrome skips rasterizing opacity-0 content, so
// starting at 0 made the photo, chips etc. decode and raster all at once right
// as the curtain lifted. At 0.001 that work happens behind the Preloader.
const HIDDEN = 0.001

// Intro variants animate the full `transform` string (not x/y/rotate) so Motion
// hands them to WAAPI and they run on the compositor, off the main thread.
const rise = (distance, delay, duration = 0.8) => ({
  hidden: { opacity: HIDDEN, transform: `translateY(${distance}px)` },
  show: { opacity: 1, transform: 'translateY(0px)', transition: { duration, delay, ease } },
})

// "Nabiel" is the everyday name, so it carries the accent; the period closes the full name
const NAME_WORDS = [{ w: 'Muhammad' }, { w: 'Nabiel', accent: true }, { w: 'Yandra' }]

/** Letters that swell (variable font weight) when hovered. */
function HoverWord({ word, className = '' }) {
  return (
    <span className={`${styles.word} ${className}`}>
      {[...word].map((ch, i) => (
        <span key={i} className={styles.char}>
          {ch}
        </span>
      ))}
    </span>
  )
}

const CHIPS = [
  { text: 'import curiosity', pos: 'chipA', delay: 0 },
  { text: 'model.fit(ideas)', pos: 'chipB', delay: 0.15 },
  { text: '{ status: "learning" }', pos: 'chipC', delay: 0.3 },
]

export default function Hero({ ready }) {
  const { t, lang } = useLanguage()
  const { theme } = useTheme()
  const reduceMotion = useReducedMotion()
  const isTouch = useIsTouch()
  const compact = useMediaQuery('(max-width: 768px)')
  const heroRef = useRef(null)
  const [inView, setInView] = useState(true)
  const [eventSource, setEventSource] = useState(null)

  // Pause the WebGL loop once the hero scrolls out of view
  useEffect(() => {
    const el = heroRef.current
    if (!el) return undefined
    setEventSource(el)
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // No canvas to wait for - let the Preloader start right away
  useEffect(() => {
    if (reduceMotion) markSceneReady()
  }, [reduceMotion])

  // Photo tilt following the cursor
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), { stiffness: 120, damping: 18 })
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 120, damping: 18 })
  const chipX = useSpring(useTransform(mx, [-0.5, 0.5], [-14, 14]), { stiffness: 80, damping: 20 })
  const chipY = useSpring(useTransform(my, [-0.5, 0.5], [-14, 14]), { stiffness: 80, damping: 20 })

  const onPointerMove = (e) => {
    if (isTouch) return
    mx.set(e.clientX / window.innerWidth - 0.5)
    my.set(e.clientY / window.innerHeight - 0.5)
  }

  const show = ready ? 'show' : 'hidden'

  return (
    <section id="home" ref={heroRef} className={styles.hero} onPointerMove={onPointerMove}>
      <div className={styles.canvas}>
        {eventSource && !reduceMotion && (
          <Suspense fallback={null}>
            <NeuralCanvas theme={theme} compact={compact} active={inView} eventSource={eventSource} />
          </Suspense>
        )}
      </div>
      <div className={styles.vignette} aria-hidden="true" />

      <div className={`container ${styles.inner}`}>
        <motion.div className={styles.content} initial="hidden" animate={show}>
          <motion.p className={styles.location} variants={rise(16, 0)}>
            <span className={styles.liveDot} />
            {t('hero.location')}
          </motion.p>

          <motion.p className={styles.greeting} variants={rise(16, 0.1)}>
            {t('hero.greeting')}
          </motion.p>

          <h1 className={styles.name} aria-label={profile.name}>
            {NAME_WORDS.map(({ w, accent }, i) => (
              <span key={w} className={`${styles.line} ${i === 0 ? styles.lineFirst : ''}`} aria-hidden="true">
                <motion.span
                  className={styles.lineInner}
                  variants={{
                    hidden: { transform: 'translateY(115%) rotate(4deg)' },
                    show: {
                      transform: 'translateY(0%) rotate(0deg)',
                      transition: { duration: 1.1, delay: 0.2 + i * 0.12, ease },
                    },
                  }}
                >
                  <HoverWord word={w} className={accent ? styles.accentWord : ''} />
                  {i === NAME_WORDS.length - 1 && <span className={styles.period}>.</span>}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.div
            className={styles.role}
            variants={{ hidden: { opacity: HIDDEN }, show: { opacity: 1, transition: { duration: 0.8, delay: 0.7 } } }}
          >
            <span className={styles.prompt}>&gt;_</span>
            <RotatingText key={lang} words={t('hero.roles')} start={ready} />
          </motion.div>

          <motion.p className={styles.intro} variants={rise(20, 0.8, 0.9)}>
            {t('hero.intro')}
          </motion.p>

          <motion.div className={styles.ctas} variants={rise(20, 0.95, 0.9)}>
            <Button
              id="cta-projects"
              href="#projects"
              icon={<FiArrowUpRight />}
              onClick={(e) => {
                e.preventDefault()
                scrollToTarget('#projects')
              }}
            >
              {t('hero.ctaProjects')}
            </Button>
            <Button
              id="cta-contact"
              href="#contact"
              variant="ghost"
              onClick={(e) => {
                e.preventDefault()
                scrollToTarget('#contact')
              }}
            >
              {t('hero.ctaContact')}
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          className={styles.visual}
          initial={{ opacity: HIDDEN, transform: 'translateY(30px) scale(0.9)' }}
          animate={ready ? { opacity: 1, transform: 'translateY(0px) scale(1)' } : {}}
          transition={{ duration: 1.2, delay: 0.35, ease }}
        >
          <motion.div className={styles.photoTilt} style={{ rotateX, rotateY }}>
            <div className={styles.orbit} aria-hidden="true">
              <span className={styles.orbitNode} />
            </div>
            <div className={styles.backdrop} aria-hidden="true" />
            <div className={styles.frame}>
              <img
                src={profile.photo.src}
                srcSet={profile.photo.srcSet}
                sizes="(max-width: 768px) 260px, 420px"
                alt={profile.name}
                className={styles.photo}
                width="800"
                height="1000"
                fetchPriority="high"
              />
            </div>
          </motion.div>

          {CHIPS.map((chip) => (
            <motion.span
              key={chip.pos}
              className={`${styles.chip} ${styles[chip.pos]}`}
              style={{ x: chipX, y: chipY }}
              initial={{ opacity: HIDDEN, scale: 0.6 }}
              animate={ready ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 1.1 + chip.delay, ease }}
            >
              <span className={styles.chipInner}>{chip.text}</span>
            </motion.span>
          ))}
        </motion.div>
      </div>

      <motion.div
        className={styles.bottom}
        initial={{ opacity: HIDDEN }}
        animate={ready ? { opacity: 1 } : {}}
        transition={{ delay: 1.6, duration: 1 }}
      >
        <button className={styles.scrollCue} onClick={() => scrollToTarget('#about')} id="scroll-cue">
          <span className={styles.mouse}>
            <span className={styles.wheel} />
          </span>
          <span>{t('hero.scroll')}</span>
          <FiArrowDown className={styles.arrow} />
        </button>
      </motion.div>
    </section>
  )
}
