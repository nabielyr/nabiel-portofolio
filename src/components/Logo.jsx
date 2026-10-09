/** Wordmark: the name in the condensed display face, nothing else. */
export default function Logo({ size = 30 }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 900,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: '0.01em',
        textTransform: 'uppercase',
        color: 'var(--ink)',
      }}
    >
      Nabiel
    </span>
  )
}
