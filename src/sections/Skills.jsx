import { motion } from 'framer-motion'
import { useLanguage } from '../context/contexts'
import { skillGroups, marqueeItems } from '../data/skills'
import SectionHeading from '../components/SectionHeading'
import Marquee from '../components/Marquee'
import Reveal from '../components/Reveal'
import styles from './Skills.module.css'

function LossVisual({ labelLoss, labelEpoch }) {
  return (
    <div className={styles.visualLoss} aria-hidden="true">
      <div className={styles.lossHeader}>
        <span>{labelLoss}</span>
        <span className={styles.lossVal}>0.0412</span>
      </div>
      <svg viewBox="0 0 160 50" className={styles.lossSvg}>
        <path
          d="M 5,5 Q 35,42 80,44 T 155,46"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="155" cy="46" r="3.5" fill="var(--amber-400)" />
      </svg>
      <div className={styles.lossFooter}>
        <span>{labelEpoch} 0</span>
        <span>{labelEpoch} 100</span>
      </div>
    </div>
  )
}

function GitVisual() {
  return (
    <div className={styles.visualGit} aria-hidden="true">
      <svg viewBox="0 0 140 40" className={styles.gitSvg}>
        <path d="M 10,28 L 130,28" stroke="var(--border-strong)" strokeWidth="2" strokeDasharray="3 3" />
        <path d="M 20,28 C 45,28 50,10 75,10 L 110,10 C 120,10 125,28 130,28" fill="none" stroke="var(--secondary)" strokeWidth="2" />
        <circle cx="20" cy="28" r="4" fill="var(--secondary)" />
        <circle cx="75" cy="10" r="4" fill="var(--accent)" />
        <circle cx="130" cy="28" r="4" fill="var(--secondary)" />
      </svg>
    </div>
  )
}

export default function Skills() {
  const { t, pick, lang } = useLanguage()

  return (
    <section id="skills" className="section">
      <div className={styles.marqueeWrap}>
        <Marquee items={marqueeItems} />
      </div>

      <div className="container">
        <SectionHeading
          index={4}
          eyebrow={t('skills.eyebrow')}
          title={t('skills.title')}
          accent={t('skills.titleAccent')}
          key={lang}
        />

        <div className={styles.bento}>
          {skillGroups.map((group, groupIdx) => {
            const spanClass = group.span === 3 ? styles.span3 : group.span === 2 ? styles.span2 : styles.span1
            return (
              <Reveal
                key={group.id}
                delay={groupIdx * 0.08}
                className={`${styles.card} ${spanClass}`}
              >
                <div className={styles.cardHeader}>
                  <div>
                    <h3 className={styles.groupTitle}>{pick(group.title)}</h3>
                    <p className={styles.groupCaption}>{pick(group.caption)}</p>
                  </div>
                  {group.visual === 'loss' && (
                    <LossVisual labelLoss={t('skills.loss')} labelEpoch={t('skills.epoch')} />
                  )}
                  {group.visual === 'git' && <GitVisual />}
                </div>

                <div className={styles.itemsGrid}>
                  {group.items.map((item) => {
                    const itemName = typeof item.name === 'object' ? pick(item.name) : item.name
                    const Icon = item.icon
                    return (
                      <motion.div
                        key={itemName}
                        className={styles.itemBadge}
                        whileHover={{ y: -4, scale: 1.02 }}
                        style={{ '--hover-color': item.color }}
                      >
                        <span className={styles.iconWrap}>
                          <Icon />
                        </span>
                        <span className={styles.itemName}>{itemName}</span>
                      </motion.div>
                    )
                  })}
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
