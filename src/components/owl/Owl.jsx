import { useImperativeHandle, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/*
 * A chubby navy owl with an orange knitted scarf, built from simple shapes.
 *
 * Behaviour, all done by moving groups (no per-frame geometry updates):
 * - the head turns toward the cursor, like a real owl, and the pupils follow
 * - it breathes, blinks at random and looks around when the cursor is idle
 * - click: a little hop with a wing flap (the parent shows a "hoo!" bubble)
 * - double click: a full 360° head turn
 * - pose="perch": waves a wing while hovered
 */

const C = {
  body: '#1f3260',
  face: '#2b4373',
  belly: '#efe5d2',
  feather: '#c9b48f',
  eye: '#fbf8f1',
  pupil: '#0b1427',
  orange: '#e8641b',
  stripe: '#f4efe6',
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const damp = (current, target, lambda, dt) => current + (target - current) * (1 - Math.exp(-lambda * dt))
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

function Clay({ color, ...rest }) {
  // Matte, slightly soft plastic: the "vinyl toy" look
  return <meshStandardMaterial color={color} roughness={0.82} metalness={0} {...rest} />
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

/** V-shaped feather marks laid onto the curved belly */
function useFeathers() {
  return useMemo(() => {
    const rows = [
      { y: -0.02, xs: [-0.2, 0, 0.2] },
      { y: -0.24, xs: [-0.3, -0.1, 0.1, 0.3] },
      { y: -0.46, xs: [-0.2, 0, 0.2] },
    ]
    const cx = 0, cy = -0.14, cz = 0.5, rx = 0.56, ry = 0.62, rz = 0.36
    const out = []
    for (const row of rows) {
      for (const x of row.xs) {
        const k = 1 - ((x - cx) / rx) ** 2 - ((row.y - cy) / ry) ** 2
        if (k <= 0) continue
        out.push([x, row.y, cz + rz * Math.sqrt(k) - 0.005])
      }
    }
    return out
  }, [])
}

function Eye({ x, pupilRef, eyeRef }) {
  return (
    <group position={[x, 1.0, 0.6]}>
      {/* face disc behind the eye */}
      <mesh position={[0, 0, -0.06]} rotation={[0, x * 0.7, 0]} scale={[0.34, 0.36, 0.13]}>
        <sphereGeometry args={[1, 32, 24]} />
        <Clay color={C.face} />
      </mesh>
      <group ref={eyeRef}>
        <mesh>
          <sphereGeometry args={[0.19, 32, 24]} />
          <Clay color={C.eye} roughness={0.45} />
        </mesh>
        <group ref={pupilRef}>
          <mesh position={[0, 0, 0.12]}>
            <sphereGeometry args={[0.095, 24, 16]} />
            <Clay color={C.pupil} roughness={0.3} />
          </mesh>
          <mesh position={[0.035, 0.04, 0.2]}>
            <sphereGeometry args={[0.028, 12, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      </group>
    </group>
  )
}

function Foot({ x }) {
  return (
    <group position={[x, -0.98, 0.34]}>
      {[-0.4, 0, 0.4].map((a) => (
        <mesh key={a} rotation={[Math.PI / 2, 0, a]} position={[Math.sin(a) * 0.06, 0, 0.06]}>
          <capsuleGeometry args={[0.05, 0.11, 4, 10]} />
          <Clay color={C.orange} />
        </mesh>
      ))}
    </group>
  )
}

/** Soft round shadow from a tiny gradient texture: drawn once, costs nothing per frame */
function useShadowTexture() {
  return useMemo(() => {
    const size = 128
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    g.addColorStop(0, 'rgba(19, 33, 63, 0.55)')
    g.addColorStop(0.45, 'rgba(19, 33, 63, 0.22)')
    g.addColorStop(1, 'rgba(19, 33, 63, 0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])
}

export default function Owl({ pose = 'hero', pointer, reduceMotion = false, ref }) {
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

  const profile = useBodyProfile()
  const feathers = useFeathers()
  const shadowTex = useShadowTexture()
  const shadow = useRef()

  // Mutable animation state, never React state
  const s = useRef({
    t: 0,
    yaw: 0,
    pitch: 0,
    hopY: 0,
    hopV: 0,
    squash: 0,
    flap: 0,
    spin: -1, // seconds into a head spin, -1 = not spinning
    blink: 0, // 0 open .. 1 closed
    nextBlink: 1.5,
    blinkT: -1,
    hover: false,
  })

  // Let the parent trigger reactions (click / double click / hover)
  useImperativeHandle(ref, () => ({
    hop() {
      const st = s.current
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
    const lookYaw = tx * 0.95
    const lookPitch = ty * 0.4
    st.yaw = damp(st.yaw, lookYaw, 6, dt)
    st.pitch = damp(st.pitch, lookPitch, 6, dt)

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
    const px = clamp(tx * 0.045, -0.045, 0.045)
    const py = clamp(-ty * 0.04, -0.04, 0.04)
    if (pupilL.current) pupilL.current.position.set(px, py, 0)
    if (pupilR.current) pupilR.current.position.set(px, py, 0)

    // ---- blink ----
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
    const eyeScaleY = 1 - st.blink * 0.92
    if (eyeL.current) eyeL.current.scale.y = eyeScaleY
    if (eyeR.current) eyeR.current.scale.y = eyeScaleY

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
      const k = 1 / (1 + st.hopY * 1.6)
      shadow.current.scale.set(2.6 * k, 1.5 * k, 1)
      shadow.current.material.opacity = 0.9 * k
    }
    if (root.current) {
      root.current.position.y = st.hopY
      root.current.rotation.y = st.yaw * 0.18
    }
    if (bodyRef.current) {
      const sq = st.squash * 0.12
      bodyRef.current.scale.set(1 + sq * 0.6, 1 + breathe - sq, 1 + sq * 0.6)
      bodyRef.current.rotation.z = reduceMotion ? 0 : Math.sin(t * 0.7) * 0.025
    }

    // ---- wings ----
    const flapAngle = st.flap > 0.02 ? Math.abs(Math.sin(t * 22)) * st.flap * 0.9 : 0
    let waveR = 0
    if (pose === 'perch' && st.hover) waveR = 1.9 + Math.sin(t * 9) * 0.35
    if (wingL.current) wingL.current.rotation.z = -(0.08 + flapAngle)
    if (wingR.current) {
      const target = 0.08 + flapAngle + waveR
      wingR.current.rotation.z = damp(wingR.current.rotation.z, target, 14, dt)
    }

    // scarf tail swings a little
    if (tail.current) {
      tail.current.rotation.z = -0.22 + (reduceMotion ? 0 : Math.sin(t * 1.6) * 0.05) - st.yaw * 0.1 + st.hopV * 0.03
    }
  })

  return (
    <>
    <mesh ref={shadow} position={[0, -1.06, 0.05]} rotation={[-Math.PI / 2, 0, 0]} scale={[2.6, 1.5, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={shadowTex} transparent depthWrite={false} />
    </mesh>
    <group ref={root} dispose={null}>
      <group ref={bodyRef} position={[0, 0, 0]}>
        {/* body */}
        <mesh castShadow>
          <latheGeometry args={[profile, 48]} />
          <Clay color={C.body} />
        </mesh>

        {/* belly + feather marks */}
        <mesh position={[0, -0.14, 0.5]} scale={[0.56, 0.62, 0.36]}>
          <sphereGeometry args={[1, 40, 28]} />
          <Clay color={C.belly} />
        </mesh>
        {feathers.map(([x, y, z]) => (
          <mesh key={`${x}${y}`} position={[x, y, z]} rotation={[0, x * 0.9, Math.PI]}>
            <torusGeometry args={[0.065, 0.014, 8, 16, Math.PI]} />
            <Clay color={C.feather} />
          </mesh>
        ))}

        {/* wings, pivoting at the shoulder */}
        <group ref={wingL} position={[-0.74, 0.32, 0.02]}>
          <mesh position={[-0.04, -0.38, 0]} rotation={[0, 0, 0.1]} scale={[0.19, 0.5, 0.34]}>
            <sphereGeometry args={[1, 28, 20]} />
            <Clay color={C.face} />
          </mesh>
        </group>
        <group ref={wingR} position={[0.74, 0.32, 0.02]}>
          <mesh position={[0.04, -0.38, 0]} rotation={[0, 0, -0.1]} scale={[0.19, 0.5, 0.34]}>
            <sphereGeometry args={[1, 28, 20]} />
            <Clay color={C.face} />
          </mesh>
        </group>

        <Foot x={-0.3} />
        <Foot x={0.3} />

        {/* knitted scarf */}
        <mesh position={[0, 0.5, 0.02]} rotation={[Math.PI / 2 - 0.12, 0, 0]} scale={[1, 0.94, 1]}>
          <torusGeometry args={[0.6, 0.095, 16, 56]} />
          <Clay color={C.orange} />
        </mesh>
        {/* the knot and the hanging end, with two knitted stripes */}
        <mesh position={[0.26, 0.47, 0.56]} scale={[0.13, 0.11, 0.1]}>
          <sphereGeometry args={[1, 16, 12]} />
          <Clay color={C.orange} />
        </mesh>
        <group ref={tail} position={[0.3, 0.44, 0.6]} rotation={[0.25, 0, -0.22]}>
          <mesh position={[0, -0.36, 0]}>
            <boxGeometry args={[0.22, 0.7, 0.07]} />
            <Clay color={C.orange} />
          </mesh>
          {[-0.5, -0.6].map((y) => (
            <mesh key={y} position={[0, y, 0.037]}>
              <boxGeometry args={[0.225, 0.04, 0.008]} />
              <Clay color={C.stripe} />
            </mesh>
          ))}
          {[-0.075, -0.025, 0.025, 0.075].map((x) => (
            <mesh key={x} position={[x, -0.76, 0]}>
              <cylinderGeometry args={[0.014, 0.014, 0.1, 6]} />
              <Clay color={C.orange} />
            </mesh>
          ))}
        </group>
      </group>

      {/* head turns on its own, like an owl's */}
      <group ref={head} position={[0, 0.2, 0]}>
        <mesh castShadow position={[0, 0.8, 0]} scale={[1.04, 0.86, 0.94]}>
          <sphereGeometry args={[0.74, 48, 36]} />
          <Clay color={C.body} />
        </mesh>
        {/* ear tufts */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.46, 1.36, -0.02]} rotation={[0.05, 0, -side * 0.42]}>
            <coneGeometry args={[0.15, 0.42, 20]} />
            <Clay color={C.body} />
          </mesh>
        ))}
        <Eye x={-0.29} eyeRef={eyeL} pupilRef={pupilL} />
        <Eye x={0.29} eyeRef={eyeR} pupilRef={pupilR} />
        {/* beak */}
        <mesh position={[0, 0.8, 0.72]} rotation={[Math.PI - 0.55, 0, 0]}>
          <coneGeometry args={[0.075, 0.2, 16]} />
          <Clay color={C.orange} />
        </mesh>
      </group>
    </group>
    </>
  )
}
