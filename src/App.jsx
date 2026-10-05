import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'
import { ThemeProvider } from './context/ThemeProvider'
import { LanguageProvider } from './context/LanguageProvider'
import { initSmoothScroll, destroySmoothScroll } from './lib/smoothScroll'

import Preloader from './components/Preloader'
import Cursor from './components/Cursor'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

import Hero from './sections/Hero'
import About from './sections/About'
import Experience from './sections/Experience'
import Education from './sections/Education'
import Skills from './sections/Skills'
import Projects from './sections/Projects'
import Contact from './sections/Contact'

/*
 * Everything except the Preloader and Hero is memoized, so the intro state
 * changes (curtain lift, hero ready, preloader unmount) re-render only those
 * two instead of the whole page — a full re-render there (incl. the Projects
 * layout measurements) is what used to freeze the curtain.
 */
const Chrome = memo(function Chrome() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 })

  return (
    <>
      <Cursor />

      {/* Top scroll progress indicator */}
      <motion.div className="scroll-progress" style={{ scaleX }} />

      {/* Ambient background decoration */}
      <div className="ambient" aria-hidden="true">
        <div className="ambient__blob ambient__blob--1" />
        <div className="ambient__blob ambient__blob--2" />
        <div className="ambient__blob ambient__blob--3" />
        <div className="ambient__grid" />
        <div className="ambient__noise" />
      </div>

      <Navbar />
    </>
  )
})

const Sections = memo(function Sections() {
  return (
    <>
      <About />
      <Experience />
      <Education />
      <Skills />
      <Projects />
      <Contact />
    </>
  )
})

const HeroSection = memo(Hero)
const SiteFooter = memo(Footer)

function Portfolio() {
  const [loading, setLoading] = useState(true)
  const [heroReady, setHeroReady] = useState(false)
  const revealTimer = useRef(0)

  useEffect(() => {
    initSmoothScroll()
    return () => {
      destroySmoothScroll()
      clearTimeout(revealTimer.current)
    }
  }, [])

  // Stagger hero text entrance slightly behind the curtain lift
  const handleReveal = useCallback(() => {
    revealTimer.current = setTimeout(() => setHeroReady(true), 160)
  }, [])
  const handleDone = useCallback(() => setLoading(false), [])

  return (
    <>
      {loading && <Preloader onReveal={handleReveal} onDone={handleDone} />}

      <Chrome />

      <main id="main-content">
        <HeroSection ready={heroReady} />
        <Sections />
      </main>

      <SiteFooter />
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <Portfolio />
      </LanguageProvider>
    </ThemeProvider>
  )
}
