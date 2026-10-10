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
        <a href="#home" onClick={toTop} className={styles.brand} aria-label={t('footer.top')}>
          <Logo size={30} />
        </a>
        <p className={styles.copy}>
          © {new Date().getFullYear()} Muhammad Nabiel Yandra. {t('footer.rights')}
        </p>
        <p className={styles.built}>{t('footer.built')}</p>
        <button id="back-to-top-btn" className={styles.top} onClick={toTop}>
          {t('footer.top')} <span aria-hidden="true">↑</span>
        </button>
      </div>
    </footer>
  )
}
