import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowUpRight, FiCheck, FiCopy, FiGithub, FiLinkedin, FiMail, FiClock } from 'react-icons/fi'
import { SiLinktree } from 'react-icons/si'
import { useLanguage } from '../context/contexts'
import { profile } from '../data/profile'
import SectionHeading from '../components/SectionHeading'
import Button from '../components/Button'
import Reveal from '../components/Reveal'
import styles from './Contact.module.css'

const ICONS = {
  email: FiMail,
  linkedin: FiLinkedin,
  github: FiGithub,
  linktree: SiLinktree,
}

function LiveClock({ label }) {
  const [time, setTime] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const formatted = now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
      setTime(formatted)
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className={styles.clockWrap}>
      <FiClock className={styles.clockIcon} />
      <span>{label}: </span>
      <span className={styles.clockTime}>{time} (WIB)</span>
    </div>
  )
}

export default function Contact() {
  const { t, lang } = useLanguage()
  const [copied, setCopied] = useState(false)

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2400)
    } catch {
      // fallback if clipboard not available
      window.location.href = `mailto:${profile.email}`
    }
  }

  return (
    <section id="contact" className="section">
      <div className="container">
        <SectionHeading
          index={6}
          eyebrow={t('contact.eyebrow')}
          title={t('contact.title')}
          accent={t('contact.titleAccent')}
          align="center"
          key={lang}
        >
          <p className={styles.lead}>{t('contact.subtitle')}</p>
        </SectionHeading>

        <Reveal className={styles.card}>
          <div className={styles.ctaBox}>
            <span className={styles.statusPill}>
              <span className={styles.statusDot} />
              Open for opportunities
            </span>
            <h3 className={styles.ctaHeading}>
              Have an idea or looking for an AI/ML enthusiast?
            </h3>

            {/* Email quick copy */}
            <div className={styles.emailRow}>
              <button
                id="copy-email-btn"
                className={styles.emailPill}
                onClick={copyEmail}
                aria-label={t('contact.copy')}
              >
                <span className={styles.emailText}>{profile.email}</span>
                <span className={styles.copyIcon}>
                  {copied ? <FiCheck className={styles.checkIcon} /> : <FiCopy />}
                </span>
              </button>

              <Button
                id="send-mail-btn"
                href={`mailto:${profile.email}`}
                variant="primary"
                icon={<FiArrowUpRight />}
              >
                Say Hello
              </Button>
            </div>

            {/* Toast feedback */}
            <AnimatePresence>
              {copied && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={styles.toast}
                  role="status"
                >
                  <FiCheck /> {t('contact.copied')}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Social cards */}
          <div className={styles.socialsGrid}>
            {profile.socials.map((soc) => {
              const Icon = ICONS[soc.id] || FiMail
              const isEmail = soc.id === 'email'
              return (
                <motion.a
                  key={soc.id}
                  id={`social-${soc.id}`}
                  href={soc.url}
                  target={isEmail ? undefined : '_blank'}
                  rel="noopener noreferrer"
                  className={styles.socialCard}
                  whileHover={{ y: -4 }}
                >
                  <div className={styles.socialIcon}>
                    <Icon />
                  </div>
                  <div className={styles.socialInfo}>
                    <span className={styles.socialLabel}>{soc.label}</span>
                    <span className={styles.socialHandle}>{soc.handle}</span>
                  </div>
                  <FiArrowUpRight className={styles.socialArrow} />
                </motion.a>
              )
            })}
          </div>

          <div className={styles.cardFooter}>
            <LiveClock label={t('contact.localTime')} />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
