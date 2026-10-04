import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useIsTouch } from '../hooks/useMediaQuery'
import styles from './Button.module.css'

const spring = { stiffness: 220, damping: 18, mass: 0.5 }

/**
 * Magnetic button / link. Pulls toward the cursor and the label
 * moves a little further for a layered, "alive" feel.
 */
export default function Button({
  children,
  href,
  onClick,
  variant = 'primary',
  size = 'md',
  icon,
  strength = 0.35,
  className = '',
  external = false,
  ...rest
}) {
  const ref = useRef(null)
  const isTouch = useIsTouch()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, spring)
  const sy = useSpring(y, spring)
  const innerX = useTransform(sx, (v) => v * 0.45)
  const innerY = useTransform(sy, (v) => v * 0.45)

  const handleMove = (e) => {
    if (isTouch || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    x.set((e.clientX - (rect.left + rect.width / 2)) * strength)
    y.set((e.clientY - (rect.top + rect.height / 2)) * strength)
  }
  const reset = () => {
    x.set(0)
    y.set(0)
  }

  const Comp = href ? motion.a : motion.button
  const linkProps = href
    ? { href, ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}) }
    : { type: 'button' }

  return (
    <Comp
      ref={ref}
      className={`${styles.btn} ${styles[variant]} ${styles[size]} ${className}`}
      style={{ x: sx, y: sy }}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      {...linkProps}
      {...rest}
    >
      <motion.span className={styles.inner} style={{ x: innerX, y: innerY }}>
        <span className={styles.label}>{children}</span>
        {icon && <span className={styles.icon}>{icon}</span>}
      </motion.span>
    </Comp>
  )
}
