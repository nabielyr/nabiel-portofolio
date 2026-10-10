import styles from './Logo.module.css'

/** MNY monogram in the display face, closed with the same orange square as the hero name. */
export default function Logo({ size = 30 }) {
  return (
    <span className={styles.logo} style={{ fontSize: size }} aria-hidden="true">
      MNY<span className={styles.dot} />
    </span>
  )
}
