import { useEffect, useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { makeShadowTexture } from './textures'

/*
 * A slightly messy stack of three books for the owl to land on - it's a
 * student's desk, after all. Spines face the camera, pages show on the side.
 */

const BOOKS = [
  // bottom to top: size [w, h, d], cover colour, spine band, twist
  { size: [1.95, 0.3, 1.32], cover: '#2c4373', band: '#e8641b', twist: 0.04, x: 0 },
  { size: [1.78, 0.24, 1.2], cover: '#e8641b', band: '#f4efe6', twist: -0.1, x: 0.06 },
  { size: [1.62, 0.22, 1.12], cover: '#efe5d2', band: '#1d2f57', twist: 0.07, x: -0.04 },
]

const BOOKS_HEIGHT = BOOKS.reduce((h, b) => h + b.size[1], 0)
// centre of each book, measured up from the bottom of the stack
const CENTERS = BOOKS.map((b, i) => BOOKS.slice(0, i).reduce((h, p) => h + p.size[1], 0) + b.size[1] / 2)

export default function Books({ top = -1.06 }) {
  const mats = useMemo(() => {
    const cover = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0 })
    return {
      covers: BOOKS.map((b) => cover(b.cover)),
      bands: BOOKS.map((b) => cover(b.band)),
      pages: new THREE.MeshStandardMaterial({ color: '#f7f1e4', roughness: 0.95 }),
      shadow: new THREE.MeshBasicMaterial({ map: makeShadowTexture(0.42), transparent: true, depthWrite: false }),
    }
  }, [])

  useEffect(
    () => () => {
      mats.covers.forEach((m) => m.dispose())
      mats.bands.forEach((m) => m.dispose())
      mats.pages.dispose()
      mats.shadow.map.dispose()
      mats.shadow.dispose()
    },
    [mats],
  )

  const bottom = top - BOOKS_HEIGHT
  return (
    <group>
      {/* the stack's shadow on the desk */}
      <mesh material={mats.shadow} position={[0, bottom + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[2.7, 1.9, 1]}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      {BOOKS.map((b, i) => {
        const [w, h, d] = b.size
        const cy = bottom + CENTERS[i]
        return (
          <group key={i} position={[b.x, cy, 0]} rotation={[0, b.twist, 0]}>
            {/* hard covers top and bottom, and the spine facing us */}
            <RoundedBox args={[w, 0.04, d]} radius={0.015} smoothness={2} position={[0, h / 2 - 0.02, 0]} material={mats.covers[i]} />
            <RoundedBox args={[w, 0.04, d]} radius={0.015} smoothness={2} position={[0, -h / 2 + 0.02, 0]} material={mats.covers[i]} />
            <RoundedBox args={[w, h, 0.06]} radius={0.025} smoothness={3} position={[0, 0, d / 2 - 0.03]} material={mats.covers[i]} />
            {/* the page block, set back a little from the cover edges */}
            <mesh material={mats.pages} position={[-0.01, 0, -0.02]}>
              <boxGeometry args={[w - 0.07, h - 0.07, d - 0.08]} />
            </mesh>
            {/* bands on the spine */}
            <mesh material={mats.bands[i]} position={[-w * 0.28, 0, d / 2 + 0.002]}>
              <boxGeometry args={[0.12, h * 0.8, 0.01]} />
            </mesh>
            <mesh material={mats.bands[i]} position={[-w * 0.28 + 0.18, 0, d / 2 + 0.002]}>
              <boxGeometry args={[0.04, h * 0.8, 0.01]} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
