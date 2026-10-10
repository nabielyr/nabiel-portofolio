/*
 * Loads the owl's code (three.js and all) and paints its textures in a worker.
 *
 * The sections render the loaded component directly instead of through
 * React.lazy: a lazy component suspends once even when its module is already
 * here, and React 19 holds a suspended reveal back by ~300ms, which kept the
 * hero owl and its books blank for that long.
 */

let OwlCanvas = null
let prep = null

/** Start loading (once); resolves with the OwlCanvas component when code and textures are ready */
export function prepareOwl() {
  prep ??= Promise.all([
    import('./OwlCanvas').then((m) => {
      OwlCanvas = m.default
    }),
    import('./plumage').then((m) => m.preparePlumage()),
  ])
    .catch(() => {})
    .then(() => OwlCanvas)
  return prep
}

/** The component once loaded, otherwise null */
export const loadedOwlCanvas = () => OwlCanvas
