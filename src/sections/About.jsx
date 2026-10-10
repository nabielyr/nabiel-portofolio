import { useLanguage } from '../context/contexts'
import { profile } from '../data/profile'
import SectionHeading from '../components/SectionHeading'
import styles from './About.module.css'

export default function About() {
  const { t } = useLanguage()
  const facts = t('about.facts')

  return (
    <section id="about" className="section">
      <div className="container">
        <SectionHeading index={2} kicker={t('about.kicker')} title={t('about.title')} />

        <div className={styles.grid}>
          <figure className={styles.photo}>
            <img
              src={profile.photo.src}
              srcSet={profile.photo.srcSet}
              sizes="(max-width: 860px) 70vw, 380px"
              alt={profile.name}
              width="800"
              height="1000"
              loading="lazy"
            />
            <figcaption>{t('about.caption')}</figcaption>
          </figure>

          <div className={styles.text}>
            <p className={styles.lead}>{t('about.p1')}</p>
            <p className={styles.body}>{t('about.p2')}</p>

            <dl className={styles.facts}>
              {facts.map((f) => (
                <div key={f.label} className={styles.fact}>
                  <dt>{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
              <div className={styles.fact}>
                <dt>{t('about.honorLabel')}</dt>
                <dd>
                  <span className={styles.star} aria-hidden="true">
                    ★
                  </span>{' '}
                  {t('about.honor')}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  )
}
