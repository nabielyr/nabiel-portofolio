import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { createNeuralNetwork } from '../lib/neuralNetwork'
import { markSceneReady } from '../lib/sceneReady'

const DPR = [1, 1.75]
// A few hundred points and lines don't need the discrete GPU; asking for it can
// stall while a dual-GPU laptop switches adapters.
const GL = { antialias: true, alpha: true, powerPreference: 'default' }
const STYLE = { position: 'absolute', inset: 0 }

// Adaptive resolution: full DPR by default, 1x only if the GPU can't keep up
const PERF_WINDOW = 2 // seconds of frames averaged per check
const PERF_GRACE = 1.5 // ignore the first frames (warm-up, intro work)
const MIN_FPS = 45

function Network({ theme, compact }) {
  const dpr = useThree((s) => s.viewport.dpr)
  const net = useMemo(() => createNeuralNetwork({ theme, compact }), [theme, compact])
  const perf = useRef({ elapsed: 0, frames: 0, time: 0, done: false })

  useEffect(() => () => net.dispose(), [net])
  useEffect(() => net.setPixelRatio(dpr), [net, dpr])

  useFrame((state, delta) => {
    net.update(state, delta)

    const p = perf.current
    if (p.done || state.viewport.dpr <= 1 || delta > 0.25) return // nothing to lower / skip paused gaps
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

  return <primitive object={net.group} />
}

/**
 * Lazy-loaded hero background. `eventSource` lets the whole hero section
 * (not only the canvas) drive the pointer, so text can sit on top.
 *
 * Shaders are compiled asynchronously before the first frame is drawn, and
 * the Preloader is told once the scene is up so it can start its count.
 */
function NeuralCanvas({ theme, compact, active, eventSource }) {
  const [warm, setWarm] = useState(false)
  const camera = useMemo(() => ({ position: [0, 0, compact ? 13 : 12], fov: 45 }), [compact])

  const onCreated = useCallback(({ gl, scene, camera: cam }) => {
    Promise.resolve(gl.compileAsync?.(scene, cam))
      .catch(() => {})
      .then(() => setWarm(true))
  }, [])

  // Signal after the first frames have actually been drawn
  useEffect(() => {
    if (!warm) return undefined
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(markSceneReady)
    })
    return () => cancelAnimationFrame(raf)
  }, [warm])

  return (
    <Canvas
      dpr={DPR}
      camera={camera}
      gl={GL}
      frameloop={active && warm ? 'always' : 'never'}
      onCreated={onCreated}
      eventSource={eventSource}
      eventPrefix="client"
      style={STYLE}
      aria-hidden="true"
    >
      <Network theme={theme} compact={compact} />
    </Canvas>
  )
}

export default memo(NeuralCanvas)
