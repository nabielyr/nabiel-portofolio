/**
 * ============================================================
 *  PROJECTS - edit this file to add / update your projects.
 * ============================================================
 *
 *  Fields:
 *  - id          unique slug (no spaces)
 *  - title       project name
 *  - category    'ai-ml' | 'data-science' | 'web-dev' | 'fun', or an array
 *                of them when a project fits more than one (the first one
 *                picks the generated cover art)
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
    id: 'letterfall',
    title: 'Letterfall',
    category: 'fun',
    description: {
      en: "An arcade typing game in a rainy pixel town: type the falling words before they land. All the art and chiptune music are made in code, and there's a worldwide top 10.",
      id: "Game arcade mengetik di kota pixel yang sedang hujan: ketik kata-kata yang jatuh sebelum menyentuh tanah. Semua gambar dan musik chiptune-nya dibuat lewat kode, lengkap dengan papan top 10 dunia.",
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
      en: "This site. A bilingual portfolio with a hand-built 3D owl and a split-flap ticker, tuned to stay smooth on an ordinary laptop.",
      id: "Website ini. Portofolio dua bahasa dengan burung hantu 3D buatan sendiri dan ticker split-flap, diatur supaya tetap mulus di laptop biasa.",
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
      en: "Reads American Sign Language from a webcam in real time, turns the signs into a sentence and reads it out loud. MediaPipe tracks the hands and a Random Forest recognizes each pose.",
      id: "Membaca American Sign Language dari webcam secara real-time, menyusunnya jadi kalimat, lalu membacakannya. MediaPipe melacak tangan dan Random Forest mengenali tiap pose.",
    },
    tech: ['Python', 'MediaPipe', 'scikit-learn', 'FastAPI'],
    image: '/projects/signspeak.webp',
    github: 'https://github.com/nabielyr/SignLanguage',
    demo: '',
    featured: true,
    year: 2026,
  },
  {
    id: 'hantavirus-sentiment',
    title: 'Hantavirus Sentiment Analysis',
    category: ['data-science', 'ai-ml'],
    description: {
      en: "Sentiment analysis of 779 YouTube comments about hantavirus with a fine-tuned IndoBERT. Almost 74% were negative, many of them political jokes about \"tikus\".",
      id: "Analisis sentimen 779 komentar YouTube tentang hantavirus dengan IndoBERT yang di-fine-tune. Hampir 74% bernada negatif, banyak di antaranya candaan politik soal \"tikus\".",
    },
    tech: ['Python', 'IndoBERT', 'Hugging Face', 'YouTube API'],
    image: '/projects/indobert-hantavirus.webp',
    github: 'https://github.com/nabielyr/IndoBERT-for-Hantavirus-Sentiment-Analysis',
    demo: '',
    featured: true,
    year: 2026,
  },
  {
    id: 'tech-layoffs',
    title: 'Tech Layoffs Trend Analysis',
    category: 'data-science',
    description: {
      en: "A look at 2,412 tech layoff events from 2020 to 2025. Layoffs grew every year after 2021, and the worst single month was January 2023.",
      id: "Analisis 2.412 kejadian PHK di industri teknologi dari 2020 sampai 2025. Jumlahnya naik setiap tahun sejak 2021, dan bulan terburuknya Januari 2023.",
    },
    tech: ['Python', 'Pandas', 'Matplotlib', 'Seaborn'],
    image: '/projects/tech-layoffs.webp',
    github: 'https://github.com/nabielyr/Tech-Layoffs-Trend-Analysis',
    demo: '',
    featured: true,
    year: 2026,
  },
  {
    id: 'what-gets-starred',
    title: 'What Gets Starred',
    category: 'data-science',
    description: {
      en: "What makes a GitHub repo popular? A resumable pipeline that samples about 4,000 repos through the GitHub API, with the analysis and a Streamlit dashboard still to come.",
      id: "Apa yang membuat repo GitHub populer? Pipeline yang mengambil sampel sekitar 4.000 repo lewat GitHub API, dengan analisis dan dashboard Streamlit yang menyusul.",
    },
    tech: ['Python', 'GitHub API', 'SQLite', 'pytest'],
    image: '',
    github: 'https://github.com/nabielyr/what-gets-starred',
    demo: '',
    featured: false,
    year: 2026,
    status: 'in-progress',
  },
]

/** All categories a project belongs to (`category` may be a string or an array). */
export const categoriesOf = (project) => [].concat(project.category)

/** Filter tabs. `id: 'all'` must stay first. */
export const projectCategories = [
  { id: 'all', label: { en: 'All', id: 'Semua' } },
  { id: 'fun', label: { en: 'Fun Projects', id: 'Fun Projects' } },
  { id: 'ai-ml', label: { en: 'AI / ML', id: 'AI / ML' } },
  { id: 'data-science', label: { en: 'Data Science', id: 'Data Science' } },
  { id: 'web-dev', label: { en: 'Web Development', id: 'Web Development' } },
]

