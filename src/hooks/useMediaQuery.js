import { useSyncExternalStore } from 'react'

/** Reactive CSS media query, e.g. useMediaQuery('(max-width: 768px)') */
export function useMediaQuery(query) {
  return useSyncExternalStore(
    (callback) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', callback)
      return () => mql.removeEventListener('change', callback)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

export const useIsTouch = () => useMediaQuery('(hover: none), (pointer: coarse)')
