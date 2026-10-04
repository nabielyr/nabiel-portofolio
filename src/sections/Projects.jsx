import { useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { FiGithub } from 'react-icons/fi'
import { useLanguage } from '../context/contexts'
import { projects, projectCategories } from '../data/projects'
import { profile } from '../data/profile'
import SectionHeading from '../components/SectionHeading'
import ProjectCard from '../components/ProjectCard'
import Button from '../components/Button'
import styles from './Projects.module.css'

export default function Projects() {
  const { t, pick, lang } = useLanguage()
  const [activeCategory, setActiveCategory] = useState('all')

  const filtered = activeCategory === 'all'
    ? projects
    : projects.filter((p) => p.category === activeCategory)

  return (
    <section id="projects" className="section">
      <div className="container">
        <div className={styles.headerRow}>
          <SectionHeading
            index={5}
            eyebrow={t('projects.eyebrow')}
            title={t('projects.title')}
            accent={t('projects.titleAccent')}
            key={lang}
          >
            <p className={styles.subtitle}>{t('projects.subtitle')}</p>
          </SectionHeading>

          {/* Filter tabs */}
          <div className={styles.filters} role="tablist" aria-label="Filter projects">
            {projectCategories.map((cat) => {
              const isActive = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  role="tab"
                  id={`filter-${cat.id}`}
                  aria-selected={isActive}
                  className={`${styles.filterBtn} ${isActive ? styles.filterActive : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {isActive && (
                    <motion.span
                      layoutId="project-cat-pill"
                      className={styles.filterPill}
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                  <span className={styles.filterText}>{pick(cat.label)}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Project grid */}
        <LayoutGroup>
          <motion.div layout className={styles.grid}>
            <AnimatePresence mode="popLayout">
              {filtered.length > 0 ? (
                filtered.map((proj) => (
                  <ProjectCard key={proj.id} project={proj} />
                ))
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={styles.empty}
                >
                  <p>{t('projects.empty')}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>

        {/* More on GitHub button */}
        <div className={styles.moreWrap}>
          <Button
            href={`https://github.com/${profile.socials.find((s) => s.id === 'github')?.handle?.replace('@', '') || 'nabielyr'}`}
            external
            variant="ghost"
            icon={<FiGithub />}
          >
            {t('projects.more')}
          </Button>
        </div>
      </div>
    </section>
  )
}
