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
 * - entrance: flies in diagonally from the top right corner of the page,
 *   glides, flares its wings and lands, then shakes its feathers out
 * - the head turns toward the cursor, like a real owl, and the eyes follow
 * - it breathes, and blinks at random with real eyelids
 * - click: a little hop, a wing flap and a happy squint (^ ^)
 * - double click: a full 360° head turn
 * - pose="perch": waves a wing while hovered
 */

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const damp = (current, target, lambda, dt) => current + (target - current) * (1 - Math.exp(-lambda * dt))
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

// Upper/lower eyelid angles (radians around the eye's x axis)
const LID = { upOpen: -1.42, upClosed: 1.5, upHappy: -0.15, lowOpen: 1.35, lowHappy: 0.45 }

const FLIGHT_S = 2.5 // the entrance flight
const SETTLE_S = 0.7 // feather shake after landing

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
      beak: new THREE.MeshPhysicalMaterial({ color: PALETTE.orange, roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.2 }),
      cere: plush({ color: PALETTE.faceDeep }),
      feet: new THREE.MeshPhysicalMaterial({ color: '#ef7a32', roughness: 0.55, clearcoat: 0.3 }),
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

function Eye({ side, m, ball, upper, lower }) {
  return (
    <group position={[side * EYE.x, EYE.y, EYE.z]} rotation={[0, side * 0.5, 0]}>
      {/* the eyeball turns to look; iris and pupil are painted on a cap of it */}
      <group ref={ball}>
        <mesh material={m.eye}>
          <sphereGeometry args={[EYE.r, 40, 28]} />
        </mesh>
        <mesh material={m.iris} rotation={[Math.PI / 2, 0, 0]}>
          <sphereGeometry args={[EYE.r * 1.012, 40, 10, 0, Math.PI * 2, 0, 0.72]} />
        </mesh>
      </group>
      {/* a catch light that stays put while the eye moves */}
      <mesh material={m.shine} position={[0.055, 0.06, EYE.r * 0.95]}>
        <sphereGeometry args={[0.026, 12, 8]} />
      </mesh>
      {/* eyelids: shells just over the eye that roll down to blink */}
      <mesh ref={upper} material={m.lid} rotation={[LID.upOpen, 0, 0]}>
        <sphereGeometry args={[EYE.r * 1.07, 36, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh ref={lower} material={m.lid} rotation={[LID.lowOpen, 0, 0]}>
        <sphereGeometry args={[EYE.r * 1.06, 36, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
      </mesh>
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
 * The entrance flight path, a cubic Bézier ending on the perch. The hero owl
 * comes in diagonally from beyond the top right corner; the small contact
 * canvas has no room for that, so that one drops in from above.
 */
function makeFlight(view, pose) {
  const right = view?.right ?? 3
  const top = view?.top ?? 3.5
  const diagonal = pose === 'hero'
  const pts = diagonal
    ? [
        [right + 1.3, top + 1.5, 1.2],
        [right * 0.45 + 0.4, top * 0.55 + 0.9, 1.1],
        [1.1, 1.5, 0.35],
      ]
    : [
        [0.25, top + 1.4, 0],
        [0.3, top * 0.6, 0],
        [0.15, 1.1, 0],
      ]
  const [p0, p1, p2] = pts.map((p) => new THREE.Vector3(...p))
  const curve = new THREE.CubicBezierCurve3(p0, p1, p2, new THREE.Vector3())
  return { curve, turn: diagonal ? 1 : 0, pos: new THREE.Vector3(), tan: new THREE.Vector3() }
}

export default function Owl({ pose = 'hero', pointer, reduceMotion = false, entrance = true, viewRef, ref }) {
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
  const shadow = useRef()

  const m = useMaterials()
  const profile = useBodyProfile()

  // Mutable animation state, never React state
  const s = useRef({
    t: 0,
    yaw: 0,
    pitch: 0,
    hopY: 0,
    hopV: 0,
    squash: 0,
    flap: 0,
    happy: 0, // 0..1, the (^ ^) squint after a click
    spin: -1, // seconds into a head spin, -1 = not spinning
    blink: 0, // 0 open .. 1 closed
    nextBlink: 1.5,
    blinkT: -1,
    hover: false,
    intro: entrance && !reduceMotion ? 0 : -1, // seconds into the entrance, -1 = done
    flight: null,
    settle: -1, // seconds into the feather shake after landing
  })

  // Let the parent trigger reactions (click / double click / hover)
  useImperativeHandle(ref, () => ({
    hop() {
      const st = s.current
      if (st.intro >= 0) return
      st.happy = 1
      if (st.hopY > 0.02) return
      st.hopV = 3.1
      st.flap = 1
    },
    spin() {
      if (s.current.spin < 0 && s.current.intro < 0) s.current.spin = 0
    },
    setHover(v) {
      s.current.hover = v
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

    // ---- entrance: a diagonal flight in from the top right ----
    const pos = [0, 0, 0]
    let bank = 0
    let heading = 0
    let lean = 0
    let wingOpen = -1 // -1 = wings at rest
    let feetTuck = 0
    let flying = false
    if (st.intro >= 0) {
      st.intro += dt
      if (!st.flight) st.flight = makeFlight(viewRef?.current, pose)
      const f = st.flight
      const k = Math.min(1, st.intro / FLIGHT_S)
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
      heading = (-0.75 * f.turn + Math.sin(st.intro * 2.2) * 0.08) * (1 - land)
      lean = 0.32 * (1 - smooth(0.55, 0.8, k)) - 0.42 * smooth(0.72, 0.86, k) * (1 - smooth(0.9, 1, k))
      // flap hard, glide, then flare with big beats just before touching down
      const beat = Math.sin(st.intro * 15)
      const glide = smooth(0.4, 0.5, k) * (1 - smooth(0.68, 0.76, k))
      const flare = smooth(0.74, 0.8, k) * (1 - smooth(0.95, 1, k))
      wingOpen = (1 - glide) * (0.55 + 0.6 * beat) + glide * (1.15 + 0.06 * beat) + flare * 0.35 * Math.sin(st.intro * 19)
      wingOpen *= 1 - smooth(0.93, 1, k)
      feetTuck = 1 - smooth(0.62, 0.82, k)
      flying = true
      // watch where it's going, then the cursor once it has landed
      tx = tx * land - 0.15 * (1 - land)
      ty = ty * land + 0.35 * (1 - land)
      if (k >= 1) {
        st.intro = -1
        st.squash = 1
        st.settle = 0
        st.happy = 0.8
      }
    }

    st.yaw = damp(st.yaw, tx * 0.85, flying ? 3 : 6, dt)
    st.pitch = damp(st.pitch, ty * 0.38, 6, dt)

    let spinExtra = 0
    if (st.spin >= 0) {
      st.spin += dt
      const k = Math.min(1, st.spin / 1.1)
      spinExtra = easeInOut(k) * Math.PI * 2
      if (k >= 1) st.spin = -1
    }

    if (head.current) {
      head.current.rotation.y = st.yaw + spinExtra
      head.current.rotation.x = st.pitch
      head.current.rotation.z = -st.yaw * 0.12 + (reduceMotion ? 0 : Math.sin(t * 0.8) * 0.03)
    }
    // the eyeballs turn a little further than the head does
    const ex = clamp(tx * 0.32, -0.32, 0.32)
    const ey = clamp(ty * 0.22, -0.22, 0.16)
    for (const b of [ballL.current, ballR.current]) {
      if (!b) continue
      b.rotation.y = damp(b.rotation.y, ex, 12, dt)
      b.rotation.x = damp(b.rotation.x, ey, 12, dt)
    }

    // ---- blink & happy squint ----
    if (!reduceMotion) {
      st.nextBlink -= dt
      if (st.nextBlink <= 0 && st.blinkT < 0) {
        st.blinkT = 0
        st.nextBlink = 2.2 + Math.random() * 3.8
        if (Math.random() < 0.2) st.nextBlink = 0.25 // sometimes a double blink
      }
      if (st.blinkT >= 0) {
        st.blinkT += dt
        const k = st.blinkT / 0.17
        st.blink = k < 0.45 ? k / 0.45 : Math.max(0, 1 - (k - 0.45) / 0.55)
        if (k >= 1) st.blinkT = -1
      }
    }
    st.happy = Math.max(0, st.happy - dt * 0.8)
    const happy = smooth(0, 0.4, st.happy)
    const up = THREE.MathUtils.lerp(LID.upOpen, LID.upHappy, happy)
    const upAngle = THREE.MathUtils.lerp(up, LID.upClosed, st.blink)
    const lowAngle = THREE.MathUtils.lerp(LID.lowOpen, LID.lowHappy, happy)
    for (const lid of [upL.current, upR.current]) if (lid) lid.rotation.x = upAngle
    for (const lid of [lowL.current, lowR.current]) if (lid) lid.rotation.x = lowAngle

    // ---- hop (simple gravity) ----
    if (st.hopV !== 0 || st.hopY > 0) {
      st.hopV -= 11 * dt
      st.hopY += st.hopV * dt
      if (st.hopY <= 0) {
        st.hopY = 0
        st.hopV = 0
        st.squash = 1
      }
    }
    st.squash = damp(st.squash, 0, 9, dt)
    st.flap = damp(st.flap, 0, 2.2, dt)

    // ---- the feather shake after landing ----
    let shake = 0
    if (st.settle >= 0) {
      st.settle += dt
      const k = st.settle / SETTLE_S
      shake = Math.sin(st.settle * 42) * 0.07 * (1 - k) * smooth(0, 0.15, k)
      if (k >= 1) st.settle = -1
    }

    const breathe = reduceMotion ? 0 : Math.sin(t * 2.1) * 0.012
    const height = st.hopY + pos[1]
    if (shadow.current) {
      const k = 1 / (1 + Math.max(0, height) * 1.6)
      shadow.current.scale.set(1.55 * k, 1.05 * k, 1)
      shadow.current.material.opacity = 0.85 * k
    }
    if (root.current) {
      root.current.position.set(pos[0], height, pos[2])
      root.current.rotation.y = st.yaw * 0.18 * (flying ? 0 : 1) + heading
    }
    if (tilt.current) {
      tilt.current.rotation.z = bank + shake
      tilt.current.rotation.x = lean
    }
    if (bodyRef.current) {
      const sq = st.squash * 0.12
      bodyRef.current.scale.set(1 + sq * 0.6, 1 + breathe - sq, 1 + sq * 0.6)
      bodyRef.current.rotation.z = reduceMotion ? 0 : Math.sin(t * 0.7) * 0.025
    }
    if (feet.current) {
      feet.current.position.y = -0.98 + feetTuck * 0.12
      feet.current.rotation.x = -feetTuck * 0.7
    }

    // ---- wings ----
    let open
    if (wingOpen >= 0) {
      open = wingOpen
    } else {
      const flapPower = st.flap * 0.9 + Math.abs(shake) * 4
      open = flapPower > 0.02 ? Math.abs(Math.sin(t * 22)) * flapPower : 0
    }
    let waveR = 0
    if (pose === 'perch' && st.hover && !flying) waveR = 1.9 + Math.sin(t * 9) * 0.35
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

    // scarf end swings, and streams out behind in flight
    if (scarfTail.current) {
      const stream = flying ? 0.9 + Math.sin(t * 13) * 0.18 : 0
      scarfTail.current.rotation.z = -0.22 + (reduceMotion ? 0 : Math.sin(t * 1.6) * 0.05) - st.yaw * 0.1 + st.hopV * 0.03 + stream * 0.5
      scarfTail.current.rotation.x = -0.3 - stream * 0.8
    }
  })

  return (
    <>
      <mesh ref={shadow} material={m.shadow} position={[0, -1.045, 0.02]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.55, 1.05, 1]}>
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

            <Eye side={-1} m={m} ball={ballL} upper={upL} lower={lowL} />
            <Eye side={1} m={m} ball={ballR} upper={upR} lower={lowR} />

            <Tuft side={-1} m={m} />
            <Tuft side={1} m={m} />

            {/* a hooked beak under a soft feathered base */}
            <mesh material={m.cere} position={[0, 0.93, 0.665]} scale={[0.07, 0.06, 0.05]}>
              <sphereGeometry args={[1, 16, 12]} />
            </mesh>
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
