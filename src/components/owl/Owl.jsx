import { useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { makeShadowTexture } from './textures'
import { PALETTE, bodyTextures, headTextures, irisTexture, knitTextures, wingTextures } from './plumage'
import { EYE, HEAD } from './anatomy'

/*
 * Hoo, a chubby navy owl in a knitted orange scarf.
 *
 * The feathers, facial disc and belly are painted into textures once
 * (plumage.js); everything that moves is a group transform, so a frame costs
 * no geometry or texture work.
 *
 * Behaviour:
 * - daytime (light theme): after a while it gets drowsy (heavy eyelids, a
 *   yawn, a nod) and falls asleep, and stops watching the cursor; a click or
 *   a treat wakes it for a few seconds. At night (dark theme) it stays awake.
 * - food: a treat held close makes it open its beak; fed, it chews and hops
 * - entrance: flies in from off screen on the right (hero: the top right
 *   corner), feet hanging, glides, flares its wings and swings its feet
 *   forward to land. The flight waits until `ready`.
 * - the head turns toward the cursor, like a real owl, and the eyes follow
 * - it breathes, and blinks at random with real eyelids
 * - click: a little hop, a wing flap and a happy squint (^ ^)
 * - double click: a full 360° head turn
 * - pose="perch": stands on a letter of the contact title, toes curled over
 *   its edge, and waves a wing while hovered
 */

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const damp = (current, target, lambda, dt) => current + (target - current) * (1 - Math.exp(-lambda * dt))
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

// Upper/lower eyelid angles (radians around the eye's x axis). Shut, both
// lids roll to the same angle and meet a third of the way up the eye, so the
// lash line draws the curve of a closed eye. The lower lid reaches LOW_LAP
// past its rim, tucked under the upper one, so no sliver of eye shows
// between them from any angle.
const LOW_LAP = 0.22
const LID = { upOpen: -1.42, upKeen: -1.58, upHappy: -1.0, lowOpen: 1.35 + LOW_LAP, lowHappy: 0.85 + LOW_LAP, shut: 0.45 }

// The lower beak's hinge (head space): closed it hides behind the upper beak
const JAW = { y: 0.835, z: 0.685, tilt: 0.35 }

const FLIGHT_S = 2 // the hero entrance flight
const PERCH_FLIGHT_S = 1.7 // the contact owl's shorter hop over
const AWAKE_S = 7 // daytime: how long it stays up after landing before nodding off
const AWAKE_AFTER_CLICK_S = 8 // ...after being woken by a click
const AWAKE_AFTER_FOOD_S = 10 // ...after a treat
const DROWSY_S = 3.4 // heavy eyelids, a yawn and a nod before it's asleep
const EAT_S = 1.3

/** Shared materials: one instance per surface keeps shader programs and draw state low. */
function useMaterials() {
  const mats = useMemo(() => {
    // Plush / felt: matte with a soft sheen that catches the rim light
    const plush = (opts, sheen = '#5d77b3') =>
      new THREE.MeshPhysicalMaterial({ roughness: 0.9, metalness: 0, sheen: 0.8, sheenRoughness: 0.6, sheenColor: sheen, ...opts })
    const head = headTextures()
    const body = bodyTextures()
    const wing = wingTextures()
    const ring = knitTextures('ring')
    const tail = knitTextures('tail', true)
    return {
      head: plush({ ...head, bumpScale: 1.2 }),
      body: plush({ ...body, bumpScale: 1.2 }),
      wing: plush({ ...wing, bumpScale: 1.4 }),
      tuft: plush({ color: PALETTE.body }),
      primary: plush({ color: PALETTE.wingAlt }),
      tail: plush({ color: PALETTE.wingTip }),
      lid: plush({ color: PALETTE.face, side: THREE.DoubleSide }, '#9fb4e0'),
      eye: new THREE.MeshPhysicalMaterial({ color: '#fbf8f1', roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.06 }),
      iris: new THREE.MeshPhysicalMaterial({
        map: irisTexture(),
        roughness: 0.3,
        clearcoat: 1,
        clearcoatRoughness: 0.04,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
      shine: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
      lash: new THREE.MeshStandardMaterial({ color: '#0d1630', roughness: 0.8 }),
      beak: new THREE.MeshStandardMaterial({ color: PALETTE.orange, roughness: 0.4 }),
      mouth: new THREE.MeshStandardMaterial({ color: '#4a1a10', roughness: 0.7 }),
      cere: plush({ color: PALETTE.faceDeep }),
      feet: new THREE.MeshStandardMaterial({ color: '#ef7a32', roughness: 0.55 }),
      claw: new THREE.MeshStandardMaterial({ color: '#2a2320', roughness: 0.35 }),
      knitRing: new THREE.MeshStandardMaterial({ ...ring, bumpScale: 3, roughness: 0.95 }),
      knitTail: new THREE.MeshStandardMaterial({ ...tail, bumpScale: 3, roughness: 0.95 }),
      fringe: new THREE.MeshStandardMaterial({ color: PALETTE.orange, roughness: 0.95 }),
      shadow: new THREE.MeshBasicMaterial({ map: makeShadowTexture(), transparent: true, depthWrite: false }),
    }
  }, [])

  useEffect(
    () => () => {
      Object.values(mats).forEach((m) => {
        m.map?.dispose()
        m.bumpMap?.dispose()
        m.dispose()
      })
    },
    [mats],
  )
  return mats
}

/** Superellipse profile: a full, round bottom (so the feet sit on it), narrowing toward the neck */
function useBodyProfile() {
  return useMemo(() => {
    const pts = []
    const steps = 40
    const yc = -0.12
    const h = 0.9
    for (let i = 0; i <= steps; i++) {
      const u = -1 + (2 * i) / steps
      const y = yc + u * h
      const taper = 1 - 0.1 * Math.max(0, u)
      const r = 0.84 * taper * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), 2.6)), 1 / 2.6)
      pts.push(new THREE.Vector2(Math.max(r, 0.0001), y))
    }
    return pts
  }, [])
}

function Eye({ side, m, ball, iris, upper, lower, shine }) {
  return (
    <group position={[side * EYE.x, EYE.y, EYE.z]} rotation={[0, side * EYE.turn, 0]}>
      {/* everything inside is squashed into a shallow dome, so the eye sits in
          the face instead of bulging out; turning inside the squash keeps the
          iris gliding over the dome's surface */}
      <group scale={[1, 1, EYE.depth]}>
        <group ref={ball} rotation={[0, -side * EYE.turn, 0]}>
          <mesh material={m.eye}>
            <sphereGeometry args={[EYE.r, 40, 28]} />
          </mesh>
          <mesh ref={iris} material={m.iris} rotation={[Math.PI / 2, 0, 0]}>
            <sphereGeometry args={[EYE.r * 1.012, 40, 10, 0, Math.PI * 2, 0, 0.66]} />
          </mesh>
        </group>
        {/* a catch light that stays put while the eye moves */}
        <mesh ref={shine} material={m.shine} position={[0.06, 0.07, EYE.r * 0.9]}>
          <sphereGeometry args={[0.028, 12, 8]} />
        </mesh>
        {/* eyelids: shells just over the eye that roll down to blink */}
        <mesh ref={upper} material={m.lid} rotation={[LID.upOpen, 0, 0]}>
          <sphereGeometry args={[EYE.r * 1.08, 36, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          {/* a dark lash line along the lid's edge: a crease when open, a closed eye when shut */}
          <mesh material={m.lash} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[EYE.r * 1.08, 0.011, 6, 40]} />
          </mesh>
        </mesh>
        <mesh ref={lower} material={m.lid} rotation={[LID.lowOpen, 0, 0]}>
          <sphereGeometry args={[EYE.r * 1.07, 36, 14, 0, Math.PI * 2, Math.PI / 2 - LOW_LAP, Math.PI / 2 + LOW_LAP]} />
        </mesh>
      </group>
    </group>
  )
}

function Tuft({ side, m }) {
  // two soft, rounded feathers leaning out from the crown
  return (
    <group position={[side * 0.44, 1.38, -0.04]} rotation={[0.1, 0, -side * 0.5]}>
      <mesh material={m.tuft} position={[0, 0.13, 0]} scale={[0.1, 0.21, 0.065]}>
        <sphereGeometry args={[1, 24, 16]} />
      </mesh>
      <mesh material={m.tuft} position={[side * 0.08, 0.06, -0.03]} rotation={[0, 0, -side * 0.45]} scale={[0.075, 0.16, 0.055]}>
        <sphereGeometry args={[1, 20, 14]} />
      </mesh>
    </group>
  )
}

function Wing({ side, m, wingRef, primaries }) {
  return (
    <group ref={wingRef} position={[side * 0.72, 0.36, 0.02]}>
      {/* the wing is modelled for the right side and mirrored for the left */}
      <group scale={[side, 1, 1]}>
        <mesh material={m.wing} position={[0.05, -0.36, 0]} rotation={[0, 0, -0.1]} scale={[0.2, 0.5, 0.36]}>
          <sphereGeometry args={[1, 40, 28]} />
        </mesh>
        {/* long flight feathers that fan out when the wing opens */}
        {[0, 1, 2, 3].map((i) => (
          <group key={i} ref={(el) => (primaries.current[i] = el)} position={[0.1, -0.6, -0.1 - i * 0.07]}>
            <mesh material={m.primary} position={[0.02, -0.17, 0]} rotation={[0, 0, -0.1]} scale={[0.05, 0.22, 0.09]}>
              <sphereGeometry args={[1, 16, 12]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

function Foot({ x, m }) {
  return (
    <group position={[x, 0, 0]}>
      {/* a short feathered leg: hidden in the belly at rest, seen when the feet hang in flight */}
      <mesh material={m.tuft} position={[0, 0.09, -0.02]} scale={[1, 1, 0.9]}>
        <capsuleGeometry args={[0.075, 0.1, 4, 12]} />
      </mesh>
      {[-0.42, 0, 0.42].map((a) => (
        <group key={a} rotation={[0, a, 0]}>
          <mesh material={m.feet} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.07]}>
            <capsuleGeometry args={[0.05, 0.11, 4, 12]} />
          </mesh>
          <mesh material={m.claw} rotation={[Math.PI / 2 + 0.5, 0, 0]} position={[0, -0.02, 0.165]}>
            <coneGeometry args={[0.022, 0.07, 8]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/**
 * The entrance flight path, a cubic Bézier ending on the perch. Both canvases
 * run on to the right edge of the page, so the owl always arrives from off
 * screen: the hero owl from beyond the top right corner, the contact owl
 * from the right side, gliding down onto its letter.
 */
function makeFlight(view, pose) {
  const right = view?.right ?? 3
  const top = view?.top ?? 3.5
  const pts =
    pose === 'hero'
      ? [
          [right + 1.3, top + 1.5, 1.2],
          [right * 0.45 + 0.4, top * 0.55 + 0.9, 1.1],
          [1.1, 1.5, 0.35],
        ]
      : [
          [right + 1.6, Math.max(1.6, top - 2.3), 0.8],
          [right * 0.5 + 0.4, Math.max(1.6, top - 2), 0.7],
          [0.9, 1.2, 0.25],
        ]
  const [p0, p1, p2] = pts.map((p) => new THREE.Vector3(...p))
  const curve = new THREE.CubicBezierCurve3(p0, p1, p2, new THREE.Vector3())
  return { curve, pos: new THREE.Vector3(), tan: new THREE.Vector3() }
}

export default function Owl({
  pose = 'hero',
  pointer,
  reduceMotion = false,
  entrance = true,
  ready = true,
  night = false,
  viewRef,
  anchorsRef,
  zzzRef,
  onSleepChange,
  ref,
}) {
  const root = useRef()
  const tilt = useRef()
  const bodyRef = useRef()
  const head = useRef()
  const wingL = useRef()
  const wingR = useRef()
  const primL = useRef([])
  const primR = useRef([])
  const scarfTail = useRef()
  const feet = useRef()
  const ballL = useRef()
  const ballR = useRef()
  const upL = useRef()
  const upR = useRef()
  const lowL = useRef()
  const lowR = useRef()
  const shineL = useRef()
  const shineR = useRef()
  const irisL = useRef()
  const irisR = useRef()
  const jaw = useRef()
  const mouthIn = useRef()
  const shadow = useRef()
  const tmp = useMemo(() => new THREE.Vector3(), [])

  const m = useMaterials()
  const profile = useBodyProfile()

  // Mutable animation state, never React state
  const s = useRef({
    t: 0,
    yaw: 0,
    pitch: 0,
    hopY: 0,
    hopV: 0,
    dipY: 0, // knees giving a little on landing (a spring, not a squash)
    dipV: 0,
    flap: 0,
    happy: 0, // 0..1, the (^ ^) squint after a click
    spin: -1, // seconds into a head spin, -1 = not spinning
    blink: 0, // 0 open .. 1 closed
    nextBlink: 1.5,
    blinkT: -1,
    hover: false,
    intro: entrance && !reduceMotion ? 0 : -1, // seconds into the entrance, -1 = done
    flight: null,
    // sleep (day only: owls are night birds)
    phase: 'awake', // 'awake' | 'drowsy' | 'asleep'
    awakeLeft: AWAKE_S,
    drowsyT: 0,
    sleep: 0, // how closed the eyes are and how far the head has dropped, 0..1
    // food
    want: false, // a treat is close: beak open, eyes wide
    keen: 0, // eased version of want, so the lean and the eyes glide in and out
    eating: 0, // eased 0..1 while eating
    // the hanging end of the scarf is a damped pendulum (angle + velocity per axis)
    scarfX: -0.3,
    scarfXV: 0,
    scarfZ: -0.22,
    scarfZV: 0,
    wind: 0,
    eatT: -1, // seconds into eating, -1 = not eating
    mouth: 0,
  })

  const setPhase = (phase) => {
    const st = s.current
    if (st.phase === phase) return
    const wasAsleep = st.phase === 'asleep'
    st.phase = phase
    if (phase === 'asleep') onSleepChange?.(true)
    else if (wasAsleep) onSleepChange?.(false)
  }

  /** Wake up (or stay up) for `seconds`; a startled little hop if it was asleep */
  const wake = (seconds) => {
    const st = s.current
    const wasSleeping = st.phase !== 'awake'
    st.awakeLeft = Math.max(st.awakeLeft, seconds)
    setPhase('awake')
    if (wasSleeping && st.phase === 'awake' && st.hopY <= 0.02 && st.intro < 0) {
      st.hopV = 1.6
      st.blinkT = 0 // a double take
    }
    return wasSleeping
  }

  // Let the parent trigger reactions (click / double click / hover / food)
  useImperativeHandle(ref, () => ({
    /** returns true when the click woke it up */
    hop() {
      const st = s.current
      if (st.intro >= 0) return false
      if (st.phase !== 'awake') return wake(AWAKE_AFTER_CLICK_S)
      wake(AWAKE_AFTER_CLICK_S)
      st.happy = 1
      if (st.hopY > 0.02) return false
      st.hopV = 3.1
      st.flap = 1
      return false
    },
    spin() {
      const st = s.current
      if (st.spin < 0 && st.intro < 0 && st.phase === 'awake') st.spin = 0
    },
    setHover(v) {
      s.current.hover = v
    },
    /** a treat is being held near: open up and look keen */
    anticipate(v) {
      const st = s.current
      st.want = v
      if (v && st.intro < 0) wake(AWAKE_AFTER_CLICK_S)
    },
    eat() {
      const st = s.current
      if (st.intro >= 0) return
      wake(AWAKE_AFTER_FOOD_S)
      st.want = false
      st.eatT = 0
      st.happy = 1
    },
  }))

  useFrame((state, delta) => {
    const st = s.current
    const dt = Math.min(delta, 0.05)
    st.t += dt
    const t = st.t

    // ---- where to look ----
    let tx = 0
    let ty = 0
    const p = pointer?.current
    if (p && performance.now() - p.lastMove < 3500) {
      const rect = state.gl.domElement.getBoundingClientRect()
      // the owl's head on screen (the canvas may be wider than the owl's spot)
      const headX = rect.left + rect.width / 2 - (viewRef?.current?.cx ?? 0) * (viewRef?.current?.px ?? 0)
      const cy = rect.top + rect.height * 0.32
      tx = clamp((p.x - headX) / (window.innerWidth * 0.45), -1, 1)
      ty = clamp((p.y - cy) / (window.innerHeight * 0.5), -1, 1)
    } else if (!reduceMotion) {
      // idle: slowly look around the room
      tx = Math.sin(t * 0.35) * 0.55 + Math.sin(t * 0.9) * 0.1
      ty = Math.sin(t * 0.27 + 1) * 0.2
    }

    // ---- entrance: flies in from off screen ----
    const pos = [0, 0, 0]
    let bank = 0
    let heading = 0
    let lean = 0
    let wingOpen = -1 // -1 = wings at rest
    let hang = 0 // feet hanging down in flight
    let reach = 0 // feet swung forward to land
    let flying = false
    if (st.intro >= 0) {
      // wait off screen until the parent says the owl can be seen
      if (ready) st.intro += dt
      if (!st.flight) st.flight = makeFlight(viewRef?.current, pose)
      const f = st.flight
      const k = Math.min(1, st.intro / (pose === 'hero' ? FLIGHT_S : PERCH_FLIGHT_S))
      // quick to arrive, slow to settle: the speed drops off toward the perch
      const u = 1 - Math.pow(1 - k, 2.3)
      f.curve.getPoint(u, f.pos)
      f.curve.getTangent(u, f.tan)
      pos[0] = f.pos.x
      pos[1] = f.pos.y
      pos[2] = f.pos.z
      const land = smooth(0.78, 1, k)
      // lean into the turn, face the way it's flying, then square up to land
      bank = clamp(-f.tan.x * 0.45, -0.4, 0.4) * (1 - land)
      heading = (-0.75 + Math.sin(st.intro * 2.2) * 0.08) * (1 - land)
      lean = 0.32 * (1 - smooth(0.55, 0.8, k)) - 0.42 * smooth(0.72, 0.86, k) * (1 - smooth(0.9, 1, k))
      // flap hard, glide, then flare with big beats just before touching down
      const beat = Math.sin(st.intro * 15)
      const glide = smooth(0.4, 0.5, k) * (1 - smooth(0.68, 0.76, k))
      const flare = smooth(0.74, 0.8, k) * (1 - smooth(0.95, 1, k))
      wingOpen = (1 - glide) * (0.55 + 0.6 * beat) + glide * (1.15 + 0.06 * beat) + flare * 0.35 * Math.sin(st.intro * 19)
      wingOpen *= 1 - smooth(0.93, 1, k)
      hang = 1 - smooth(0.66, 0.84, k)
      reach = smooth(0.7, 0.84, k) * (1 - smooth(0.93, 1, k))
      flying = true
      // the air rushing past dies down as it slows to land
      st.wind = (0.9 + Math.sin(st.intro * 13) * 0.18) * (1 - smooth(0.55, 1, k))
      // watch where it's going, then the cursor once it has landed
      tx = tx * land - 0.15 * (1 - land)
      ty = ty * land + 0.35 * (1 - land)
      if (k >= 1) {
        st.intro = -1
        st.wind = 0
        st.scarfXV -= 1.4 // the stop swings the scarf end forward
        st.dipV = -0.75
        st.happy = 0.6
        st.awakeLeft = AWAKE_S
      }
    }

    // ---- awake, drowsy, asleep ----
    const busy = st.want || st.eatT >= 0 || st.spin >= 0 || st.hopY > 0
    if (!flying) {
      if (night) {
        // nocturnal: wide awake all night
        if (st.phase !== 'awake') wake(AWAKE_S)
        st.awakeLeft = AWAKE_S
      } else if (st.phase === 'awake' && !busy && !reduceMotion) {
        st.awakeLeft -= dt
        if (st.awakeLeft <= 0) {
          st.drowsyT = 0
          setPhase('drowsy')
        }
      } else if (st.phase === 'drowsy') {
        st.drowsyT += dt
        if (st.drowsyT >= DROWSY_S) setPhase('asleep')
      }
    }
    // how sleepy it looks: drowsy is a fight against heavy eyelids, with a yawn and a nod
    let sleepTarget = 0
    let nod = 0
    let yawn = 0
    if (st.phase === 'drowsy') {
      const k = st.drowsyT / DROWSY_S
      sleepTarget = smooth(0, 1, k) * 0.85 + 0.15 * smooth(0.85, 1, k)
      sleepTarget = Math.min(1, sleepTarget + 0.35 * Math.pow(Math.sin(k * Math.PI * 2.5), 2) * (1 - k))
      yawn = Math.sin(clamp((k - 0.12) / 0.26, 0, 1) * Math.PI)
      nod = 0.18 * Math.sin(clamp((k - 0.55) / 0.2, 0, 1) * Math.PI)
    } else if (st.phase === 'asleep') {
      sleepTarget = 1
    }
    // eyes fall shut slowly, but snap open on waking
    st.sleep = damp(st.sleep, sleepTarget, sleepTarget > st.sleep ? 2.5 : 14, dt)
    const sleep = st.sleep
    const asleep = st.phase === 'asleep'

    // asleep or nodding off: the cursor no longer matters; the head drops and tilts
    const awakeK = 1 - smooth(0.25, 0.85, sleep)
    tx *= awakeK
    ty = ty * awakeK + (0.75 + nod * 3 - yawn * 0.6) * (1 - awakeK)
    const breathRate = asleep ? 1.25 : 2.1
    const breath = reduceMotion ? 0 : Math.sin(t * breathRate)

    st.yaw = damp(st.yaw, tx * 0.85, flying ? 3 : asleep ? 1.5 : 6, dt)
    st.pitch = damp(st.pitch, ty * 0.38 + (asleep ? breath * 0.02 : 0), asleep ? 2 : 6, dt)

    let spinExtra = 0
    if (st.spin >= 0) {
      st.spin += dt
      const k = Math.min(1, st.spin / 1.1)
      spinExtra = easeInOut(k) * Math.PI * 2
      if (k >= 1) st.spin = -1
    }

    // ---- eating: gulp, chew, then a little hop of joy ----
    let chew = 0
    let eatBob = 0
    if (st.eatT >= 0) {
      const before = st.eatT
      st.eatT += dt
      const e = st.eatT
      chew = e < 0.18 ? 1 : 0.35 + 0.45 * Math.abs(Math.sin((e - 0.18) * 13))
      eatBob = e < EAT_S ? Math.abs(Math.sin(e * 13)) * 0.035 * (1 - smooth(EAT_S - 0.3, EAT_S, e)) : 0
      if (before < EAT_S && e >= EAT_S && st.hopY <= 0.02) {
        st.hopV = 2.4
        st.flap = 0.8
      }
      if (e >= EAT_S + 0.15) st.eatT = -1
    }

    if (head.current) {
      head.current.rotation.y = st.yaw + spinExtra
      head.current.rotation.x = st.pitch + st.eating * 0.08 - st.keen * 0.05
      head.current.rotation.z = -st.yaw * 0.12 + (reduceMotion ? 0 : Math.sin(t * 0.8) * 0.03) + sleep * 0.14
      head.current.position.y = 0.2 - eatBob - sleep * 0.03
    }
    // the eyeballs turn a little further than the head does
    const ex = clamp(tx * 0.32, -0.32, 0.32)
    const ey = clamp(ty * 0.22, -0.22, 0.16)
    // each eye first undoes its outward turn, so both aim at the same point
    for (const [b, side] of [
      [ballL.current, -1],
      [ballR.current, 1],
    ]) {
      if (!b) continue
      b.rotation.y = damp(b.rotation.y, ex - side * EYE.turn, 12, dt)
      b.rotation.x = damp(b.rotation.x, ey, 12, dt)
    }

    // ---- blink, happy squint, keen eyes, sleep ----
    if (!reduceMotion && st.phase === 'awake') {
      st.nextBlink -= dt
      if (st.nextBlink <= 0 && st.blinkT < 0) {
        st.blinkT = 0
        st.nextBlink = 2.2 + Math.random() * 3.8
        if (Math.random() < 0.2) st.nextBlink = 0.25 // sometimes a double blink
      }
    }
    if (st.blinkT >= 0) {
      st.blinkT += dt
      const k = st.blinkT / 0.17
      st.blink = k < 0.45 ? k / 0.45 : Math.max(0, 1 - (k - 0.45) / 0.55)
      if (k >= 1) st.blinkT = -1
    }
    st.happy = Math.max(0, st.happy - dt * 0.8)
    const happy = smooth(0, 0.4, st.happy)
    st.keen = damp(st.keen, st.want ? 1 : 0, 7, dt)
    st.eating = damp(st.eating, st.eatT >= 0 ? 1 : 0, 6, dt)
    let up = THREE.MathUtils.lerp(LID.upOpen, LID.upHappy, happy)
    up = THREE.MathUtils.lerp(up, LID.upKeen, st.keen)
    const shut = Math.max(st.blink, sleep)
    const upAngle = THREE.MathUtils.lerp(up, LID.shut, shut)
    const lowAngle = THREE.MathUtils.lerp(THREE.MathUtils.lerp(LID.lowOpen, LID.lowHappy, happy), LID.shut, shut)
    for (const lid of [upL.current, upR.current]) if (lid) lid.rotation.x = upAngle
    for (const lid of [lowL.current, lowR.current]) if (lid) lid.rotation.x = lowAngle
    // the catch light would poke through a closed lid, and the iris has no
    // business showing once the eyes are nearly shut
    for (const sh of [shineL.current, shineR.current]) if (sh) sh.visible = shut < 0.45
    for (const ir of [irisL.current, irisR.current]) if (ir) ir.visible = shut < 0.8

    // ---- beak: open for a treat, chewing, yawning ----
    const mouthTarget = Math.max(chew, st.want ? 0.6 : 0, yawn)
    st.mouth = damp(st.mouth, mouthTarget, 16, dt)
    if (jaw.current) {
      jaw.current.position.y = JAW.y - st.mouth * 0.055
      jaw.current.position.z = JAW.z + st.mouth * 0.02
      jaw.current.rotation.x = JAW.tilt - st.mouth * 0.35
    }
    if (mouthIn.current) mouthIn.current.scale.y = 0.004 + st.mouth * 0.05

    // ---- hop (simple gravity), landing spring ----
    if (st.hopV !== 0 || st.hopY > 0) {
      st.hopV -= 11 * dt
      st.hopY += st.hopV * dt
      if (st.hopY <= 0) {
        st.hopY = 0
        st.dipV = Math.min(st.dipV, st.hopV * 0.18)
        st.hopV = 0
      }
    }
    // a soft, slightly underdamped spring: the legs take the weight and settle
    const springK = 160
    st.dipV += (-springK * st.dipY - 2 * 0.72 * Math.sqrt(springK) * st.dipV) * dt
    st.dipY = clamp(st.dipY + st.dipV * dt, -0.08, 0.04)
    st.flap = damp(st.flap, 0, 2.2, dt)

    const height = st.hopY + pos[1]
    if (shadow.current) {
      const k = 1 / (1 + Math.max(0, height) * 1.6)
      shadow.current.scale.set(1.55 * k, 1.05 * k, 1)
      shadow.current.material.opacity = 0.85 * k
    }
    if (root.current) {
      root.current.position.set(pos[0], height + st.dipY, pos[2])
      root.current.rotation.y = st.yaw * 0.18 * (flying ? 0 : 1) + heading
    }
    if (tilt.current) {
      // a happy little sway while eating, eased in and out
      tilt.current.rotation.z = bank + Math.sin(st.t * 9) * 0.025 * st.eating
      tilt.current.rotation.x = lean + st.keen * 0.05 + sleep * 0.04
    }
    if (bodyRef.current) {
      // breathing fills the whole body evenly (no stretching), deeper in sleep
      const b = 1 + breath * (asleep ? 0.012 : 0.006)
      bodyRef.current.scale.setScalar(b)
      bodyRef.current.rotation.z = reduceMotion ? 0 : Math.sin(t * 0.7) * 0.025 * (1 - sleep * 0.6)
    }
    if (feet.current) {
      // in flight the feet hang down and swing forward to land; on the contact
      // letters the toes curl over the edge, gripping it. On landing the feet
      // stay planted while the body dips.
      const grip = pose === 'perch' && !flying ? 0.75 : 0
      feet.current.position.y = -0.98 - hang * 0.09 - st.dipY
      feet.current.rotation.x = hang * 0.85 - reach * 0.45 + grip
    }

    // ---- wings ----
    let open
    if (wingOpen >= 0) {
      open = wingOpen
    } else {
      const flapPower = st.flap * 0.9
      open = flapPower > 0.02 ? Math.abs(Math.sin(t * 22)) * flapPower : 0
      open -= sleep * 0.05 // tucked in when asleep
    }
    let waveR = 0
    if (pose === 'perch' && st.hover && !flying && st.phase === 'awake') waveR = 1.9 + Math.sin(t * 9) * 0.35
    if (wingL.current) wingL.current.rotation.z = -(0.06 + open)
    if (wingR.current) {
      const target = 0.06 + open + waveR
      wingR.current.rotation.z = flying ? target : damp(wingR.current.rotation.z, target, 14, dt)
    }
    // flight feathers fan apart as the wing opens
    const fan = clamp(open, 0, 1.3)
    for (const list of [primL.current, primR.current]) {
      list.forEach((g, i) => {
        if (g) g.rotation.x = -fan * 0.22 * (i + 1)
      })
    }

    // scarf end: streams out in the wind, then swings back and settles like
    // cloth on a string (an underdamped spring per axis), never snapping
    if (scarfTail.current) {
      const targetZ = -0.22 + (reduceMotion ? 0 : Math.sin(t * 1.6) * 0.05) - st.yaw * 0.1 + st.wind * 0.5
      const targetX = -0.3 - st.wind * 0.8 - st.hopV * 0.04
      const k = 45
      const c = 2 * 0.3 * Math.sqrt(k)
      st.scarfXV += (-k * (st.scarfX - targetX) - c * st.scarfXV) * dt
      st.scarfZV += (-k * (st.scarfZ - targetZ) - c * st.scarfZV) * dt
      st.scarfX += st.scarfXV * dt
      st.scarfZ += st.scarfZV * dt
      // it can't swing back through the belly: it bumps it and stops
      if (st.scarfX > -0.27) {
        st.scarfX = -0.27
        st.scarfXV = Math.min(0, st.scarfXV) * -0.3
      }
      scarfTail.current.rotation.x = st.scarfX
      scarfTail.current.rotation.z = st.scarfZ
    }

    // ---- where the beak and the top of the head are on the canvas, for the
    //      treats and the floating "z"s (last frame's matrices are fine) ----
    if (head.current && (anchorsRef || zzzRef?.current)) {
      const { width, height: h } = state.size
      const toCanvas = (x, y, z) => {
        tmp.set(x, y, z)
        head.current.localToWorld(tmp)
        tmp.project(state.camera)
        return [(tmp.x * 0.5 + 0.5) * width, (-tmp.y * 0.5 + 0.5) * h]
      }
      if (anchorsRef) {
        const [mx, my] = toCanvas(0, 0.8, 0.74)
        anchorsRef.current = { mouth: { x: mx, y: my }, size: state.size }
      }
      if (zzzRef?.current) {
        const [zx, zy] = toCanvas(0.42, 1.55, 0.2)
        zzzRef.current.style.transform = `translate3d(${zx.toFixed(1)}px, ${zy.toFixed(1)}px, 0)`
      }
    }
  })

  return (
    <>
      {/* on the contact title the letter is the ground; a shadow there would float */}
      <mesh ref={shadow} visible={pose === 'hero'} material={m.shadow} position={[0, -1.045, 0.02]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.55, 1.05, 1]}>
        <planeGeometry args={[1, 1]} />
      </mesh>

      <group ref={root} dispose={null}>
        <group ref={tilt}>
          <group ref={bodyRef}>
            {/* body; phiStart puts the painted belly at the front */}
            <mesh material={m.body}>
              <latheGeometry args={[profile, 72, -Math.PI, Math.PI * 2]} />
            </mesh>

            {/* a short tail peeking out at the back */}
            <group position={[0, -0.62, -0.62]} rotation={[-0.9, 0, 0]}>
              {[-0.1, 0, 0.1].map((x) => (
                <mesh key={x} material={m.tail} position={[x, -0.16, 0]} rotation={[0, 0, x * -2]} scale={[0.07, 0.22, 0.04]}>
                  <sphereGeometry args={[1, 14, 10]} />
                </mesh>
              ))}
            </group>

            <Wing side={-1} m={m} wingRef={wingL} primaries={primL} />
            <Wing side={1} m={m} wingRef={wingR} primaries={primR} />

            <group ref={feet} position={[0, -0.98, 0.34]}>
              <Foot x={-0.3} m={m} />
              <Foot x={0.3} m={m} />
            </group>

            {/* knitted scarf: ring, knot and a hanging end with fringe */}
            <mesh material={m.knitRing} position={[0, 0.5, 0.02]} rotation={[Math.PI / 2 - 0.12, 0, 0]} scale={[1, 0.94, 1]}>
              <torusGeometry args={[0.6, 0.1, 24, 72]} />
            </mesh>
            <mesh material={m.knitRing} position={[0.27, 0.46, 0.6]} scale={[0.14, 0.12, 0.11]}>
              <sphereGeometry args={[1, 24, 16]} />
            </mesh>
            {/* the hanging end clears the round belly as it falls */}
            <group ref={scarfTail} position={[0.29, 0.42, 0.68]} rotation={[-0.3, 0, -0.22]}>
              <RoundedBox args={[0.22, 0.7, 0.06]} radius={0.025} smoothness={3} position={[0, -0.36, 0]} material={m.knitTail} />
              {[-0.075, -0.025, 0.025, 0.075].map((x) => (
                <mesh key={x} material={m.fringe} position={[x, -0.77, 0]}>
                  <cylinderGeometry args={[0.014, 0.01, 0.11, 6]} />
                </mesh>
              ))}
            </group>
          </group>

          {/* head turns on its own, like an owl's */}
          <group ref={head} position={[0, 0.2, 0]}>
            <mesh material={m.head} position={[0, HEAD.y, 0]} scale={HEAD.scale}>
              <sphereGeometry args={[HEAD.r, 72, 48]} />
            </mesh>

            <Eye side={-1} m={m} ball={ballL} iris={irisL} upper={upL} lower={lowL} shine={shineL} />
            <Eye side={1} m={m} ball={ballR} iris={irisR} upper={upR} lower={lowR} shine={shineR} />

            <Tuft side={-1} m={m} />
            <Tuft side={1} m={m} />

            {/* a hooked beak under a soft feathered base */}
            <mesh material={m.cere} position={[0, 0.93, 0.665]} scale={[0.07, 0.06, 0.05]}>
              <sphereGeometry args={[1, 16, 12]} />
            </mesh>
            {/* the inside of the mouth, only seen when the beak opens */}
            <mesh ref={mouthIn} material={m.mouth} position={[0, 0.8, 0.66]} scale={[0.05, 0.004, 0.03]}>
              <sphereGeometry args={[1, 16, 10]} />
            </mesh>
            {/* lower beak: tucked behind the upper one, it drops to open */}
            <group ref={jaw} position={[0, JAW.y, JAW.z]} rotation={[JAW.tilt, 0, 0]}>
              <mesh material={m.beak} position={[0, -0.035, 0]} rotation={[Math.PI, 0, 0]} scale={[1, 1, 0.75]}>
                <coneGeometry args={[0.045, 0.085, 18]} />
              </mesh>
            </group>
            <group position={[0, 0.89, 0.7]} rotation={[0.35, 0, 0]}>
              <mesh material={m.beak} position={[0, -0.06, 0]} rotation={[Math.PI, 0, 0]} scale={[1, 1, 0.8]}>
                <coneGeometry args={[0.065, 0.17, 24]} />
              </mesh>
              <mesh material={m.beak} position={[0, -0.135, -0.02]} rotation={[-0.6, 0, 0]} scale={[0.6, 1, 0.6]}>
                <coneGeometry args={[0.03, 0.06, 12]} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </>
  )
}
