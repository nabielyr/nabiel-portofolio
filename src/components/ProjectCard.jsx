import { FiExternalLink, FiGithub } from 'react-icons/fi'
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
 * One cell of the work grid: cover, title with icon links to the code and the
 * live demo, year and categories, a short description and the stack.
 */
export default function ProjectCard({ project }) {
  const { t, pick } = useLanguage()
  const primary = project.demo || project.github
  const building = project.status === 'in-progress'
  const cats = categoriesOf(project)
    .map((c) => t(`categories.${c}`))
    .join(' · ')

  return (
    <article id={`project-${project.id}`} className={styles.card}>
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
        {building && (
          <span className={styles.badge}>
            <span className={styles.badgeDot} aria-hidden="true" />
            {t('projects.inProgress')}
          </span>
        )}
      </a>

      <div className={styles.titleRow}>
        <h3 className={styles.title}>{project.title}</h3>
        <div className={styles.icons}>
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${project.title}: ${t('projects.code')}`}
              title={t('projects.code')}
            >
              <FiGithub aria-hidden="true" />
            </a>
          )}
          {project.demo && (
            <a
              href={project.demo}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${project.title}: ${t('projects.demo')}`}
              title={t('projects.demo')}
            >
              <FiExternalLink aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
      <p className={styles.meta}>
        <span className={styles.year}>{project.year}</span>
        <span className={styles.cats}>{cats}</span>
        {project.coursework && <span className={styles.tag}>{t('projects.coursework')}</span>}
      </p>
      <p className={styles.desc}>{pick(project.description)}</p>
      <p className={styles.tech}>{project.tech.join(' · ')}</p>
    </article>
  )
}
