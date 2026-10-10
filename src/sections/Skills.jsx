import { useLanguage } from '../context/contexts'
import { coreStack, alsoUsed } from '../data/skills'
import SectionHeading from '../components/SectionHeading'
import styles from './Skills.module.css'

export default function Skills() {
  const { t, pick } = useLanguage()

  return (
    <section id="skills" className="section">
      <div className="container">
        <SectionHeading index={4} kicker={t('skills.kicker')} title={t('skills.title')}>
          <p>{t('skills.subtitle')}</p>
        </SectionHeading>

        <ul className={styles.grid}>
          {coreStack.map(({ name, icon: Icon, note }) => (
            <li key={name} className={styles.item}>
              <Icon className={styles.icon} aria-hidden="true" />
              <span className={styles.name}>{name}</span>
              <span className={styles.note}>{pick(note)}</span>
            </li>
          ))}
        </ul>

        <p className={styles.also}>
          <span className={styles.alsoLabel}>{t('skills.also')}</span>
          {alsoUsed.join(', ')}
        </p>
      </div>
    </section>
  )
}
