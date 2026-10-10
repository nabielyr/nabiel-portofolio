# nabiel-portofolio

My personal portfolio. It's where I keep track of what I'm learning, where I've contributed, and the things I build.

▶ **Visit it here: [nabiel-portofolio-five.vercel.app](https://nabiel-portofolio-five.vercel.app/)**

![The hero: my name, a short intro, a navy owl sitting on a stack of books, and a split-flap ticker along the bottom](public/projects/portfolio.webp)

Hi, I'm Nabiel, an Information Systems student at Brawijaya University in Malang, Indonesia. I'm a resident and teaching assistant at the Intelligent System Laboratory, and I'm working my way toward AI/ML engineering and data science. I wanted the site to feel made by a person rather than generated: paper and ink, big condensed type, and a small owl called Hoo who keeps me company.

## What's on the page

- **Hero.** My name, what I study, where I'm based and what I'm open to, plus my CV. Hoo, a navy owl I built in Three.js, flies in from the top right corner of the page, glides, flares his wings and lands on a stack of books. He follows your cursor with his head and eyes, blinks, and hops when you click him (double-click for a full head turn). In the light theme he gets drowsy after a while and falls asleep (little "z"s and all) until you click him awake; in the dark theme he's a night owl and stays up. There's a jar of cookies at the right edge: drag one to his beak and he'll eat it. His face is also the site's logo.
- **Split-flap ticker.** Along the bottom of the hero, a row of split-flap tiles shows what I'm doing now, the time in Malang and what I'm open to. The tiles stay put and the text flips through them, like a station board. It stops when you point at it, and you can drag or fling it either way.
- **Work.** The projects I've built in one compact grid, with icon links to the code and the live demo, what I built last and what I'm building now.
- **About, Education and Experience.** A short intro, a few facts, my degree, and my roles at the lab and on campus.
- **Toolkit.** The core tools I actually reach for, plus one line for everything else.
- **Contact.** A big "Get in touch" that Hoo flies in and lands on, toes curled over the top of the T, my email (copy in one click), my links and the local time in Malang.

It's fully bilingual (English and Bahasa Indonesia) and has both a dark and a light theme.

## Built with

- [React 19](https://react.dev/) and [Vite](https://vite.dev/)
- [Three.js](https://threejs.org/) with [React Three Fiber](https://r3f.docs.pmnd.rs/) for the owl
- [Framer Motion](https://motion.dev/) for the small reveal animations
- [Lenis](https://lenis.darkroom.engineering/) for smooth scrolling
- Plain CSS Modules with design tokens (no CSS framework)
- Hosted on [Vercel](https://vercel.com/)

## Keeping it smooth

A 3D owl and a ticker that never stops can easily make a page feel heavy, so I spent some time on this:

- The fonts are self-hosted and preloaded, and the name only starts rising once its font is in, so it never swaps typeface (and re-rasters huge glyphs) mid-animation. The owl's WebGL set-up waits until the name has finished, then compiles its shaders before the first frame, and only renders while it's on screen.
- The owl is built from simple shapes that share a handful of materials, and only moves groups around, so it's cheap to draw. His feathers, face and belly are painted into textures once, in a Web Worker on a CPU canvas (painting them on the page's GPU canvas once stalled the compositor for ~100 ms), and uploaded to the GPU one per frame before he appears. His shadow is a small gradient texture instead of a real-time shadow pass.
- The split-flap ticker is drawn on a single canvas. My first version used a DOM element per tile and created about a hundred compositor layers; the canvas version cut the longest task from 244 ms to about 5 ms.
- The center dot of the custom cursor is a real system cursor image, so it never lags behind your mouse. Only the ring around it is animated.

## Running it locally

You'll need [Node.js](https://nodejs.org/) 20.19+ or 22.12+ (what Vite 8 requires).

```bash
npm install
npm run dev       # http://localhost:5173
```

Other scripts:

```bash
npm run build     # production build into dist/
npm run preview   # serve the production build locally
npm run lint      # ESLint
```

## Updating the content

All the content lives in plain data files, so updating the site rarely means touching a component.

| What | Where |
| --- | --- |
| Name, email, social links, CV | `src/data/profile.js` |
| Projects and filter categories | `src/data/projects.js` |
| Experience timeline | `src/data/experience.js` |
| Education and affiliations | `src/data/education.js` |
| Toolkit | `src/data/skills.js` |
| Interface text (EN / ID) | `src/i18n/en.js` and `src/i18n/id.js` |

A few notes:

- **Projects.** Pick a category (`ai-ml`, `data-science`, `web-dev` or `fun`), or an array of them if a project fits more than one, and add a `{ en, id }` description. Project screenshots go in `public/projects/` (WebP works best). If `image` is left empty, the title is set in type as the cover. A project with `status: 'in-progress'` goes at the end of the grid with an "In progress" badge and shows up as "Currently building".
- **CV.** Put the PDF in `public/cv/` and set `cv` in `profile.js` to its path, e.g. `'/cv/Curriculum Vitae Muhammad Nabiel Yandra.pdf'`. The download button shows up on its own.
- **Text.** Anything that appears on the page should be added to both `en.js` and `id.js`.

Every push to `main` is deployed to Vercel automatically.

## Get in touch

- Email: [nabielyandra@gmail.com](mailto:nabielyandra@gmail.com)
- LinkedIn: [in/nabiel-yandra](https://linkedin.com/in/nabiel-yandra)
- GitHub: [@nabielyr](https://github.com/nabielyr)
- Linktree: [linktr.ee/nabielyandra](https://linktr.ee/nabielyandra)
