import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import Owl from './Owl'
import Books from './Books'
import styles from './OwlCanvas.module.css'

const DPR = [1, 1.75]
// Light-weight scene; the integrated GPU is plenty and avoids an adapter switch
const GL = { antialias: true, alpha: true, powerPreference: 'default' }
// The hero scene sits a little left of centre, closer to the name
const CAMERA = { position: [0.5, 0.15, 7.4], fov: 30 }

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

function OwlCanvas({ pose = 'hero', onHoot, reduceMotion = false, className = '' }) {
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

  const onCreated = useCallback(({ gl, scene, camera }) => {
    camera.lookAt(0.5, -0.05, 0)
    Promise.resolve(gl.compileAsync?.(scene, camera))
      .catch(() => {})
      .then(() => setWarm(true))
  }, [])

  const setHover = (v) => {
    owl.current?.setHover(v)
    // tell the custom cursor this is clickable
    if (wrap.current) wrap.current.toggleAttribute('data-cursor', v)
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
        aria-hidden="true"
      >
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
