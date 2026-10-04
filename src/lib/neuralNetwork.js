import * as THREE from 'three'

/**
 * Imperative Three.js neural-network scene.
 * Nodes are arranged in layers (like an MLP), connected by edges, with
 * "signal" pulses travelling forward. Neurons near the cursor fire.
 *
 *   const net = createNeuralNetwork({ theme: 'dark', compact: false })
 *   scene.add(net.group); net.update(r3fState, delta); net.dispose()
 */

const PALETTES = {
  dark: {
    from: '#5b7bff',
    to: '#ff7a1a',
    pulse: '#ffd29a',
    dust: '#8fa8ff',
    blending: THREE.AdditiveBlending,
    core: 0.55,
    nodeOpacity: 1,
    edgeOpacity: 0.2,
    dustOpacity: 0.55,
  },
  light: {
    from: '#1e3a8a',
    to: '#e8630a',
    pulse: '#ff7a1a',
    dust: '#1e3a8a',
    blending: THREE.NormalBlending,
    core: 0,
    nodeOpacity: 0.9,
    edgeOpacity: 0.16,
    dustOpacity: 0.3,
  },
}

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aAct;
  attribute vec3 aColor;
  uniform float uScale;
  varying vec3 vColor;
  varying float vAct;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uScale * (1.0 + aAct * 1.3) / -mv.z;
    vColor = aColor;
    vAct = aAct;
  }
`

const fragmentShader = /* glsl */ `
  uniform float uOpacity;
  uniform float uCore;
  varying vec3 vColor;
  varying float vAct;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float core = smoothstep(0.2, 0.0, d);
    float glow = smoothstep(0.5, 0.05, d) * (0.45 + vAct * 0.4);
    vec3 col = mix(vColor, vec3(1.0, 0.96, 0.9), core * uCore * (0.5 + vAct));
    gl_FragColor = vec4(col, (core + glow) * uOpacity);
  }
`

function mulberry32(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
const easeOut = (t) => 1 - Math.pow(1 - t, 3)

function makeMaterial(palette, opacity, dpr) {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: palette.blending,
    uniforms: {
      uScale: { value: dpr * 38 },
      uOpacity: { value: opacity },
      uCore: { value: palette.core },
    },
  })
}

export function createNeuralNetwork({ theme = 'dark', compact = false, dpr = 1 } = {}) {
  const palette = PALETTES[theme] ?? PALETTES.dark
  const rng = mulberry32(20240801)
  const layers = compact ? [4, 7, 9, 7, 4] : [5, 9, 12, 12, 9, 5]
  const spacingX = compact ? 1.9 : 2.3
  const pulseCount = compact ? 10 : 20
  const dustCount = compact ? 110 : 240

  const group = new THREE.Group()
  group.rotation.z = -0.1

  // ---------- Nodes ----------
  const nodes = []
  const layerStart = []
  const colorFrom = new THREE.Color(palette.from)
  const colorTo = new THREE.Color(palette.to)
  const tmpColor = new THREE.Color()

  layers.forEach((count, li) => {
    layerStart.push(nodes.length)
    const x = (li - (layers.length - 1) / 2) * spacingX
    const radius = (compact ? 0.62 : 0.72) * Math.sqrt(count)
    for (let i = 0; i < count; i++) {
      const r = radius * Math.sqrt((i + 0.5) / count)
      const theta = i * 2.39996 + li
      nodes.push({
        bx: x + (rng() - 0.5) * 0.5,
        by: r * Math.cos(theta),
        bz: r * Math.sin(theta),
        layer: li,
        phase: rng() * Math.PI * 2,
        speed: 0.35 + rng() * 0.5,
        size: 7 + rng() * 4,
      })
    }
  })

  const N = nodes.length
  const nodePos = new Float32Array(N * 3)
  const nodeSize = new Float32Array(N)
  const nodeAct = new Float32Array(N)
  const nodeColor = new Float32Array(N * 3)

  nodes.forEach((n, i) => {
    const f = n.layer / (layers.length - 1)
    tmpColor.copy(colorFrom).lerp(colorTo, f)
    tmpColor.offsetHSL((rng() - 0.5) * 0.04, 0, (rng() - 0.5) * 0.08)
    tmpColor.toArray(nodeColor, i * 3)
    nodePos[i * 3] = n.bx
    nodePos[i * 3 + 1] = n.by
    nodePos[i * 3 + 2] = n.bz
  })

  const nodeGeo = new THREE.BufferGeometry()
  nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3))
  nodeGeo.setAttribute('aSize', new THREE.BufferAttribute(nodeSize, 1))
  nodeGeo.setAttribute('aAct', new THREE.BufferAttribute(nodeAct, 1))
  nodeGeo.setAttribute('aColor', new THREE.BufferAttribute(nodeColor, 3))
  const nodeMat = makeMaterial(palette, palette.nodeOpacity, dpr)
  const nodePoints = new THREE.Points(nodeGeo, nodeMat)
  nodePoints.frustumCulled = false

  // ---------- Edges ----------
  const edges = []
  const outgoing = Array.from({ length: N }, () => [])
  for (let li = 0; li < layers.length - 1; li++) {
    const aStart = layerStart[li]
    const bStart = layerStart[li + 1]
    const bCount = layers[li + 1]
    const hasIncoming = new Array(bCount).fill(false)
    for (let a = aStart; a < aStart + layers[li]; a++) {
      const picks = new Set()
      const k = compact ? 2 : 3
      while (picks.size < Math.min(k, bCount)) picks.add(Math.floor(rng() * bCount))
      picks.forEach((bi) => {
        hasIncoming[bi] = true
        outgoing[a].push(edges.length)
        edges.push([a, bStart + bi])
      })
    }
    hasIncoming.forEach((ok, bi) => {
      if (ok) return
      const a = aStart + Math.floor(rng() * layers[li])
      outgoing[a].push(edges.length)
      edges.push([a, bStart + bi])
    })
  }

  const edgePos = new Float32Array(edges.length * 6)
  const edgeColor = new Float32Array(edges.length * 6)
  edges.forEach(([a, b], e) => {
    for (let c = 0; c < 3; c++) {
      edgeColor[e * 6 + c] = nodeColor[a * 3 + c]
      edgeColor[e * 6 + 3 + c] = nodeColor[b * 3 + c]
    }
  })
  const edgeGeo = new THREE.BufferGeometry()
  edgeGeo.setAttribute('position', new THREE.BufferAttribute(edgePos, 3))
  edgeGeo.setAttribute('color', new THREE.BufferAttribute(edgeColor, 3))
  const edgeMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: palette.blending,
  })
  const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat)
  edgeLines.frustumCulled = false

  // ---------- Pulses ----------
  const pulses = Array.from({ length: pulseCount }, () => ({ edge: -1, t: 0, speed: 1, wait: rng() * 3 }))
  const pulsePos = new Float32Array(pulseCount * 3)
  const pulseSize = new Float32Array(pulseCount)
  const pulseAct = new Float32Array(pulseCount)
  const pulseColor = new Float32Array(pulseCount * 3)
  const pc = new THREE.Color(palette.pulse)
  for (let i = 0; i < pulseCount; i++) pc.toArray(pulseColor, i * 3)
  const pulseGeo = new THREE.BufferGeometry()
  pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePos, 3))
  pulseGeo.setAttribute('aSize', new THREE.BufferAttribute(pulseSize, 1))
  pulseGeo.setAttribute('aAct', new THREE.BufferAttribute(pulseAct, 1))
  pulseGeo.setAttribute('aColor', new THREE.BufferAttribute(pulseColor, 3))
  const pulseMat = makeMaterial(palette, 1, dpr)
  const pulsePoints = new THREE.Points(pulseGeo, pulseMat)
  pulsePoints.frustumCulled = false

  // ---------- Dust ----------
  const dustPos = new Float32Array(dustCount * 3)
  const dustSize = new Float32Array(dustCount)
  const dustAct = new Float32Array(dustCount)
  const dustColor = new Float32Array(dustCount * 3)
  const dc = new THREE.Color(palette.dust)
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (rng() - 0.5) * 26
    dustPos[i * 3 + 1] = (rng() - 0.5) * 15
    dustPos[i * 3 + 2] = (rng() - 0.5) * 12 - 2
    dustSize[i] = 1.2 + rng() * 2.2
    dc.toArray(dustColor, i * 3)
  }
  const dustGeo = new THREE.BufferGeometry()
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3))
  dustGeo.setAttribute('aSize', new THREE.BufferAttribute(dustSize, 1))
  dustGeo.setAttribute('aAct', new THREE.BufferAttribute(dustAct, 1))
  dustGeo.setAttribute('aColor', new THREE.BufferAttribute(dustColor, 3))
  const dustMat = makeMaterial(palette, palette.dustOpacity, dpr)
  const dustPoints = new THREE.Points(dustGeo, dustMat)
  dustPoints.frustumCulled = false

  group.add(edgeLines, nodePoints, pulsePoints)
  const root = new THREE.Group()
  root.add(dustPoints, group)

  // ---------- Simulation ----------
  let time = 0
  const smoothPointer = new THREE.Vector2()
  const projected = new THREE.Vector3()
  const hoverRadius2 = 0.085 * 0.085

  function launchPulse(p, fromNode) {
    const options = outgoing[fromNode]
    if (!options.length) return false
    p.edge = options[Math.floor(Math.random() * options.length)]
    p.t = 0
    p.speed = 0.7 + Math.random() * 0.6
    nodeAct[fromNode] = Math.max(nodeAct[fromNode], 0.6)
    return true
  }

  function update(state, delta) {
    const dt = Math.min(delta, 0.05)
    time += dt

    // Smooth follow of the pointer for the rotation parallax
    smoothPointer.lerp(state.pointer, 1 - Math.exp(-dt * 3))
    group.rotation.y = Math.sin(time * 0.12) * 0.4 + smoothPointer.x * 0.45
    group.rotation.x = -smoothPointer.y * 0.25
    dustPoints.rotation.y = time * 0.015 + smoothPointer.x * 0.08
    dustPoints.rotation.x = -smoothPointer.y * 0.05

    // Intro: edges fade in, nodes pop in layer by layer
    edgeMat.opacity = palette.edgeOpacity * easeOut(Math.min(1, Math.max(0, (time - 0.4) / 1.4)))

    const decay = Math.exp(-dt * 2.4)
    for (let i = 0; i < N; i++) {
      const n = nodes[i]
      const s = n.speed * time + n.phase
      nodePos[i * 3] = n.bx + Math.sin(s) * 0.07
      nodePos[i * 3 + 1] = n.by + Math.cos(s * 0.8) * 0.12
      nodePos[i * 3 + 2] = n.bz + Math.sin(s * 0.6 + n.phase) * 0.12
      const intro = easeOut(Math.min(1, Math.max(0, (time - n.layer * 0.14) / 0.7)))
      nodeSize[i] = n.size * intro
      nodeAct[i] *= decay
    }

    // Neurons near the cursor fire and emit pulses
    group.updateMatrixWorld()
    const aspect = state.size.width / Math.max(1, state.size.height)
    for (let i = 0; i < N; i++) {
      projected.set(nodePos[i * 3], nodePos[i * 3 + 1], nodePos[i * 3 + 2])
      projected.applyMatrix4(group.matrixWorld).project(state.camera)
      const dx = (projected.x - state.pointer.x) * aspect
      const dy = projected.y - state.pointer.y
      if (dx * dx + dy * dy < hoverRadius2) {
        nodeAct[i] = 1
        if (Math.random() < dt * 4) {
          const idle = pulses.find((p) => p.edge === -1)
          if (idle) launchPulse(idle, i)
        }
      }
    }

    // Edges follow nodes
    for (let e = 0; e < edges.length; e++) {
      const [a, b] = edges[e]
      edgePos[e * 6] = nodePos[a * 3]
      edgePos[e * 6 + 1] = nodePos[a * 3 + 1]
      edgePos[e * 6 + 2] = nodePos[a * 3 + 2]
      edgePos[e * 6 + 3] = nodePos[b * 3]
      edgePos[e * 6 + 4] = nodePos[b * 3 + 1]
      edgePos[e * 6 + 5] = nodePos[b * 3 + 2]
    }

    // Pulses travel forward through the network
    for (let i = 0; i < pulseCount; i++) {
      const p = pulses[i]
      if (p.edge === -1) {
        pulseSize[i] = 0
        p.wait -= dt
        if (p.wait <= 0 && time > 1.6) {
          const start = Math.floor(Math.random() * layers[0])
          if (!launchPulse(p, start)) p.wait = 0.5
        }
        continue
      }
      p.t += dt * p.speed
      if (p.t >= 1) {
        const arrived = edges[p.edge][1]
        nodeAct[arrived] = 1
        if (!launchPulse(p, arrived)) {
          p.edge = -1
          p.wait = 0.4 + Math.random() * 2.2
          pulseSize[i] = 0
          continue
        }
      }
      const [a2, b2] = edges[p.edge]
      const k = easeInOut(Math.min(1, p.t))
      for (let c = 0; c < 3; c++) {
        pulsePos[i * 3 + c] = nodePos[a2 * 3 + c] + (nodePos[b2 * 3 + c] - nodePos[a2 * 3 + c]) * k
      }
      pulseSize[i] = 6.5
      pulseAct[i] = 0.4
    }

    nodeGeo.attributes.position.needsUpdate = true
    nodeGeo.attributes.aSize.needsUpdate = true
    nodeGeo.attributes.aAct.needsUpdate = true
    edgeGeo.attributes.position.needsUpdate = true
    pulseGeo.attributes.position.needsUpdate = true
    pulseGeo.attributes.aSize.needsUpdate = true
    pulseGeo.attributes.aAct.needsUpdate = true
  }

  function dispose() {
    ;[nodeGeo, edgeGeo, pulseGeo, dustGeo, nodeMat, edgeMat, pulseMat, dustMat].forEach((o) => o.dispose())
  }

  return { group: root, update, dispose }
}
