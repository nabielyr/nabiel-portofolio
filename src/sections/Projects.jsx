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

// one grid: finished work first, then whatever is still being built
const ordered = [...finished, ...inProgress]
const inCategory = (id) => (id === 'all' ? ordered : ordered.filter((p) => categoriesOf(p).includes(id)))

export default function Projects() {
  const { t, pick } = useLanguage()
  const [active, setActive] = useState('all')

  const shown = inCategory(active)

  // jump to a card, clearing the filter first if it hides that card
  const jumpTo = (id) => (e) => {
    e.preventDefault()
    if (shown.some((p) => p.id === id)) {
      scrollToTarget(`#project-${id}`)
      return
    }
    setActive('all')
    requestAnimationFrame(() => scrollToTarget(`#project-${id}`))
  }

  return (
    <section id="projects" className="section">
      <div className="container">
        <SectionHeading index={1} kicker={t('projects.kicker')} title={t('projects.title')}>
          <p>{t('projects.subtitle')}</p>
          <ul className={styles.now}>
            {lastBuild && (
              <li>
                <span className={styles.nowLabel}>
                  <span className={`${styles.nowDot} ${styles.done}`} aria-hidden="true" />
                  {t('projects.lastBuild')}
                </span>
                <a href={`#project-${lastBuild.id}`} onClick={jumpTo(lastBuild.id)}>
                  {lastBuild.title}
                </a>
              </li>
            )}
            {building && (
              <li>
                <span className={styles.nowLabel}>
                  <span className={`${styles.nowDot} ${styles.live}`} aria-hidden="true" />
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
            const count = inCategory(cat.id).length
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

        <div className={styles.grid}>
          {shown.map((p) => (
            <ProjectCard key={`${active}-${p.id}`} project={p} />
          ))}
        </div>

        <a className={styles.more} href={github.url} target="_blank" rel="noopener noreferrer">
          {t('projects.more')} ↗
        </a>
      </div>
    </section>
  )
}
