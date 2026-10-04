# Muhammad Nabiel Yandra — Portfolio Website

Personal portfolio website built with **React + Vite**, **Three.js** (interactive 3D neural network), **Framer Motion**, and **Lenis** smooth scroll.

Designed with the **"From Data to Intelligence"** theme, merging **Information Systems**, **AI/ML**, and **Data Science**.

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies (if cloning fresh)
npm install

# 2. Run local dev server
npm run dev

# 3. Build for production (same check as Vercel)
npm run build
```

The dev server will run at `http://localhost:5173`.

---

## 🛠️ How to Add / Update Projects

You only need to edit **one single file**:

📄 [`src/data/projects.js`](file:///c:/Users/Pongo/Documents/Coding/Antigravity/Portofolio/src/data/projects.js)

Add a new item to the `projects` array:

```javascript
{
  id: 'my-project-slug',
  title: 'My Project Name',
  category: 'ai-ml', // Choose from: 'ai-ml' | 'data-science' | 'web-dev' | 'fun'
  description: {
    en: 'English description of your project...',
    id: 'Deskripsi proyek dalam bahasa Indonesia...',
  },
  tech: ['Python', 'PyTorch', 'FastAPI'],
  image: '/projects/my-screenshot.webp', // Optional: put image in public/projects/
  github: 'https://github.com/nabielyr/...',
  demo: 'https://...', // Optional live link
  featured: true, // true = larger card highlight
  year: 2026,
  status: 'completed', // or 'in-progress'
}
```

> **Note on Images:** If `image` is left empty `""`, an interactive **generative artwork cover** matching the category is drawn automatically.

---

## 📄 How to Add Your CV / Resume

1. Place your PDF in [`public/cv/`](file:///c:/Users/Pongo/Documents/Coding/Antigravity/Portofolio/public/cv/) (e.g. `CV_Muhammad_Nabiel_Yandra.pdf`).
2. Open [`src/data/profile.js`](file:///c:/Users/Pongo/Documents/Coding/Antigravity/Portofolio/src/data/profile.js).
3. Change `cv: null` to:
   ```javascript
   cv: '/cv/CV_Muhammad_Nabiel_Yandra.pdf'
   ```
The "Resume" download button in the navigation bar will automatically appear!

---

## 🌐 Deploy to GitHub & Vercel

### Step 1: Push to GitHub

```bash
git add .
git commit -m "feat: complete interactive portfolio website"
git branch -M main
gh repo create nabiel-portfolio --public --source=. --remote=origin --push
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **Add New...** > **Project**.
3. Import the `nabiel-portfolio` repository.
4. Framework Preset will be automatically detected as **Vite**.
5. Click **Deploy**.

Every future `git push` to your `main` branch will automatically deploy!
