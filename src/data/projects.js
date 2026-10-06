/**
 * ============================================================
 *  PROJECTS - edit this file to add / update your projects.
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
 *  Newest / most important projects first. Each category keeps one
 *  'in-progress' card as a teaser for what's coming next.
 */
export const projects = [
  {
    id: 'letterfall',
    title: 'Letterfall',
    category: 'fun',
    description: {
      en: 'A cozy arcade typing game set in a rainy pixel town. Words fall as raindrops, meteors and shooting stars, and you type them before they land. All the art and chiptune music are made in code, and there is a worldwide top 10.',
      id: 'Game arcade mengetik dengan latar kota pixel yang sedang hujan. Kata-kata jatuh sebagai rintik hujan, meteor, dan bintang jatuh, dan kamu harus mengetiknya sebelum menyentuh tanah. Semua gambar dan musik chiptune-nya dibuat lewat kode, lengkap dengan papan top 10 dunia.',
    },
    tech: ['JavaScript', 'Canvas', 'Web Audio API', 'Upstash Redis'],
    image: '/projects/letterfall.webp',
    github: 'https://github.com/nabielyr/letterfall',
    demo: 'https://letterfall-eight.vercel.app/',
    featured: true,
    year: 2026,
  },
  {
    id: 'portfolio',
    title: 'Personal Portfolio',
    category: 'web-dev',
    description: {
      en: "The site you're looking at right now. A bilingual portfolio with an interactive Three.js neural network in the hero, smooth scrolling, and a lot of small details tuned so it stays light and smooth, even on a modest laptop.",
      id: 'Website yang sedang kamu lihat sekarang. Portofolio dua bahasa dengan jaringan saraf Three.js interaktif di bagian hero, smooth scrolling, dan banyak detail kecil yang diatur supaya tetap ringan dan mulus, bahkan di laptop biasa.',
    },
    tech: ['React', 'Three.js', 'Framer Motion', 'Vite'],
    image: '/projects/portfolio.webp',
    github: 'https://github.com/nabielyr/nabiel-portofolio',
    demo: 'https://nabiel-portofolio-five.vercel.app/',
    featured: true,
    year: 2026,
  },
  {
    id: 'signspeak',
    title: 'SignSpeak',
    category: 'ai-ml',
    description: {
      en: 'Reads American Sign Language from a webcam in real time. MediaPipe tracks both hands, a Random Forest recognizes each sign from the hand pose, and the words you sign are turned into a sentence and read out loud.',
      id: 'Membaca American Sign Language dari webcam secara real-time. MediaPipe melacak kedua tangan, model Random Forest mengenali tiap isyarat dari pose tangan, lalu kata-kata yang diperagakan disusun menjadi kalimat dan dibacakan dengan suara.',
    },
    tech: ['Python', 'MediaPipe', 'scikit-learn', 'FastAPI'],
    image: '/projects/signspeak.webp',
    github: 'https://github.com/nabielyr/SignLanguage',
    demo: '',
    featured: true,
    year: 2026,
  },
  {
    id: 'placeholder-fun-1',
    title: 'Untitled Fun Project',
    category: 'fun',
    description: {
      en: 'When an interesting idea pops into my head, I build it. This one is cooking.',
      id: 'Kalau ada ide menarik muncul, pasti saya buat. Yang ini sedang dimasak.',
    },
    tech: ['JavaScript', 'Canvas'],
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
    featured: false,
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
]

/** Filter tabs. `id: 'all'` must stay first. */
export const projectCategories = [
  { id: 'all', label: { en: 'All', id: 'Semua' } },
  { id: 'fun', label: { en: 'Fun Projects', id: 'Fun Projects' } },
  { id: 'ai-ml', label: { en: 'AI / ML', id: 'AI / ML' } },
  { id: 'data-science', label: { en: 'Data Science', id: 'Data Science' } },
  { id: 'web-dev', label: { en: 'Web Development', id: 'Web Development' } },
]

