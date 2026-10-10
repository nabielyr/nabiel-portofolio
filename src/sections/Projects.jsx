import { useState } from 'react'
import { useLanguage } from '../context/contexts'
import { projects, projectCategories, categoriesOf } from '../data/projects'
import { profile } from '../data/profile'
import { scrollToTarget } from '../lib/smoothScroll'
import SectionHeading from '../components/SectionHeading'
import ProjectCard from '../components/ProjectCard'
import styles from './Projects.module.css'

const finished = projects.filter((p) => p.status !== 'in-progress')
const inProgress = projects.filter((p) => p.status === 'in-progress')
// "Last built" is the newest finished project; "Currently building" only shows while something is in progress
const lastBuild = finished[0]
const building = inProgress[0]
const github = profile.socials.find((s) => s.id === 'github')

const countFor = (id) => (id === 'all' ? finished.length : finished.filter((p) => categoriesOf(p).includes(id)).length)

function jumpTo(id) {
  return (e) => {
    e.preventDefault()
    scrollToTarget(`#project-${id}`)
  }
}

export default function Projects() {
  const { t, pick } = useLanguage()
  const [active, setActive] = useState('all')

  const shown = active === 'all' ? finished : finished.filter((p) => categoriesOf(p).includes(active))
  const [feature, ...rest] = active === 'all' ? shown : [null, ...shown]

  return (
    <section id="projects" className="section">
      <div className="container">
        <SectionHeading index={1} kicker={t('projects.kicker')} title={t('projects.title')}>
          <p>{t('projects.subtitle')}</p>
          <ul className={styles.now}>
            {lastBuild && (
              <li>
                <span className={styles.nowLabel}>{t('projects.lastBuild')}</span>
                <a href={`#project-${lastBuild.id}`} onClick={jumpTo(lastBuild.id)}>
                  {lastBuild.title}
                </a>
              </li>
            )}
            {building && (
              <li>
                <span className={styles.nowLabel}>
                  <span className={styles.nowDot} aria-hidden="true" />
                  {t('projects.building')}
                </span>
                <a href={`#project-${building.id}`} onClick={jumpTo(building.id)}>
                  {building.title}
                </a>
              </li>
            )}
          </ul>
        </SectionHeading>

        <div className={styles.filters} role="tablist" aria-label="Filter projects">
          {projectCategories.map((cat) => {
            const count = countFor(cat.id)
            return (
              <button
                key={cat.id}
                role="tab"
                id={`filter-${cat.id}`}
                aria-selected={active === cat.id}
                className={`${styles.filter} ${active === cat.id ? styles.filterOn : ''}`}
                onClick={() => setActive(cat.id)}
                disabled={count === 0}
              >
                {pick(cat.label)}
                <sup>{count}</sup>
              </button>
            )
          })}
        </div>

        {feature && <ProjectCard key={`f-${feature.id}`} project={feature} feature />}

        {rest.length > 0 && (
          <div className={styles.grid}>
            {rest.map((p) => (
              <ProjectCard key={`${active}-${p.id}`} project={p} />
            ))}
          </div>
        )}

        {inProgress.length > 0 && (
          <div className={styles.later}>
            <h3 className={styles.laterTitle}>{t('projects.inProgress')}</h3>
            <ul>
              {inProgress.map((p) => (
                <li key={p.id} id={`project-${p.id}`}>
                  <a href={p.github} target="_blank" rel="noopener noreferrer" className={styles.row}>
                    <span className={styles.rowYear}>{p.year}</span>
                    <span className={styles.rowName}>{p.title}</span>
                    <span className={styles.rowDesc}>{pick(p.description)}</span>
                    <span className={styles.rowArrow} aria-hidden="true">
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <a className={styles.more} href={github.url} target="_blank" rel="noopener noreferrer">
          {t('projects.more')} ↗
        </a>
      </div>
    </section>
  )
}
