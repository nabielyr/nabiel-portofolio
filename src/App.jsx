import { memo, useEffect } from 'react'
import { ThemeProvider } from './context/ThemeProvider'
import { LanguageProvider } from './context/LanguageProvider'
import { initSmoothScroll, destroySmoothScroll } from './lib/smoothScroll'

import Cursor from './components/Cursor'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

import Hero from './sections/Hero'
import About from './sections/About'
import Experience from './sections/Experience'
import Skills from './sections/Skills'
import Projects from './sections/Projects'
import Contact from './sections/Contact'

/*
 * Sections are memoized so a language or theme change only re-renders what
 * reads those contexts, not every layout measurement on the page.
 */
const Sections = memo(function Sections() {
  return (
    <>
      <Hero />
      <Projects />
      <About />
      <Experience />
      <Skills />
      <Contact />
    </>
  )
})

function Portfolio() {
  useEffect(() => {
    initSmoothScroll()
    return () => destroySmoothScroll()
  }, [])

  return (
    <>
      <Cursor />
      <Navbar />
      <main id="main-content">
        <Sections />
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
