import { useLanguage } from '../context/contexts'
import { categoriesOf } from '../data/projects'
import styles from './ProjectCard.module.css'

/** A project without a screenshot gets a cover set in type from its own title. */
function TypeCover({ title }) {
  return (
    <div className={styles.typeCover} aria-hidden="true">
      <span>{title}</span>
    </div>
  )
}

/**
 * One project: cover, title and year, categories, a short description, the
 * stack, and plain links to the live demo (if there is one) and the code.
 */
export default function ProjectCard({ project, feature = false }) {
  const { t, pick } = useLanguage()
  const primary = project.demo || project.github
  const cats = categoriesOf(project)
    .map((c) => t(`categories.${c}`))
    .join(' · ')

  return (
    <article id={`project-${project.id}`} className={`${styles.card} ${feature ? styles.feature : ''}`}>
      <a
        className={styles.cover}
        href={primary}
        target="_blank"
        rel="noopener noreferrer"
        data-cursor-label={t('projects.view')}
        aria-label={`${project.title} - ${t('projects.view')}`}
      >
        {project.image ? (
          <img src={project.image} alt="" loading="lazy" width="1200" height="750" />
        ) : (
          <TypeCover title={project.title} />
        )}
      </a>

      <div className={styles.body}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>{project.title}</h3>
          <span className={styles.year}>{project.year}</span>
        </div>
        <p className={styles.cats}>{cats}</p>
        <p className={styles.desc}>{pick(project.description)}</p>
        <p className={styles.tech}>{project.tech.join(' · ')}</p>
        <div className={styles.links}>
          {project.demo && (
            <a href={project.demo} target="_blank" rel="noopener noreferrer">
              {t('projects.demo')} ↗
            </a>
          )}
          {project.github && (
            <a href={project.github} target="_blank" rel="noopener noreferrer">
              {t('projects.code')} ↗
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
