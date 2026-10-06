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
    id: 'hantavirus-sentiment',
    title: 'Hantavirus Sentiment Analysis',
    category: ['data-science', 'ai-ml'],
    description: {
      en: 'How did Indonesians react to hantavirus news on YouTube? I pulled 779 comments with the YouTube Data API, cleaned up the slang, and classified them with IndoBERT, which I also fine-tuned on the data. Almost 74% came out negative, many of them political jabs about "tikus".',
      id: 'Bagaimana reaksi warganet Indonesia terhadap berita hantavirus di YouTube? Saya mengambil 779 komentar lewat YouTube Data API, menormalisasi kata gaul, lalu mengklasifikasikannya dengan IndoBERT yang juga saya fine-tune. Hampir 74% komentar bernada negatif, banyak di antaranya sindiran politik soal "tikus".',
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
      en: 'A look at 2,412 tech layoff events from 2020 to 2025: which years, companies, industries and countries were hit hardest. Layoffs grew every year after 2021, and the worst single month was January 2023 with more than 66,000 people let go.',
      id: 'Analisis 2.412 kejadian PHK di industri teknologi dari 2020 sampai 2025: tahun, perusahaan, industri, dan negara mana yang paling terdampak. Jumlah PHK naik setiap tahun sejak 2021, dan bulan terburuknya adalah Januari 2023 dengan lebih dari 66.000 orang terkena PHK.',
    },
    tech: ['Python', 'Pandas', 'Matplotlib', 'Seaborn'],
    image: '/projects/tech-layoffs.webp',
    github: 'https://github.com/nabielyr/Tech-Layoffs-Trend-Analysis',
    demo: '',
    featured: true,
    year: 2026,
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

