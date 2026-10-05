import { useEffect, useState } from 'react'
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion'
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

function Portfolio() {
  const [loading, setLoading] = useState(true)
  const [heroReady, setHeroReady] = useState(false)
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 })

  useEffect(() => {
    initSmoothScroll()
    return () => destroySmoothScroll()
  }, [])

  const handlePreloaderDone = () => {
    setLoading(false)
    // Stagger hero text entrance slightly with curtain lift for maximum smoothness
    setTimeout(() => setHeroReady(true), 160)
  }

  return (
    <>
      <AnimatePresence onExitComplete={() => setHeroReady(true)}>
        {loading && <Preloader onDone={handlePreloaderDone} />}
      </AnimatePresence>

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

      <main id="main-content">
        <Hero ready={heroReady} />
        <About />
        <Experience />
        <Education />
        <Skills />
        <Projects />
        <Contact />
      </main>

      <Footer />
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
