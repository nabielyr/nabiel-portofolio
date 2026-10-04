import { useMemo } from 'react'

function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function rng(seed) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const W = 400
const H = 250

function NetworkArt({ seed }) {
  const r = rng(seed)
  const layers = [3, 5, 5, 2]
  const nodes = layers.map((count, li) =>
    Array.from({ length: count }, (_, i) => ({
      x: 70 + li * 87,
      y: H / 2 + (i - (count - 1) / 2) * 38 + (r() - 0.5) * 10,
    })),
  )
  const edges = []
  for (let li = 0; li < layers.length - 1; li++) {
    nodes[li].forEach((a) => nodes[li + 1].forEach((b) => r() > 0.35 && edges.push([a, b])))
  }
  return (
    <g>
      {edges.map(([a, b], i) => (
        <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--cover-line)" strokeWidth="1" />
      ))}
      {nodes.flat().map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={r() > 0.7 ? 7 : 5} fill={r() > 0.6 ? 'var(--cover-accent)' : 'var(--cover-fg)'} />
      ))}
    </g>
  )
}

function DataArt({ seed }) {
  const r = rng(seed)
  const bars = Array.from({ length: 9 }, (_, i) => ({ x: 48 + i * 36, h: 30 + r() * 120 }))
  const pts = Array.from({ length: 22 }, () => ({ x: 40 + r() * 320, y: 40 + r() * 150 }))
  let d = ''
  for (let i = 0; i <= 10; i++) {
    const x = 40 + i * 32
    const y = 190 - i * 12 - Math.sin(i * 0.9) * 14 - r() * 8
    d += `${i ? 'L' : 'M'}${x},${y}`
  }
  return (
    <g>
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={210 - b.h} width="20" height={b.h} rx="4" fill="var(--cover-line)" />
      ))}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--cover-fg)" opacity="0.7" />
      ))}
      <path d={d} fill="none" stroke="var(--cover-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}

function WebArt({ seed }) {
  const r = rng(seed)
  const cols = 2 + Math.floor(r() * 2)
  return (
    <g>
      <rect x="60" y="40" width="280" height="175" rx="12" fill="none" stroke="var(--cover-fg)" strokeOpacity="0.5" />
      <line x1="60" y1="64" x2="340" y2="64" stroke="var(--cover-fg)" strokeOpacity="0.3" />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={76 + i * 13} cy="52" r="4" fill={i === 0 ? 'var(--cover-accent)' : 'var(--cover-line)'} />
      ))}
      <rect x="80" y="82" width={120 + r() * 60} height="14" rx="7" fill="var(--cover-accent)" />
      <rect x="80" y="104" width={160 + r() * 60} height="8" rx="4" fill="var(--cover-line)" />
      {Array.from({ length: cols }, (_, i) => (
        <rect
          key={i}
          x={80 + i * (240 / cols)}
          y="128"
          width={240 / cols - 12}
          height="68"
          rx="8"
          fill="var(--cover-line)"
        />
      ))}
    </g>
  )
}

function FunArt({ seed }) {
  const r = rng(seed)
  const blobs = Array.from({ length: 6 }, () => ({ x: 40 + r() * 320, y: 30 + r() * 190, s: 14 + r() * 40 }))
  return (
    <g>
      {blobs.map((b, i) => (
        <circle key={i} cx={b.x} cy={b.y} r={b.s} fill={i % 2 ? 'var(--cover-accent)' : 'var(--cover-line)'} opacity={i % 2 ? 0.85 : 1} />
      ))}
      <path
        d={`M30,${150 + r() * 30} C110,${60 + r() * 40} 190,${220 - r() * 40} 260,${120 + r() * 20} S350,${90 + r() * 30} 380,${130}`}
        fill="none"
        stroke="var(--cover-fg)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="2 10"
      />
    </g>
  )
}

const ART = { 'ai-ml': NetworkArt, 'data-science': DataArt, 'web-dev': WebArt, fun: FunArt }

/** Deterministic generative artwork used when a project has no image. */
export default function ProjectCover({ seed, category, className }) {
  const Art = ART[category] ?? NetworkArt
  const numericSeed = useMemo(() => hash(seed), [seed])

  return (
    <svg
      className={className}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-hidden="true"
    >
      <defs>
        <pattern id={`grid-${seed}`} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="var(--cover-grid)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill={`url(#grid-${seed})`} />
      <Art seed={numericSeed} />
    </svg>
  )
}
