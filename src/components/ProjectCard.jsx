import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { FiArrowUpRight, FiGithub } from 'react-icons/fi'
import { useLanguage } from '../context/contexts'
import ProjectCover from './ProjectCover'
import styles from './ProjectCard.module.css'

const ProjectCard = forwardRef(function ProjectCard({ project }, ref) {
  const { t, pick } = useLanguage()
  const primaryLink = project.demo || project.github
  const inProgress = project.status === 'in-progress'

  // Spotlight that follows the cursor (CSS variables, no re-render)
  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`)
  }

  return (
    <motion.article
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0.94, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: 10 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`${styles.card} ${project.featured ? styles.featured : ''}`}
      onMouseMove={onMove}
      data-cursor-label={primaryLink ? t('projects.view') : undefined}
      id={`project-${project.id}`}
    >
      {primaryLink && (
        <a
          className={styles.overlayLink}
          href={primaryLink}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${project.title} — ${t('projects.view')}`}
        />
      )}

      <div className={styles.cover}>
        {project.image ? (
          <img src={project.image} alt={project.title} loading="lazy" className={styles.coverImg} />
        ) : (
          <ProjectCover seed={project.id} category={project.category} className={styles.coverImg} />
        )}
        <div className={styles.badges}>
          <span className={styles.badge}>{t(`categories.${project.category}`)}</span>
          {project.featured && <span className={`${styles.badge} ${styles.badgeAccent}`}>★ {t('projects.featured')}</span>}
        </div>
        {inProgress && (
          <span className={styles.status}>
            <span className={styles.statusDot} />
            {t('projects.comingSoon')}
          </span>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>{project.title}</h3>
          <span className={styles.year}>{project.year}</span>
        </div>
        <p className={styles.desc}>{pick(project.description)}</p>

        <div className={styles.footer}>
          <ul className={styles.tech}>
            {project.tech.map((tech) => (
              <li key={tech}>{tech}</li>
            ))}
          </ul>
          <div className={styles.links}>
            {project.github && (
              <a href={project.github} target="_blank" rel="noopener noreferrer" aria-label={`${project.title} ${t('projects.code')}`}>
                <FiGithub />
              </a>
            )}
            {project.demo && (
              <a href={project.demo} target="_blank" rel="noopener noreferrer" aria-label={`${project.title} ${t('projects.demo')}`}>
                <FiArrowUpRight />
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  )
})

export default ProjectCard
