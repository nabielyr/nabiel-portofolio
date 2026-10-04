/**
 * ============================================================
 *  PROJECTS — edit this file to add / update your projects.
 * ============================================================
 *
 *  Fields:
 *  - id          unique slug (no spaces)
 *  - title       project name
 *  - category    'ai-ml' | 'data-science' | 'web-dev' | 'fun'
 *  - description { en: '...', id: '...' }
 *  - tech        array of technologies used
 *  - image       optional, e.g. '/projects/my-project.webp' (put the file in public/projects/)
 *                if empty, a unique generative cover is drawn automatically
 *  - github      optional repo URL
 *  - demo        optional live demo URL
 *  - featured    true = bigger card
 *  - year        number
 *  - status      optional: 'in-progress' shows a "Coming soon" badge
 *
 *  Newest / most important projects first.
 */
export const projects = [
  {
    id: 'placeholder-ai-1',
    title: 'Untitled AI/ML Project',
    category: 'ai-ml',
    description: {
      en: 'Something intelligent is being trained here. A machine learning project is on its way.',
      id: 'Sesuatu yang cerdas sedang dilatih di sini. Proyek machine learning segera hadir.',
    },
    tech: ['Python', 'PyTorch', 'scikit-learn'],
    image: '',
    github: 'https://github.com/nabielyr',
    demo: '',
    featured: true,
    year: 2026,
    status: 'in-progress',
  },
  {
    id: 'placeholder-ds-1',
    title: 'Untitled Data Science Project',
    category: 'data-science',
    description: {
      en: 'Raw data in, insights out. Exploratory analysis and visualization coming soon.',
      id: 'Data mentah masuk, insight keluar. Analisis eksploratif dan visualisasi segera hadir.',
    },
    tech: ['Python', 'Pandas', 'Kaggle'],
    image: '',
    github: 'https://github.com/nabielyr',
    demo: '',
    featured: false,
    year: 2026,
    status: 'in-progress',
  },
  {
    id: 'placeholder-web-1',
    title: 'Untitled Web Project',
    category: 'web-dev',
    description: {
      en: 'A web application currently being designed and built. Stay tuned.',
      id: 'Aplikasi web yang sedang dirancang dan dibangun. Nantikan ya.',
    },
    tech: ['PHP', 'MySQL', 'HTML5'],
    image: '',
    github: 'https://github.com/nabielyr',
    demo: '',
    featured: false,
    year: 2026,
    status: 'in-progress',
  },
  {
    id: 'placeholder-ai-2',
    title: 'Untitled Deep Learning Experiment',
    category: 'ai-ml',
    description: {
      en: 'Experimenting with neural networks. Results will be published here.',
      id: 'Eksperimen dengan neural network. Hasilnya akan dipublikasikan di sini.',
    },
    tech: ['TensorFlow', 'Python'],
    image: '',
    github: 'https://github.com/nabielyr',
    demo: '',
    featured: false,
    year: 2026,
    status: 'in-progress',
  },
  {
    id: 'placeholder-fun-1',
    title: 'Untitled Fun Project',
    category: 'fun',
    description: {
      en: 'When an interesting idea pops into my head, I build it. This one is cooking.',
      id: 'Kalau ada ide menarik muncul, pasti saya buat. Yang ini sedang dimasak.',
    },
    tech: ['Python', 'Docker'],
    image: '',
    github: 'https://github.com/nabielyr',
    demo: '',
    featured: false,
    year: 2026,
    status: 'in-progress',
  },
  {
    id: 'placeholder-ds-2',
    title: 'Untitled Analytics Dashboard',
    category: 'data-science',
    description: {
      en: 'Turning numbers into stories with an interactive dashboard. Coming soon.',
      id: 'Mengubah angka menjadi cerita lewat dashboard interaktif. Segera hadir.',
    },
    tech: ['Python', 'MySQL'],
    image: '',
    github: 'https://github.com/nabielyr',
    demo: '',
    featured: false,
    year: 2026,
    status: 'in-progress',
  },
]

/** Filter tabs. `id: 'all'` must stay first. */
export const projectCategories = [
  { id: 'all', label: { en: 'All', id: 'Semua' } },
  { id: 'ai-ml', label: { en: 'AI / ML', id: 'AI / ML' } },
  { id: 'data-science', label: { en: 'Data Science', id: 'Data Science' } },
  { id: 'web-dev', label: { en: 'Web Development', id: 'Web Development' } },
  { id: 'fun', label: { en: 'Fun Projects', id: 'Fun Projects' } },
]
