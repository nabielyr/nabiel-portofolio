import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { FiDownload, FiMenu, FiMoon, FiSun, FiX } from 'react-icons/fi'
import { useLanguage, useTheme } from '../context/contexts'
import { profile } from '../data/profile'
import { scrollToTarget, startScroll, stopScroll } from '../lib/smoothScroll'
import Logo from './Logo'
import styles from './Navbar.module.css'

const SECTIONS = ['about', 'education', 'experience', 'skills', 'projects', 'contact']

function useActiveSection() {
  const [active, setActive] = useState('')
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    ;['home', ...SECTIONS].forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])
  return active
}

export default function Navbar() {
  const { t, lang, setLang } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const active = useActiveSection()
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)
  const { scrollY } = useScroll()
  const pageHeight = useRef(0)

  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0
    setScrolled(y > 40)

    // A scroll jump that comes with a page-height change is the browser keeping
    // the view anchored after a reflow (e.g. switching language), not the user
    // scrolling down - don't hide the nav for it.
    const height = document.documentElement.scrollHeight
    const reflowed = height !== pageHeight.current
    pageHeight.current = height
    if (reflowed) return

    setHidden(y > 500 && y > prev + 4 && !open)
    if (y < prev - 4) setHidden(false)
  })

  const firstRun = useRef(true)
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    if (open) stopScroll()
    else startScroll()
  }, [open])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const go = (id) => (e) => {
    e.preventDefault()
    setOpen(false)
    // wait a tick so scroll is re-enabled before scrolling
    requestAnimationFrame(() => scrollToTarget(id === 'home' ? 0 : `#${id}`))
  }

  return (
    <>
      <motion.header
        className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}
        animate={{ y: hidden ? '-120%' : '0%' }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={styles.bar}>
          <a href="#home" className={styles.brand} onClick={go('home')} aria-label="Home">
            <Logo />
            <span className={styles.brandText}>
              nabiel<span className={styles.brandDot}>.</span>
            </span>
          </a>

          <nav className={styles.links} aria-label="Primary">
            {SECTIONS.map((id) => (
              <a
                key={id}
                id={`nav-${id}`}
                href={`#${id}`}
                onClick={go(id)}
                className={`${styles.link} ${active === id ? styles.linkActive : ''}`}
              >
                {active === id && (
                  <motion.span
                    layoutId="nav-pill"
                    className={styles.pill}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className={styles.linkText}>{t(`nav.${id}`)}</span>
              </a>
            ))}
          </nav>

          <div className={styles.actions}>
            <button
              id="lang-toggle"
              className={styles.lang}
              onClick={() => setLang(lang === 'en' ? 'id' : 'en')}
              aria-label={t('nav.lang')}
            >
              {['en', 'id'].map((l) => (
                <span key={l} className={`${styles.langOpt} ${lang === l ? styles.langActive : ''}`}>
                  {lang === l && (
                    <motion.span layoutId="lang-thumb" className={styles.langThumb} transition={{ type: 'spring', stiffness: 420, damping: 32 }} />
                  )}
                  <span className={styles.langText}>{l.toUpperCase()}</span>
                </span>
              ))}
            </button>

            <button id="theme-toggle" className={styles.iconBtn} onClick={toggleTheme} aria-label={t('nav.theme')}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ rotate: -90, scale: 0, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ rotate: 90, scale: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className={styles.iconWrap}
                >
                  {theme === 'dark' ? <FiSun /> : <FiMoon />}
                </motion.span>
              </AnimatePresence>
            </button>

            {profile.cv && (
              <a id="nav-cv" className={styles.cv} href={profile.cv} download>
                <FiDownload />
                <span>{t('nav.cv')}</span>
              </a>
            )}

            <button
              id="menu-toggle"
              className={`${styles.iconBtn} ${styles.menuBtn}`}
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? t('nav.close') : t('nav.menu')}
              aria-expanded={open}
            >
              {open ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.overlay}
            initial={{ clipPath: 'circle(0% at calc(100% - 40px) 40px)' }}
            animate={{ clipPath: 'circle(150% at calc(100% - 40px) 40px)' }}
            exit={{ clipPath: 'circle(0% at calc(100% - 40px) 40px)' }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          >
            <nav className={styles.mobileLinks} aria-label="Mobile">
              {SECTIONS.map((id, i) => (
                <motion.a
                  key={id}
                  href={`#${id}`}
                  onClick={go(id)}
                  className={styles.mobileLink}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ delay: 0.2 + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className={styles.mobileIndex}>0{i + 1}</span>
                  {t(`nav.${id}`)}
                </motion.a>
              ))}
            </nav>
            <motion.div
              className={styles.mobileFooter}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {profile.socials.map((s) => (
                <a key={s.id} href={s.url} target={s.id === 'email' ? undefined : '_blank'} rel="noopener noreferrer">
                  {s.label}
                </a>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
