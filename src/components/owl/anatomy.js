// Head sphere and eye placement (head-group space). The facial disc texture
// is painted around wherever these put the eyes. Plain maths, no three.js, so
// the texture worker can use it too.
export const HEAD = { y: 0.8, r: 0.74, scale: [1.04, 0.86, 0.94] }

// The eyes are flattened domes set into the face (depth < 1), turned out a
// little to follow its curve; `turn` is undone when they look ahead, so both
// eyes always aim at the same point.
export const EYE = { x: 0.27, y: 1.0, z: 0.575, r: 0.19, depth: 0.55, turn: 0.3 }

/** Where an eye centre lands on the head sphere's UV map (0..1) */
export function eyeUV(side) {
  const [sx, sy, sz] = HEAD.scale
  let x = (side * EYE.x) / sx
  let y = (EYE.y - HEAD.y) / sy
  let z = EYE.z / sz
  const len = Math.hypot(x, y, z)
  x /= len
  y /= len
  z /= len
  const theta = Math.acos(y)
  let phi = Math.atan2(z, -x)
  if (phi < 0) phi += Math.PI * 2
  return [phi / (Math.PI * 2), theta / Math.PI]
}
