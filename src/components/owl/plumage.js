import * as THREE from 'three'
import { PAINTERS } from './paint'

export { PALETTE } from './paint'

/*
 * The owl's painted textures (see paint.js). preparePlumage() paints them all
 * in a worker as soon as the page starts, so they're ready by the time the
 * owl mounts; without worker canvases it paints them here, one per idle slice.
 * The results are cached, so the hero and contact owls share them.
 */

const cache = new Map() // name -> ImageBitmap or canvas, drawn flipped

function paintHere(name) {
  if (!cache.has(name)) cache.set(name, PAINTERS[name]())
  return cache.get(name)
}

const idle = () =>
  new Promise((resolve) => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(resolve, { timeout: 250 })
    else setTimeout(resolve, 16)
  })

function canPaintInWorker() {
  try {
    return typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined' && !!new OffscreenCanvas(1, 1).getContext('2d')
  } catch {
    return false
  }
}

function paintInWorker(names) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./plumage.worker.js', import.meta.url), { type: 'module' })
    let left = names.length
    worker.onmessage = ({ data }) => {
      if (data.error) {
        worker.terminate()
        reject(new Error(data.error))
        return
      }
      cache.set(data.name, data.bitmap)
      left -= 1
      if (left === 0) {
        worker.terminate()
        resolve()
      }
    }
    worker.onerror = (e) => {
      worker.terminate()
      reject(e)
    }
    worker.postMessage(names)
  })
}

let preparing = null

/** Paint every surface off the main thread (or in idle slices), once */
export function preparePlumage() {
  if (!preparing) {
    const names = Object.keys(PAINTERS).filter((n) => !cache.has(n))
    const inWorker = canPaintInWorker() ? paintInWorker(names) : Promise.reject(new Error('no worker canvas'))
    preparing = inWorker.catch(async () => {
      for (const name of names) {
        if (cache.has(name)) continue
        await idle()
        paintHere(name)
      }
    })
  }
  return preparing
}

function toTexture(source, { repeat = false, srgb = true } = {}) {
  const tex = new THREE.Texture(source)
  tex.flipY = false // painted upside down already
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  if (repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.needsUpdate = true
  return tex
}

const pair = (name) => ({
  map: toTexture(paintHere(`${name}Color`)),
  bumpMap: toTexture(paintHere(`${name}Bump`), { srgb: false }),
})

export const headTextures = () => pair('head')
export const bodyTextures = () => pair('body')
export const wingTextures = () => pair('wing')
export const irisTexture = () => toTexture(paintHere('iris'))

/** The knitted scarf: 'ring' around the neck or the hanging 'tail' (stitches turned to run down it) */
export function knitTextures(name, rotate = false) {
  const out = {
    map: toTexture(paintHere(`${name}Color`), { repeat: true }),
    bumpMap: toTexture(paintHere(`${name}Bump`), { repeat: true, srgb: false }),
  }
  if (rotate) {
    Object.values(out).forEach((t) => {
      t.center.set(0.5, 0.5)
      t.rotation = Math.PI / 2
    })
  }
  return out
}
