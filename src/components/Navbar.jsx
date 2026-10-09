import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { useLanguage, useTheme } from '../context/contexts'
import { profile } from '../data/profile'
import { scrollToTarget, startScroll, stopScroll } from '../lib/smoothScroll'
import Logo from './Logo'
import styles from './Navbar.module.css'

const SECTIONS = ['projects', 'about', 'experience', 'contact']

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
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)
  const { scrollY } = useScroll()
  const pageHeight = useRef(0)

  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0

    // A scroll jump that comes with a page-height change is the browser keeping
    // the view anchored after a reflow (e.g. switching language), not the user
    // scrolling down - don't hide the nav for it.
    const height = document.documentElement.scrollHeight
    const reflowed = height !== pageHeight.current
    pageHeight.current = height
    if (reflowed) return

    // Only react to a clear direction; smooth-scroll easing ends in 1px steps
    if (y < 120 || y < prev - 4) setHidden(false)
    else if (y > prev + 4 && !open) setHidden(true)
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
        className={styles.nav}
        animate={{ transform: hidden ? 'translateY(-100%)' : 'translateY(0%)' }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <a href="#home" className={styles.brand} onClick={go('home')} aria-label={t('nav.home')}>
          <Logo />
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
              {t(`nav.${id}`)}
            </a>
          ))}
        </nav>

        <div className={styles.actions}>
          {profile.cv && (
            <a id="nav-cv" className={styles.cv} href={profile.cv} download>
              {t('nav.cv')}
            </a>
          )}

          <button
            id="lang-toggle"
            className={styles.lang}
            onClick={() => setLang(lang === 'en' ? 'id' : 'en')}
            aria-label={t('nav.lang')}
          >
            <span className={lang === 'en' ? styles.langOn : ''}>EN</span>
            <span aria-hidden="true">/</span>
            <span className={lang === 'id' ? styles.langOn : ''}>ID</span>
          </button>

          <button
            id="theme-toggle"
            className={styles.switch}
            onClick={toggleTheme}
            role="switch"
            aria-checked={theme === 'dark'}
            aria-label={t('nav.theme')}
          >
            <span className={styles.switchKnob} />
          </button>

          <button
            id="menu-toggle"
            className={styles.menuBtn}
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? t('nav.close') : t('nav.menu')}
            aria-expanded={open}
          >
            {open ? t('nav.close') : t('nav.menu')}
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <nav className={styles.mobileLinks} aria-label="Mobile">
              {SECTIONS.map((id, i) => (
                <motion.a
                  key={id}
                  href={`#${id}`}
                  onClick={go(id)}
                  className={styles.mobileLink}
                  initial={{ opacity: 0, transform: 'translateY(24px)' }}
                  animate={{ opacity: 1, transform: 'translateY(0px)' }}
                  transition={{ delay: 0.05 + i * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  {t(`nav.${id}`)}
                </motion.a>
              ))}
            </nav>
            <div className={styles.mobileFooter}>
              {profile.cv && (
                <a href={profile.cv} download>
                  {t('nav.cv')}
                </a>
              )}
              {profile.socials
                .filter((s) => s.id === 'github' || s.id === 'linkedin')
                .map((s) => (
                  <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.label}
                  </a>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
