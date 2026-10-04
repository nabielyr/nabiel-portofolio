import { useEffect, useState } from 'react'
import styles from './RotatingText.module.css'

/** Typewriter that cycles through `words`: type → hold → delete → next. */
export default function RotatingText({ words, typeSpeed = 55, deleteSpeed = 28, hold = 1700, start = true }) {
  const [index, setIndex] = useState(0)
  const [text, setText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!start || !words.length) return undefined
    const current = words[index % words.length]
    let delay = deleting ? deleteSpeed : typeSpeed

    if (!deleting && text === current) delay = hold
    if (deleting && text === '') delay = 300

    const timer = setTimeout(() => {
      if (!deleting && text === current) {
        setDeleting(true)
      } else if (deleting && text === '') {
        setDeleting(false)
        setIndex((i) => (i + 1) % words.length)
      } else {
        setText(deleting ? current.slice(0, text.length - 1) : current.slice(0, text.length + 1))
      }
    }, delay)
    return () => clearTimeout(timer)
  }, [text, deleting, index, words, typeSpeed, deleteSpeed, hold, start])

  return (
    <span className={styles.wrap} aria-label={words.join(', ')}>
      <span aria-hidden="true" className={styles.text}>
        {text}
      </span>
      <span aria-hidden="true" className={styles.caret} />
    </span>
  )
}
