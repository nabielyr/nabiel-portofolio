import { memo, useEffect, useRef } from 'react'
import styles from './SplitFlap.module.css'

const CHARSET = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@:.-&/'"
const STEP_MS = 42

const indexOf = (ch) => {
  const i = CHARSET.indexOf(ch)
  return i === -1 ? 0 : i
}

/**
 * One tile of a split-flap board. It walks through the character drum until it
 * reaches its target, flipping the upper leaf on every step. The DOM is updated
 * directly - a full board is a hundred-plus tiles, none of them re-render React.
 */
const Tile = memo(function Tile({ target, delay, instant }) {
  const charRef = useRef(null)
  const leafRef = useRef(null)
  const leafCharRef = useRef(null)
  const current = useRef(' ')

  useEffect(() => {
    const want = CHARSET.includes(target) ? target : ' '
    if (instant) {
      current.current = want
      charRef.current.textContent = want
      return undefined
    }
    let timer = 0
    const step = () => {
      if (current.current === want) return
      const prev = current.current
      const next = CHARSET[(indexOf(prev) + 1) % CHARSET.length]
      current.current = next
      charRef.current.textContent = next
      leafCharRef.current.textContent = prev
      leafRef.current.animate?.([{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(-90deg)' }], {
        duration: STEP_MS + 8,
        easing: 'ease-in',
      })
      timer = setTimeout(step, STEP_MS)
    }
    timer = setTimeout(step, delay)
    return () => clearTimeout(timer)
  }, [target, delay, instant])

  return (
    <span className={styles.tile}>
      <span ref={charRef} className={styles.char}>
        {' '}
      </span>
      <span ref={leafRef} className={styles.leaf} aria-hidden="true">
        <span ref={leafCharRef} className={styles.leafChar} />
      </span>
    </span>
  )
})

function Row({ label, text, length, instant, rowIndex }) {
  const padded = text.toUpperCase().slice(0, length).padEnd(length, ' ')
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <span className={styles.tiles} aria-label={text}>
        {[...padded].map((ch, i) => (
          <Tile key={i} target={ch} delay={rowIndex * 90 + i * 22} instant={instant} />
        ))}
      </span>
    </div>
  )
}

/** A small departure board: label on the left, flipping tiles on the right. */
export default function SplitFlap({ rows, length = 28, instant = false }) {
  return (
    <div className={styles.board} role="list">
      {rows.map((row, i) => (
        <div key={row.id} role="listitem">
          <Row label={row.label} text={row.text} length={length} instant={instant} rowIndex={i} />
        </div>
      ))}
    </div>
  )
}
