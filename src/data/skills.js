import {
  SiPytorch, SiTensorflow, SiScikitlearn, SiKaggle,
  SiPython, SiPhp, SiHtml5, SiMysql,
  SiDocker, SiGit, SiGithub, SiGitlab,
} from 'react-icons/si'
import { FaJava } from 'react-icons/fa6'
import { FiGitMerge, FiMic, FiMessageCircle, FiTarget, FiZap, FiUsers, FiAward } from 'react-icons/fi'

/**
 * Skill groups. `color` is the brand color revealed on hover.
 * `span` controls the bento-grid size (1 or 2 columns).
 */
export const skillGroups = [
  {
    id: 'ml',
    title: { en: 'Machine Learning & Data', id: 'Machine Learning & Data' },
    caption: { en: 'Training models, exploring datasets.', id: 'Melatih model, mengeksplorasi dataset.' },
    span: 2,
    visual: 'loss',
    items: [
      { name: 'PyTorch', icon: SiPytorch, color: '#EE4C2C' },
      { name: 'TensorFlow', icon: SiTensorflow, color: '#FF6F00' },
      { name: 'scikit-learn', icon: SiScikitlearn, color: '#F7931E' },
      { name: 'Kaggle', icon: SiKaggle, color: '#20BEFF' },
    ],
  },
  {
    id: 'lang',
    title: { en: 'Languages', id: 'Bahasa Pemrograman' },
    caption: { en: 'Daily drivers.', id: 'Yang dipakai sehari-hari.' },
    span: 1,
    items: [
      { name: 'Python', icon: SiPython, color: '#3776AB' },
      { name: 'Java', icon: FaJava, color: '#ED8B00' },
      { name: 'PHP', icon: SiPhp, color: '#777BB4' },
    ],
  },
  {
    id: 'web',
    title: { en: 'Web & Database', id: 'Web & Basis Data' },
    caption: { en: 'Building and storing.', id: 'Membangun dan menyimpan.' },
    span: 1,
    items: [
      { name: 'HTML5', icon: SiHtml5, color: '#E34F26' },
      { name: 'MySQL', icon: SiMysql, color: '#4479A1' },
    ],
  },
  {
    id: 'tools',
    title: { en: 'Tools & DevOps', id: 'Tools & DevOps' },
    caption: { en: 'Shipping and collaborating.', id: 'Rilis dan kolaborasi.' },
    span: 2,
    visual: 'git',
    items: [
      { name: 'Docker', icon: SiDocker, color: '#2496ED' },
      { name: 'Git', icon: SiGit, color: '#F05032' },
      { name: 'GitHub', icon: SiGithub, color: '#8B949E' },
      { name: 'GitLab', icon: SiGitlab, color: '#FC6D26' },
    ],
  },
  {
    id: 'systems',
    title: { en: 'Systems & Soft Skills', id: 'Sistem & Soft Skills' },
    caption: { en: 'The human side of engineering.', id: 'Sisi manusia dari engineering.' },
    span: 3,
    visual: 'flow',
    items: [
      { name: 'BPMN', icon: FiGitMerge, color: '#FF7A1A' },
      { name: { en: 'Teaching & Presentation', id: 'Mengajar & Presentasi' }, icon: FiMic, color: '#FFB547' },
      { name: { en: 'English Communication', id: 'Komunikasi Bahasa Inggris' }, icon: FiMessageCircle, color: '#8FA8FF' },
      { name: { en: 'Critical Thinking', id: 'Berpikir Kritis' }, icon: FiTarget, color: '#FF7A1A' },
      { name: { en: 'Problem Solving', id: 'Pemecahan Masalah' }, icon: FiZap, color: '#FFB547' },
      { name: { en: 'Teamwork & Leadership', id: 'Kerja Tim & Kepemimpinan' }, icon: FiUsers, color: '#8FA8FF' },
      { name: { en: 'Negotiation', id: 'Negosiasi' }, icon: FiAward, color: '#FF7A1A' },
    ],
  },
]

export const marqueeItems = [
  'Python', 'PyTorch', 'TensorFlow', 'scikit-learn', 'Kaggle', 'Java', 'PHP',
  'HTML5', 'MySQL', 'Docker', 'Git', 'GitHub', 'GitLab', 'BPMN',
]
