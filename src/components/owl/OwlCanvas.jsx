import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import Owl from './Owl'
import Books from './Books'
import styles from './OwlCanvas.module.css'

const DPR = [1, 1.75]
// Light-weight scene; the integrated GPU is plenty and avoids an adapter switch
const GL = { antialias: true, alpha: true, powerPreference: 'default' }
const FOV = 30
const CAMERA = { position: [0, 0, 8], fov: FOV }

// Scene extents in world units: bottom of the book stack, tips of the ear tufts
const SCENE_BOTTOM = -1.8
const SCENE_HEIGHT = 3.65

// Adaptive resolution: full DPR by default, 1x only if the GPU can't keep up
const PERF_WINDOW = 2
const PERF_GRACE = 1.5
const MIN_FPS = 45

function AdaptiveDpr() {
  const perf = useRef({ elapsed: 0, frames: 0, time: 0, done: false })
  useFrame((state, delta) => {
    const p = perf.current
    if (p.done || state.viewport.dpr <= 1 || delta > 0.25) return
    p.elapsed += delta
    if (p.elapsed < PERF_GRACE) return
    p.frames += 1
    p.time += delta
    if (p.time < PERF_WINDOW) return
    if (p.frames / p.time < MIN_FPS) {
      state.setDpr(1)
      p.done = true
    }
    p.frames = 0
    p.time = 0
  })
  return null
}

/**
 * Keeps the owl the same size on screen whatever the canvas size is.
 * - "stage": a tall canvas; the scene sits at the bottom at `unitPx` pixels per
 *   world unit, leaving open sky above for the landing and the hops
 * - "fit": the whole scene fits the canvas (small layouts)
 */
function Framing({ mode, unitPx }) {
  const size = useThree((s) => s.size)
  const camera = useThree((s) => s.camera)
  useLayoutEffect(() => {
    const tan = Math.tan(((FOV / 2) * Math.PI) / 180)
    let px
    let targetY
    if (mode === 'fit') {
      px = size.height / (SCENE_HEIGHT + 0.5)
      targetY = SCENE_BOTTOM + SCENE_HEIGHT / 2
    } else {
      // never let the scene outgrow a short window
      px = Math.min(unitPx, (size.height - 40) / (SCENE_HEIGHT + 0.6))
      const halfH = size.height / (2 * px)
      // extra room at the bottom: the front of the books sits closer to the camera
      targetY = SCENE_BOTTOM - 0.4 + halfH
    }
    const distance = size.height / (2 * tan * px)
    camera.position.set(0, targetY + 0.15, distance)
    camera.lookAt(0, targetY, 0)
    camera.updateProjectionMatrix()
  }, [size, camera, mode, unitPx])
  return null
}

/** Window-level pointer, so the owl can watch the cursor anywhere on the page */
function usePointer() {
  const pointer = useRef({ x: 0, y: 0, lastMove: -Infinity })
  useEffect(() => {
    const onMove = (e) => {
      const p = pointer.current
      p.x = e.clientX
      p.y = e.clientY
      p.lastMove = performance.now()
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])
  return pointer
}

function OwlCanvas({ pose = 'hero', onHoot, reduceMotion = false, eventSource, framing = 'fit', unitPx = 160, className = '' }) {
  const wrap = useRef(null)
  const owl = useRef(null)
  const pointer = usePointer()
  const [warm, setWarm] = useState(false)
  const [inView, setInView] = useState(true)

  // Pause rendering while the owl is off screen
  useEffect(() => {
    const el = wrap.current
    if (!el) return undefined
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: '100px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const onCreated = useCallback(({ gl, scene, camera, setEvents }) => {
    // Pointer events come from the hero section; map them using where the canvas
    // actually is on screen (R3F's default assumes the canvas starts at 0,0).
    setEvents({
      compute(event, state) {
        const rect = state.gl.domElement.getBoundingClientRect()
        state.pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
        state.raycaster.setFromCamera(state.pointer, state.camera)
      },
    })
    Promise.resolve(gl.compileAsync?.(scene, camera))
      .catch(() => {})
      .then(() => setWarm(true))
  }, [])

  const setHover = (v) => {
    owl.current?.setHover(v)
    // tell the custom cursor this is clickable (the canvas itself ignores the pointer)
    const target = eventSource ?? wrap.current
    target?.toggleAttribute('data-cursor', v)
  }

  let frameloop = 'never'
  if (warm) frameloop = reduceMotion ? 'demand' : inView ? 'always' : 'never'

  return (
    <div ref={wrap} className={`${styles.stage} ${warm ? styles.ready : ''} ${className}`}>
      <Canvas
        dpr={DPR}
        gl={GL}
        camera={CAMERA}
        frameloop={frameloop}
        onCreated={onCreated}
        eventSource={eventSource}
        eventPrefix={eventSource ? 'client' : 'offset'}
        style={eventSource ? { pointerEvents: 'none' } : undefined}
        aria-hidden="true"
      >
        <Framing mode={framing} unitPx={unitPx} />
        <hemisphereLight args={['#fff6e8', '#1b2a4d', 1.15]} />
        <directionalLight position={[-3, 5, 4]} intensity={2.1} color="#fff1dc" />
        {/* cool rim light keeps the navy silhouette readable on dark paper */}
        <directionalLight position={[3.5, 2.5, -3]} intensity={2.2} color="#d6e1ff" />
        {pose === 'hero' && <Books top={-1.04} />}
        <group
          onClick={(e) => {
            e.stopPropagation()
            owl.current?.hop()
            onHoot?.()
          }}
          onDoubleClick={(e) => {
            e.stopPropagation()
            owl.current?.spin()
          }}
          onPointerOver={() => setHover(true)}
          onPointerOut={() => setHover(false)}
        >
          <Owl ref={owl} pose={pose} pointer={pointer} reduceMotion={reduceMotion} />
        </group>
        <AdaptiveDpr />
      </Canvas>
    </div>
  )
}

export default memo(OwlCanvas)
