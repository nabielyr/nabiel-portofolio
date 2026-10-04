import { motion } from 'framer-motion'

const MotionTags = { div: motion.div, li: motion.li, p: motion.p, span: motion.span, article: motion.article }

/** Fade-and-rise when scrolled into view (once). */
export default function Reveal({ as = 'div', delay = 0, y = 32, children, className, ...rest }) {
  const Tag = MotionTags[as] ?? motion.div
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
