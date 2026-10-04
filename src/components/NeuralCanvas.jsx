import { useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { createNeuralNetwork } from '../lib/neuralNetwork'

function Network({ theme, compact }) {
  const dpr = useThree((s) => s.viewport.dpr)
  const net = useMemo(() => createNeuralNetwork({ theme, compact, dpr }), [theme, compact, dpr])

  useEffect(() => () => net.dispose(), [net])
  useFrame((state, delta) => net.update(state, delta))

  return <primitive object={net.group} />
}

/**
 * Lazy-loaded hero background. `eventSource` lets the whole hero section
 * (not only the canvas) drive the pointer, so text can sit on top.
 */
export default function NeuralCanvas({ theme, compact, active, eventSource }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, compact ? 13 : 12], fov: 45 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      frameloop={active ? 'always' : 'never'}
      eventSource={eventSource}
      eventPrefix="client"
      style={{ position: 'absolute', inset: 0 }}
      aria-hidden="true"
    >
      <Network theme={theme} compact={compact} />
    </Canvas>
  )
}
