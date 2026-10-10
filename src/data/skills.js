import {
  SiPython, SiPytorch, SiScikitlearn, SiHuggingface, SiPandas, SiNumpy,
  SiFastapi, SiReact, SiJavascript, SiGit,
} from 'react-icons/si'
import { FiDatabase } from 'react-icons/fi'

/**
 * Toolkit, kept short on purpose: the core stack I actually reach for, plus a
 * single line for everything else I've used in a project.
 * `note` says what I use it for.
 */
export const coreStack = [
  { name: 'Python', icon: SiPython, note: { en: 'My main language', id: 'Bahasa utama saya' } },
  { name: 'PyTorch', icon: SiPytorch, note: { en: 'Deep learning', id: 'Deep learning' } },
  { name: 'scikit-learn', icon: SiScikitlearn, note: { en: 'Classic machine learning', id: 'Machine learning klasik' } },
  { name: 'Hugging Face', icon: SiHuggingface, note: { en: 'Transformers & NLP', id: 'Transformer & NLP' } },
  { name: 'Pandas', icon: SiPandas, note: { en: 'Cleaning & exploring data', id: 'Membersihkan & eksplorasi data' } },
  { name: 'NumPy', icon: SiNumpy, note: { en: 'Numbers & arrays', id: 'Angka & array' } },
  { name: 'SQL', icon: FiDatabase, note: { en: 'MySQL, SQLite', id: 'MySQL, SQLite' } },
  { name: 'FastAPI', icon: SiFastapi, note: { en: 'APIs for models', id: 'API untuk model' } },
  { name: 'React', icon: SiReact, note: { en: 'Interfaces', id: 'Antarmuka' } },
  { name: 'JavaScript', icon: SiJavascript, note: { en: 'The web, games', id: 'Web, game' } },
  { name: 'Git', icon: SiGit, note: { en: 'Version control', id: 'Version control' } },
]

export const alsoUsed = [
  'TensorFlow', 'MediaPipe', 'OpenCV', 'Matplotlib', 'Seaborn', 'Jupyter', 'Google Colab', 'Kaggle',
  'Three.js', 'Vite', 'Framer Motion', 'Redis', 'Docker', 'Java', 'PHP', 'HTML & CSS', 'pytest', 'Vercel', 'GitLab',
]
