import * as THREE from 'three'

/** Soft round shadow from a tiny gradient texture: drawn once, costs nothing per frame */
export function makeShadowTexture(strength = 0.5) {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, `rgba(19, 33, 63, ${strength})`)
  g.addColorStop(0.45, `rgba(19, 33, 63, ${strength * 0.4})`)
  g.addColorStop(1, 'rgba(19, 33, 63, 0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
