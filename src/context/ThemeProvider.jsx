import { useCallback, useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import { ThemeContext } from './contexts'

const THEME_COLORS = { dark: '#0f1b33', light: '#f4efe6' }

function getInitialTheme() {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme])
  }, [theme])

  /**
   * Toggles theme with a circular reveal that expands from the click point
   * (View Transitions API). Falls back to an instant switch.
   */
  const toggleTheme = useCallback(
    (event) => {
      const next = theme === 'dark' ? 'light' : 'dark'
      // remember only an explicit choice; everyone else starts in light
      try {
        localStorage.setItem('theme-choice', next)
      } catch {
        /* storage unavailable */
      }
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (!document.startViewTransition || reduce) {
        setTheme(next)
        return
      }

      const x = event?.clientX ?? window.innerWidth / 2
      const y = event?.clientY ?? 0
      const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))

      const transition = document.startViewTransition(() => {
        flushSync(() => {
          document.documentElement.dataset.theme = next
          setTheme(next)
        })
      })

      transition.ready
        .then(() => {
          document.documentElement.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
            { duration: 650, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' },
          )
        })
        .catch(() => {})
    },
    [theme],
  )

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
