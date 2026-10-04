import Lenis from 'lenis'

let lenis = null

export function initSmoothScroll() {
  if (lenis || typeof window === 'undefined') return lenis
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null

  lenis = new Lenis({
    autoRaf: true,
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  })
  return lenis
}

export function destroySmoothScroll() {
  lenis?.destroy()
  lenis = null
}

export function stopScroll() {
  if (lenis) lenis.stop()
  else document.documentElement.style.overflow = 'hidden'
}

export function startScroll() {
  if (lenis) lenis.start()
  document.documentElement.style.overflow = ''
}

/** Smoothly scroll to a selector ('#about'), element, or number. */
export function scrollToTarget(target, offset = -72) {
  if (lenis) {
    lenis.scrollTo(target, { offset, duration: 1.4 })
    return
  }
  if (typeof target === 'number') {
    window.scrollTo({ top: target, behavior: 'smooth' })
    return
  }
  const el = typeof target === 'string' ? document.querySelector(target) : target
  el?.scrollIntoView({ behavior: 'smooth' })
}
