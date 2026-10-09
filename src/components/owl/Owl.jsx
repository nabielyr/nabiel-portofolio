import { useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { makeShadowTexture } from './textures'

/*
 * Hoo, a chubby navy owl in a knitted orange scarf, built from simple shapes.
 *
 * Behaviour, all done by moving groups (no per-frame geometry updates):
 * - the head turns toward the cursor, like a real owl, and the pupils follow
 * - it breathes, blinks at random and looks around when the cursor is idle
 * - click: a little hop, a wing flap and a happy squint (^ ^)
 * - double click: a full 360° head turn
 * - pose="perch": waves a wing while hovered
 * - entrance: flies down from above the frame and lands, once
 */

const COLORS = {
  body: '#1f3260',
  bodyLight: '#2a4170',
  mask: '#33507f',
  ridge: '#182850',
  wingMid: '#1a2b53',
  wingTip: '#142243',
  belly: '#efe5d2',
  scallop: '#d6c3a0',
  eye: '#fbf8f1',
  iris: '#f0962e',
  pupil: '#0b1427',
  orange: '#e8641b',
  cream: '#f4efe6',
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const damp = (current, target, lambda, dt) => current + (target - current) * (1 - Math.exp(-lambda * dt))
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** Knitted look for the scarf: rib lines plus two cream bands, drawn once. */
function makeKnitTexture(rotate = false) {
  const w = 256
  const h = 64
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = COLORS.orange
  ctx.fillRect(0, 0, w, h)
  // cream bands across the scarf
  ctx.fillStyle = COLORS.cream
  for (const x of [0.36, 0.44]) ctx.fillRect(x * w, 0, w * 0.035, h)
  // knit ribs running along the scarf
  for (let y = 0; y < h; y += 4) {
    ctx.fillStyle = 'rgba(80, 25, 0, 0.16)'
    ctx.fillRect(0, y, w, 1)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
    ctx.fillRect(0, y + 2, w, 1)
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  if (rotate) {
    tex.center.set(0.5, 0.5)
    tex.rotation = Math.PI / 2
  }
  return tex
}

/** Shared materials: one instance per surface keeps shader programs and draw state low. */
function useMaterials() {
  const mats = useMemo(() => {
    // Plush / felt: matte with a soft sheen that catches the rim light
    const plush = (color, sheen = '#5d77b3') =>
      new THREE.MeshPhysicalMaterial({ color, roughness: 0.9, metalness: 0, sheen: 0.9, sheenRoughness: 0.6, sheenColor: sheen })
    const matte = (color, roughness = 0.75) => new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 })
    const knitRing = makeKnitTexture(false)
    const knitTail = makeKnitTexture(true)
    knitRing.repeat.set(1, 1)
    return {
      body: plush(COLORS.body),
      bodyLight: plush(COLORS.bodyLight),
      mask: plush(COLORS.mask, '#8aa2d8'),
      ridge: plush(COLORS.ridge),
      wingMid: plush(COLORS.wingMid),
      wingTip: plush(COLORS.wingTip),
      belly: plush(COLORS.belly, '#ffffff'),
      scallop: matte(COLORS.scallop, 0.85),
      eye: matte(COLORS.eye, 0.35),
      iris: matte(COLORS.iris, 0.4),
      pupil: matte(COLORS.pupil, 0.25),
      shine: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
      beak: matte(COLORS.orange, 0.55),
      feet: matte(COLORS.orange, 0.6),
      knitRing: new THREE.MeshStandardMaterial({ map: knitRing, bumpMap: knitRing, bumpScale: 1.4, roughness: 0.95 }),
      knitTail: new THREE.MeshStandardMaterial({ map: knitTail, bumpMap: knitTail, bumpScale: 1.4, roughness: 0.95 }),
      fringe: matte(COLORS.orange, 0.95),
      shadow: new THREE.MeshBasicMaterial({ map: makeShadowTexture(), transparent: true, depthWrite: false }),
    }
  }, [])

  useEffect(
    () => () => {
      Object.values(mats).forEach((m) => {
        m.map?.dispose()
        m.dispose()
      })
    },
    [mats],
  )
  return mats
}

function useBodyProfile() {
  return useMemo(() => {
    // Superellipse profile: a full, round bottom (so the feet sit on it)
    // narrowing a little toward the neck
    const pts = []
    const steps = 32
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

/** Small U-shaped feather scallops laid onto the curved belly, staggered rows */
function useScallops() {
  return useMemo(() => {
    const rows = [
      { y: 0.06, xs: [-0.13, 0.13] },
      { y: -0.1, xs: [-0.26, 0, 0.26] },
      { y: -0.26, xs: [-0.13, 0.13] },
      { y: -0.42, xs: [-0.26, 0, 0.26] },
      { y: -0.58, xs: [-0.13, 0.13] },
    ]
    const cy = -0.16
    const cz = 0.5
    const rx = 0.54
    const ry = 0.64
    const rz = 0.36
    const out = []
    for (const row of rows) {
      for (const x of row.xs) {
        const k = 1 - (x / rx) ** 2 - ((row.y - cy) / ry) ** 2
        if (k <= 0.05) continue
        out.push([x, row.y, cz + rz * Math.sqrt(k) - 0.004])
      }
    }
    return out
  }, [])
}

function Eye({ x, m, pupilRef, eyeRef }) {
  return (
    <group position={[x, 1.0, 0.62]} rotation={[0, x * 0.5, 0]}>
      <group ref={eyeRef}>
        <mesh material={m.eye}>
          <sphereGeometry args={[0.19, 32, 24]} />
        </mesh>
        <group ref={pupilRef}>
          {/* amber iris, black pupil and a catch light */}
          <mesh material={m.iris} position={[0, 0, 0.155]} scale={[0.13, 0.13, 0.05]}>
            <sphereGeometry args={[1, 24, 16]} />
          </mesh>
          <mesh material={m.pupil} position={[0, 0, 0.18]} scale={[0.075, 0.075, 0.035]}>
            <sphereGeometry args={[1, 20, 14]} />
          </mesh>
          <mesh material={m.shine} position={[0.04, 0.045, 0.205]}>
            <sphereGeometry args={[0.024, 10, 8]} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

function Wing({ side, m, wingRef }) {
  return (
    <group ref={wingRef} position={[side * 0.74, 0.32, 0.02]}>
      {/* layered feathers: base, middle and darker tips */}
      <mesh material={m.bodyLight} position={[side * 0.04, -0.34, 0]} rotation={[0, 0, side * -0.1]} scale={[0.19, 0.46, 0.34]}>
        <sphereGeometry args={[1, 28, 20]} />
      </mesh>
      <mesh material={m.wingMid} position={[side * 0.07, -0.5, -0.04]} rotation={[0, 0, side * -0.18]} scale={[0.15, 0.34, 0.28]}>
        <sphereGeometry args={[1, 24, 16]} />
      </mesh>
      <mesh material={m.wingTip} position={[side * 0.1, -0.66, -0.08]} rotation={[0, 0, side * -0.28]} scale={[0.1, 0.2, 0.2]}>
        <sphereGeometry args={[1, 20, 14]} />
      </mesh>
    </group>
  )
}

function Foot({ x, m }) {
  return (
    <group position={[x, -0.98, 0.34]}>
      {[-0.42, 0, 0.42].map((a) => (
        <mesh key={a} material={m.feet} rotation={[Math.PI / 2, 0, a]} position={[Math.sin(a) * 0.06, 0, 0.06]}>
          <capsuleGeometry args={[0.05, 0.11, 4, 10]} />
        </mesh>
      ))}
    </group>
  )
}

export default function Owl({ pose = 'hero', pointer, reduceMotion = false, entrance = true, ref }) {
  const root = useRef()
  const bodyRef = useRef()
  const head = useRef()
  const wingL = useRef()
  const wingR = useRef()
  const tail = useRef()
  const eyeL = useRef()
  const eyeR = useRef()
  const pupilL = useRef()
  const pupilR = useRef()
  const browL = useRef()
  const browR = useRef()
  const shadow = useRef()

  const m = useMaterials()
  const profile = useBodyProfile()
  const scallops = useScallops()

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
    intro: entrance && !reduceMotion ? 0 : -1, // seconds into the landing, -1 = done
  })

  // Let the parent trigger reactions (click / double click / hover)
  useImperativeHandle(ref, () => ({
    hop() {
      const st = s.current
      st.happy = 1
      if (st.hopY > 0.02) return
      st.hopV = 3.1
      st.flap = 1
    },
    spin() {
      if (s.current.spin < 0) s.current.spin = 0
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
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height * 0.32
      tx = clamp((p.x - cx) / (window.innerWidth * 0.45), -1, 1)
      ty = clamp((p.y - cy) / (window.innerHeight * 0.5), -1, 1)
    } else if (!reduceMotion) {
      // idle: slowly look around the room
      tx = Math.sin(t * 0.35) * 0.55 + Math.sin(t * 0.9) * 0.1
      ty = Math.sin(t * 0.27 + 1) * 0.2
    }
    // ---- entrance: fly down from above and land ----
    let introY = 0
    let introX = 0
    let introFlap = 0
    if (st.intro >= 0) {
      st.intro += dt
      const k = Math.min(1, st.intro / 1.9)
      const ease = 1 - Math.pow(1 - k, 3) // slows down for the landing
      introY = 4.4 * (1 - ease)
      introX = Math.sin(st.intro * 3.4) * 0.16 * (1 - k)
      introFlap = 1 - k * 0.55
      tx *= k // looks down at the landing spot instead of the cursor
      ty = ty * k + 0.55 * (1 - k)
      if (k >= 1) {
        st.intro = -1
        st.squash = 1
      }
    }

    st.yaw = damp(st.yaw, tx * 0.85, 6, dt)
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
    // pupils drift a bit further than the head turns
    const px = clamp(tx * 0.04, -0.04, 0.04)
    const py = clamp(-ty * 0.035, -0.035, 0.035)
    if (pupilL.current) pupilL.current.position.set(px, py, 0)
    if (pupilR.current) pupilR.current.position.set(px, py, 0)

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
        const k = st.blinkT / 0.16
        st.blink = k < 0.5 ? k * 2 : Math.max(0, 2 - k * 2)
        if (k >= 1) st.blinkT = -1
      }
    }
    st.happy = Math.max(0, st.happy - dt * 0.9)
    const happy = Math.min(1, st.happy * 2.5)
    const eyeScaleY = Math.max(0.1, 1 - Math.max(st.blink * 0.92, happy * 0.82))
    if (eyeL.current) eyeL.current.scale.y = eyeScaleY
    if (eyeR.current) eyeR.current.scale.y = eyeScaleY
    // brows lift a little when happy
    if (browL.current) browL.current.position.y = 0.16 + happy * 0.05
    if (browR.current) browR.current.position.y = 0.16 + happy * 0.05

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

    const breathe = reduceMotion ? 0 : Math.sin(t * 2.1) * 0.012
    if (shadow.current) {
      const k = 1 / (1 + (st.hopY + introY) * 1.6)
      shadow.current.scale.set(1.55 * k, 1.05 * k, 1)
      shadow.current.material.opacity = 0.85 * k
    }
    if (root.current) {
      root.current.position.x = introX
      root.current.position.y = st.hopY + introY
      root.current.rotation.y = st.yaw * 0.18
    }
    if (bodyRef.current) {
      const sq = st.squash * 0.12
      bodyRef.current.scale.set(1 + sq * 0.6, 1 + breathe - sq, 1 + sq * 0.6)
      bodyRef.current.rotation.z = reduceMotion ? 0 : Math.sin(t * 0.7) * 0.025
    }

    // ---- wings ----
    const flapPower = Math.max(st.flap * 0.9, introFlap * 1.15)
    const flapAngle = flapPower > 0.02 ? Math.abs(Math.sin(t * (introFlap > 0 ? 17 : 22))) * flapPower : 0
    let waveR = 0
    if (pose === 'perch' && st.hover) waveR = 1.9 + Math.sin(t * 9) * 0.35
    if (wingL.current) wingL.current.rotation.z = -(0.06 + flapAngle)
    if (wingR.current) {
      const target = 0.06 + flapAngle + waveR
      wingR.current.rotation.z = damp(wingR.current.rotation.z, target, 14, dt)
    }

    // scarf end swings a little
    if (tail.current) {
      tail.current.rotation.z = -0.22 + (reduceMotion ? 0 : Math.sin(t * 1.6) * 0.05) - st.yaw * 0.1 + st.hopV * 0.03
    }
  })

  return (
    <>
      <mesh ref={shadow} material={m.shadow} position={[0, -1.045, 0.02]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.55, 1.05, 1]}>
        <planeGeometry args={[1, 1]} />
      </mesh>

      <group ref={root} dispose={null}>
        <group ref={bodyRef}>
          {/* body */}
          <mesh material={m.body}>
            <latheGeometry args={[profile, 56]} />
          </mesh>

          {/* belly with feather scallops */}
          <mesh material={m.belly} position={[0, -0.16, 0.5]} scale={[0.54, 0.64, 0.36]}>
            <sphereGeometry args={[1, 44, 32]} />
          </mesh>
          {scallops.map(([x, y, z]) => (
            <mesh key={`${x}${y}`} material={m.scallop} position={[x, y, z]} rotation={[0, x * 1.1, Math.PI]}>
              <torusGeometry args={[0.055, 0.011, 8, 18, Math.PI]} />
            </mesh>
          ))}

          <Wing side={-1} m={m} wingRef={wingL} />
          <Wing side={1} m={m} wingRef={wingR} />

          <Foot x={-0.3} m={m} />
          <Foot x={0.3} m={m} />

          {/* knitted scarf: ring, knot and a hanging end with fringe */}
          <mesh material={m.knitRing} position={[0, 0.5, 0.02]} rotation={[Math.PI / 2 - 0.12, 0, 0]} scale={[1, 0.94, 1]}>
            <torusGeometry args={[0.6, 0.1, 20, 64]} />
          </mesh>
          <mesh material={m.knitRing} position={[0.27, 0.46, 0.57]} scale={[0.14, 0.12, 0.11]}>
            <sphereGeometry args={[1, 20, 16]} />
          </mesh>
          <group ref={tail} position={[0.3, 0.42, 0.6]} rotation={[0.25, 0, -0.22]}>
            <mesh material={m.knitTail} position={[0, -0.36, 0]}>
              <boxGeometry args={[0.22, 0.7, 0.07]} />
            </mesh>
            {[-0.075, -0.025, 0.025, 0.075].map((x) => (
              <mesh key={x} material={m.fringe} position={[x, -0.77, 0]}>
                <cylinderGeometry args={[0.014, 0.01, 0.11, 6]} />
              </mesh>
            ))}
          </group>
        </group>

        {/* head turns on its own, like an owl's */}
        <group ref={head} position={[0, 0.2, 0]}>
          <mesh material={m.body} position={[0, 0.8, 0]} scale={[1.04, 0.86, 0.94]}>
            <sphereGeometry args={[0.74, 56, 40]} />
          </mesh>

          {/* heart-shaped facial mask: two soft discs that meet over the beak */}
          {[-1, 1].map((side) => (
            <mesh
              key={side}
              material={m.mask}
              position={[side * 0.27, 1.0, 0.52]}
              rotation={[0, side * 0.42, side * -0.25]}
              scale={[0.33, 0.37, 0.14]}
            >
              <sphereGeometry args={[1, 32, 24]} />
            </mesh>
          ))}
          {/* little ridge between the eyes */}
          <mesh material={m.ridge} position={[0, 1.05, 0.66]} rotation={[0.25, 0, 0]} scale={[0.07, 0.17, 0.06]}>
            <sphereGeometry args={[1, 16, 12]} />
          </mesh>

          <Eye x={-0.27} m={m} eyeRef={eyeL} pupilRef={pupilL} />
          <Eye x={0.27} m={m} eyeRef={eyeR} pupilRef={pupilR} />

          {/* feathery brows, they lift when it's happy */}
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 0.27, 1.0, 0.68]}>
              <mesh
                ref={side < 0 ? browL : browR}
                material={m.ridge}
                position={[0, 0.16, 0]}
                rotation={[0, 0, side * -0.22]}
                scale={[0.14, 0.032, 0.05]}
              >
                <sphereGeometry args={[1, 16, 10]} />
              </mesh>
            </group>
          ))}

          {/* ear tufts */}
          {[-1, 1].map((side) => (
            <mesh key={side} material={m.body} position={[side * 0.47, 1.4, -0.04]} rotation={[0.05, 0, -side * 0.45]} scale={[1, 1, 0.65]}>
              <coneGeometry args={[0.15, 0.44, 24]} />
            </mesh>
          ))}

          {/* beak */}
          <mesh material={m.beak} position={[0, 0.84, 0.73]} rotation={[Math.PI - 0.5, 0, 0]}>
            <coneGeometry args={[0.07, 0.2, 18]} />
          </mesh>
        </group>
      </group>
    </>
  )
}
