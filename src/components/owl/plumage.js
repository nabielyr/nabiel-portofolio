import * as THREE from 'three'
import { eyeUV } from './anatomy'

/*
 * Painted surfaces for the owl: feathers, the facial disc, the belly, the
 * irises and the knitted scarf. Each one is drawn once into a 2D canvas (the
 * canvases are cached, so the hero and contact owls share the work) and then
 * wrapped in a texture. Nothing here runs per frame, and preparePlumage()
 * paints them one at a time while the browser is idle, before the owl mounts.
 *
 * Every painter takes a `bump` flag: the same shapes drawn in greys become a
 * bump map, so the feathers catch the light as well as being coloured.
 */

export const PALETTE = {
  body: '#1d2f59',
  bodyAlt: '#20335f',
  bodyDeep: '#192a51',
  face: '#35538c',
  faceDeep: '#2a4475',
  rim: '#17284c',
  brow: '#5873a8',
  belly: '#efe5d2',
  bellyAlt: '#e6d8bf',
  bellyMark: '#b79a6c',
  wingAlt: '#1b2c55',
  wingTip: '#13203f',
  orange: '#e8641b',
  cream: '#f4efe6',
}

const cache = new Map()
function cached(key, paint) {
  if (!cache.has(key)) cache.set(key, paint())
  return cache.get(key)
}

function canvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')]
}

// small deterministic random, so every owl gets the same feathers
function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/** One feather tip: a U shape whose rounded end points down */
function featherPath(ctx, x, y, w, h) {
  ctx.beginPath()
  ctx.moveTo(x - w / 2, y - h)
  ctx.lineTo(x - w / 2, y - w / 2)
  ctx.arc(x, y - w / 2, w / 2, Math.PI, 0, true)
  ctx.lineTo(x + w / 2, y - h)
  ctx.closePath()
}

/**
 * Rows of overlapping feathers, drawn bottom row first so each row tucks
 * under the one above it. `skip(x, y)` leaves holes (for the face or belly).
 */
function featherField(ctx, { w, h, fw, fh, colors, bump, seed, skip, scaleAt }) {
  const rand = rng(seed)
  const rows = []
  for (let y = h + fh; y > -fh; y -= fh * 0.55) rows.push(y)
  rows.forEach((y, row) => {
    const s = scaleAt ? scaleAt(y / h) : 1
    const fwS = fw * s
    const offset = row % 2 ? fwS / 2 : 0
    for (let x = -fwS + offset; x < w + fwS; x += fwS * 0.86) {
      const jx = x + (rand() - 0.5) * fwS * 0.25
      const jy = y + (rand() - 0.5) * fh * 0.2
      if (skip?.(jx, jy)) continue
      featherPath(ctx, jx, jy, fwS, fh * s)
      if (bump) {
        const g = (138 + rand() * 14) | 0
        ctx.fillStyle = `rgb(${g},${g},${g})`
        ctx.fill()
        ctx.lineWidth = 1.2
        ctx.strokeStyle = 'rgb(104,104,104)'
        ctx.stroke()
      } else {
        ctx.fillStyle = colors[(rand() * colors.length) | 0]
        ctx.fill()
        ctx.lineWidth = 1
        ctx.strokeStyle = colors.edge
        ctx.stroke()
      }
    }
  })
}

function toTexture(c, { repeat = false, srgb = true } = {}) {
  const tex = new THREE.CanvasTexture(c)
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  if (repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

/* ------------------------------------------------------------------ */
/* Head: feathers all over, and a heart-shaped facial disc            */
/* ------------------------------------------------------------------ */

/**
 * The head is a sphere, so the canvas is an equirectangular map:
 * x = around (front at 25%), y = top to bottom. `eyes` are the eye centres
 * in that map, in 0..1 units, so the face lines up with the real eyes.
 */
function paintHead(bump, eyes) {
  const W = 1024
  const H = 512
  const [c, ctx] = canvas(W, H)
  ctx.fillStyle = bump ? 'rgb(128,128,128)' : PALETTE.body
  ctx.fillRect(0, 0, W, H)

  const E = eyes.map(([u, v]) => [u * W, v * H])
  const R = 78 // facial disc lobe radius in px
  const inFace = (x, y) => E.some(([ex, ey]) => (x - ex) ** 2 + (y - ey) ** 2 < (R + 10) ** 2)

  const colors = [PALETTE.body, PALETTE.bodyAlt, PALETTE.body]
  colors.edge = PALETTE.bodyDeep
  featherField(ctx, {
    w: W,
    h: H,
    fw: 16,
    fh: 22,
    colors,
    bump,
    seed: 7,
    skip: inFace,
    // smaller feathers toward the crown and the face
    scaleAt: (v) => 0.7 + 0.5 * Math.min(1, Math.abs(v - 0.45) * 2),
  })

  // the disc: a dark ruff, then the lighter face inside it
  const lobes = (r, fill) => {
    ctx.fillStyle = fill
    E.forEach(([ex, ey]) => {
      ctx.beginPath()
      ctx.ellipse(ex, ey + 6, r, r * 1.08, 0, 0, Math.PI * 2)
      ctx.fill()
    })
    // fill the notch above the beak so the two lobes read as one heart
    const [[lx, ly], [rx]] = E
    ctx.beginPath()
    ctx.ellipse((lx + rx) / 2, ly + r * 0.35, (rx - lx) * 0.42, r * 0.8, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  lobes(R + 7, bump ? 'rgb(105,105,105)' : PALETTE.rim)
  lobes(R, bump ? 'rgb(160,160,160)' : PALETTE.face)

  // radial streaks from each eye, the way owl face feathers grow
  ctx.save()
  ctx.beginPath()
  E.forEach(([ex, ey]) => ctx.ellipse(ex, ey + 6, R, R * 1.08, 0, 0, Math.PI * 2))
  ctx.clip()
  const rand = rng(11)
  E.forEach(([ex, ey]) => {
    for (let i = 0; i < 70; i++) {
      const a = (i / 70) * Math.PI * 2 + rand() * 0.05
      const r0 = 34 + rand() * 6
      const r1 = R * (0.85 + rand() * 0.3)
      ctx.beginPath()
      ctx.moveTo(ex + Math.cos(a) * r0, ey + Math.sin(a) * r0)
      ctx.lineTo(ex + Math.cos(a) * r1, ey + Math.sin(a) * r1)
      ctx.lineWidth = 1.4
      ctx.strokeStyle = bump ? 'rgba(175,175,175,0.5)' : i % 2 ? 'rgba(30,52,96,0.55)' : 'rgba(255,255,255,0.05)'
      ctx.stroke()
    }
    // a darker ring right around the eye gives it a socket to sit in
    const g = ctx.createRadialGradient(ex, ey, 30, ex, ey, 50)
    g.addColorStop(0, bump ? 'rgba(60,60,60,0.9)' : 'rgba(14,24,48,0.85)')
    g.addColorStop(1, 'rgba(14,24,48,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(ex, ey, 50, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.restore()

  // soft, lighter brows that curve up: a friendly face, not a cross one
  if (!bump) {
    E.forEach(([ex, ey], i) => {
      const side = i === 0 ? -1 : 1
      ctx.beginPath()
      ctx.ellipse(ex + side * 6, ey - 46, 40, 13, side * 0.12, Math.PI * 1.05, Math.PI * 1.95)
      ctx.lineWidth = 9
      ctx.lineCap = 'round'
      ctx.strokeStyle = PALETTE.brow
      ctx.stroke()
    })
  }
  return c
}

/* ------------------------------------------------------------------ */
/* Body: feathers, and a cream belly with little chevron marks         */
/* ------------------------------------------------------------------ */

/** Lathe map: x = around (front in the middle), y = top to bottom. */
function paintBody(bump) {
  const W = 1024
  const H = 384
  const [c, ctx] = canvas(W, H)
  ctx.fillStyle = bump ? 'rgb(128,128,128)' : PALETTE.body
  ctx.fillRect(0, 0, W, H)

  // belly: an egg shape, wider low down
  const bx = W / 2
  const by = 236
  const inBelly = (x, y) => {
    const ry = y < by ? 132 : 112
    const rx = 118 - Math.max(0, by - y) * 0.18
    return ((x - bx) / rx) ** 2 + ((y - by) / ry) ** 2 < 1
  }

  const colors = [PALETTE.body, PALETTE.bodyAlt, PALETTE.body]
  colors.edge = PALETTE.bodyDeep
  featherField(ctx, { w: W, h: H, fw: 19, fh: 25, colors, bump, seed: 3, skip: inBelly })

  // the belly: soft cream down, its edge broken up by small feather tips
  const bellyPath = () => {
    ctx.beginPath()
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2
      const y = by + Math.sin(a) * (Math.sin(a) < 0 ? 132 : 112)
      const rx = 118 - Math.max(0, by - y) * 0.18
      ctx.lineTo(bx + Math.cos(a) * rx, y)
    }
    ctx.closePath()
  }
  bellyPath()
  if (bump) {
    ctx.fillStyle = 'rgb(140,140,140)'
    ctx.fill()
  } else {
    const g = ctx.createRadialGradient(bx, by - 20, 20, bx, by, 140)
    g.addColorStop(0, PALETTE.belly)
    g.addColorStop(1, PALETTE.bellyAlt)
    ctx.fillStyle = g
    ctx.fill()
  }
  // a fluffy edge: little puffs of down all the way round
  const rand = rng(5)
  ctx.fillStyle = bump ? 'rgb(140,140,140)' : PALETTE.bellyAlt
  for (let i = 0; i < 110; i++) {
    const a = (i / 110) * Math.PI * 2
    const y = by + Math.sin(a) * (Math.sin(a) < 0 ? 132 : 112)
    const rx = 118 - Math.max(0, by - y) * 0.18
    ctx.beginPath()
    ctx.arc(bx + Math.cos(a) * rx, y, 5 + rand() * 4, 0, Math.PI * 2)
    ctx.fill()
  }

  // chevron marks across the belly, like the bars on a real owl's chest
  {
    const rand = rng(9)
    for (let y = by - 90; y < by + 100; y += 26) {
      const row = Math.round((y - by) / 26)
      for (let x = bx - 100 + (row % 2 ? 14 : 0); x < bx + 100; x += 28) {
        if (!inBelly(x, y) || !inBelly(x + 10, y + 10) || !inBelly(x - 10, y + 10)) continue
        ctx.beginPath()
        ctx.moveTo(x - 6, y - 3 + rand())
        ctx.quadraticCurveTo(x, y + 5, x + 6, y - 3 + rand())
        ctx.lineWidth = 2.4
        ctx.lineCap = 'round'
        ctx.strokeStyle = bump ? 'rgb(112,112,112)' : PALETTE.bellyMark
        ctx.stroke()
      }
    }
  }
  return c
}

/* ------------------------------------------------------------------ */
/* Wings: rows of covert feathers over long flight feathers            */
/* ------------------------------------------------------------------ */

function paintWing(bump) {
  const W = 512
  const H = 256
  const [c, ctx] = canvas(W, H)
  ctx.fillStyle = bump ? 'rgb(128,128,128)' : PALETTE.body
  ctx.fillRect(0, 0, W, H)

  // long flight feathers on the lower half
  const rand = rng(21)
  for (let x = -10; x < W + 20; x += 22) {
    const top = H * 0.48 + rand() * 10
    ctx.beginPath()
    ctx.moveTo(x - 11, top)
    ctx.lineTo(x - 11, H - 10)
    ctx.quadraticCurveTo(x, H + 6, x + 11, H - 10)
    ctx.lineTo(x + 11, top)
    ctx.closePath()
    if (bump) {
      ctx.fillStyle = 'rgb(150,150,150)'
      ctx.fill()
      ctx.strokeStyle = 'rgb(70,70,70)'
    } else {
      const g = ctx.createLinearGradient(0, top, 0, H)
      g.addColorStop(0, PALETTE.wingAlt)
      g.addColorStop(1, PALETTE.wingTip)
      ctx.fillStyle = g
      ctx.fill()
      ctx.strokeStyle = PALETTE.wingTip
    }
    ctx.lineWidth = 1.5
    ctx.stroke()
    // the quill down the middle
    ctx.beginPath()
    ctx.moveTo(x, top + 6)
    ctx.lineTo(x, H - 8)
    ctx.lineWidth = 1
    ctx.strokeStyle = bump ? 'rgb(175,175,175)' : 'rgba(255,255,255,0.08)'
    ctx.stroke()
  }

  const colors = [PALETTE.body, PALETTE.bodyAlt, PALETTE.wingAlt]
  colors.edge = PALETTE.bodyDeep
  featherField(ctx, { w: W, h: H * 0.6, fw: 18, fh: 24, colors, bump, seed: 13 })
  return c
}

/* ------------------------------------------------------------------ */
/* Iris: drawn in polar form for a spherical cap (y = out from the     */
/* pupil, x = around), so rings and streaks come out round             */
/* ------------------------------------------------------------------ */

function paintIris() {
  const W = 256
  const H = 128
  const [c, ctx] = canvas(W, H)
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, '#05080f')
  g.addColorStop(0.4, '#05080f') // pupil
  g.addColorStop(0.46, '#7a3606')
  g.addColorStop(0.52, '#f7a531')
  g.addColorStop(0.78, '#ec8423')
  g.addColorStop(0.9, '#b8520f')
  g.addColorStop(1, '#3c1a05') // dark outer ring
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  // streaks radiating out from the pupil
  const rand = rng(17)
  for (let i = 0; i < 90; i++) {
    const x = rand() * W
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255,214,120,0.35)' : 'rgba(120,45,0,0.3)'
    ctx.fillRect(x, H * 0.47, 1 + rand() * 1.5, H * (0.3 + rand() * 0.15))
  }
  return c
}

/* ------------------------------------------------------------------ */
/* Scarf: knitted V stitches with two cream stripes                    */
/* ------------------------------------------------------------------ */

function paintKnit(bump, stripes) {
  const W = 512
  const H = 64
  const [c, ctx] = canvas(W, H)
  ctx.fillStyle = bump ? 'rgb(110,110,110)' : PALETTE.orange
  ctx.fillRect(0, 0, W, H)
  if (!bump && stripes) {
    ctx.fillStyle = PALETTE.cream
    for (const x of stripes) ctx.fillRect(x * W, 0, W * 0.04, H)
  }
  // columns of V stitches running along the scarf
  const sw = 8
  const sh = 8
  for (let y = 0; y < H; y += sh) {
    for (let x = 0; x < W; x += sw) {
      for (const side of [-1, 1]) {
        ctx.beginPath()
        ctx.ellipse(x + sw / 2 + side * 2, y + sh / 2, 2.2, 4.2, side * -0.5, 0, Math.PI * 2)
        if (bump) {
          ctx.fillStyle = 'rgb(190,190,190)'
        } else {
          ctx.fillStyle = side < 0 ? 'rgba(255,255,255,0.1)' : 'rgba(110,35,0,0.12)'
        }
        ctx.fill()
      }
    }
  }
  return c
}

/* ------------------------------------------------------------------ */

const RING_STRIPES = [0.3, 0.37]
const TAIL_STRIPES = [0.42, 0.5]

const PAINTERS = {
  headColor: () => paintHead(false, [eyeUV(-1), eyeUV(1)]),
  headBump: () => paintHead(true, [eyeUV(-1), eyeUV(1)]),
  bodyColor: () => paintBody(false),
  bodyBump: () => paintBody(true),
  wingColor: () => paintWing(false),
  wingBump: () => paintWing(true),
  iris: paintIris,
  ringColor: () => paintKnit(false, RING_STRIPES),
  ringBump: () => paintKnit(true, RING_STRIPES),
  tailColor: () => paintKnit(false, TAIL_STRIPES),
  tailBump: () => paintKnit(true, TAIL_STRIPES),
}

const paint = (name) => cached(name, PAINTERS[name])

const idle = () =>
  new Promise((resolve) => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(resolve, { timeout: 250 })
    else setTimeout(resolve, 16)
  })

/** Paint every surface, one per idle slice, so no single task gets long */
export async function preparePlumage() {
  for (const name of Object.keys(PAINTERS)) {
    if (cache.has(name)) continue
    await idle()
    paint(name)
  }
}

const pair = (name) => ({
  map: toTexture(paint(`${name}Color`)),
  bumpMap: toTexture(paint(`${name}Bump`), { srgb: false }),
})

export const headTextures = () => pair('head')
export const bodyTextures = () => pair('body')
export const wingTextures = () => pair('wing')
export const irisTexture = () => toTexture(paint('iris'))

/** The knitted scarf: 'ring' around the neck or the hanging 'tail' (stitches turned to run down it) */
export function knitTextures(name, rotate = false) {
  const out = {
    map: toTexture(paint(`${name}Color`), { repeat: true }),
    bumpMap: toTexture(paint(`${name}Bump`), { repeat: true, srgb: false }),
  }
  if (rotate) {
    Object.values(out).forEach((t) => {
      t.center.set(0.5, 0.5)
      t.rotation = Math.PI / 2
    })
  }
  return out
}
