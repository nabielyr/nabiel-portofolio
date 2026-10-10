import styles from './Logo.module.css'

/**
 * The mark: Hoo's face. The ear tufts draw an M, and the orange scarf is the
 * same one the 3D owl wears. It blinks when you point at it.
 */
export default function Logo({ size = 34 }) {
  return (
    <svg className={styles.logo} width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path
        className={styles.head}
        d="M8.2 3.6Q9.2 3.1 10.1 3.8L22.4 12.6Q24 13.6 25.6 12.6L37.9 3.8Q38.8 3.1 39.8 3.6Q44 11 44.6 20Q45.4 31 41 38.5Q35 47 24 47Q13 47 7 38.5Q2.6 31 3.4 20Q4 11 8.2 3.6Z"
      />
      <path
        className={styles.face}
        d="M24 17.5Q30 13.2 36.2 15.8Q42.4 19.6 41 27.6Q39.2 34.6 31.8 34.4Q27 34 24 31Q21 34 16.2 34.4Q8.8 34.6 7 27.6Q5.6 19.6 11.8 15.8Q18 13.2 24 17.5Z"
      />
      <g className={styles.eyes}>
        <circle className={styles.white} cx="16" cy="24.6" r="6.6" />
        <circle className={styles.white} cx="32" cy="24.6" r="6.6" />
        <circle className={styles.pupil} cx="16.9" cy="24.2" r="3" />
        <circle className={styles.pupil} cx="32.9" cy="24.2" r="3" />
      </g>
      <path className={styles.orange} d="M21.9 29.2Q24 28.2 26.1 29.2L24.5 33.4Q24 34.3 23.5 33.4Z" />
      <path className={styles.orange} d="M5.6 35.2Q24 41.6 42.4 35.2L41 39.6Q24 45.8 7 39.6Z" />
      <path className={styles.orange} d="M31.6 40.6L36.4 39.2L38.6 46.6L33.8 47.6Z" />
      <path className={styles.white} d="M32.5 43.4L37.3 42.1L37.6 43.2L32.8 44.5Z" />
    </svg>
  )
}
