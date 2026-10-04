import { FiArrowUp } from 'react-icons/fi'
import { useLanguage } from '../context/contexts'
import { scrollToTarget } from '../lib/smoothScroll'
import Logo from './Logo'
import styles from './Footer.module.css'

export default function Footer() {
  const { t } = useLanguage()

  const toTop = (e) => {
    e.preventDefault()
    scrollToTarget(0)
  }

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brandRow}>
          <a href="#home" onClick={toTop} className={styles.brand} aria-label="Back to home">
            <Logo size={28} />
            <span className={styles.brandName}>
              Nabiel Yandra<span className={styles.dot}>.</span>
            </span>
          </a>
          <p className={styles.tagline}>{t('footer.built')}</p>
        </div>

        <div className={styles.bottomRow}>
          <p className={styles.copy}>
            © {new Date().getFullYear()} Muhammad Nabiel Yandra. {t('footer.rights')}
          </p>

          <button
            id="back-to-top-btn"
            className={styles.topBtn}
            onClick={toTop}
            aria-label={t('footer.top')}
          >
            <span>{t('footer.top')}</span>
            <span className={styles.topIcon}>
              <FiArrowUp />
            </span>
          </button>
        </div>
      </div>
    </footer>
  )
}
