// Single source of truth for the theme catalog — used by the landing page
// (featured subset) and the /tema gallery (full, filterable list).
export const THEME_CATALOG = [
  { id: 'javanese-dark', name: 'Javanese Malam Emas', desc: 'Elegan dengan sentuhan emas pada latar gelap tembakau.', preview: 'tp-javanese', demo: 'demo-javanese', colors: ['#1a1208', '#c9a84c', '#f5eed6'], category: 'Elegan & Mewah' },
  { id: 'floral-light', name: 'Taman Bunga', desc: 'Romantis dengan nuansa mawar pada latar putih blush.', preview: 'tp-floral', demo: 'demo-floral', colors: ['#fdf8f5', '#c4847a', '#f7ede8'], category: 'Floral & Lembut' },
  { id: 'modern-minimalist', name: 'Minimalis Putih', desc: 'Bersih dan modern dengan aksen sage yang menenangkan.', preview: 'tp-modern', demo: 'demo-minimalis', colors: ['#ffffff', '#1f1f1f', '#8a9e8a'], category: 'Modern' },
  { id: 'luxury-emerald', name: 'Zamrud Mewah', desc: 'Mewah dengan zamrud gelap dan aksen emas yang berkilau.', preview: 'tp-emerald', demo: 'demo-emerald', colors: ['#0e1f17', '#d4af5a', '#1f4d3a'], category: 'Elegan & Mewah' },
  { id: 'rustic-kraft', name: 'Rustic Kraft', desc: 'Hangat dan natural dengan nuansa kertas kraft & dedaunan.', preview: 'tp-kraft', demo: 'demo-rustic', colors: ['#f3ece0', '#7c8b6b', '#b9694f'], category: 'Rustic & Botani' },
  { id: 'boho-terracotta', name: 'Senja Terakota', desc: 'Bohemian hangat dengan gradasi terakota dan senja.', preview: 'tp-boho', demo: 'demo-boho', colors: ['#fbf3ea', '#c06a4d', '#d8b48a'], category: 'Rustic & Botani' },
  { id: 'burgundy-gold', name: 'Marun Anggun', desc: 'Mewah dengan nuansa marun anggur dan kilau emas.', preview: 'tp-burgundy', demo: 'demo-marun', colors: ['#2a0e16', '#cba35a', '#6e1f31'], category: 'Elegan & Mewah' },
  { id: 'dusty-blue', name: 'Biru Senja', desc: 'Elegan dan tenang dengan biru dusty pada latar krem.', preview: 'tp-blue', demo: 'demo-biru', colors: ['#eef2f6', '#6e88a6', '#2c3a47'], category: 'Floral & Lembut' },
  { id: 'midnight-celestial', name: 'Langit Malam', desc: 'Romantis dengan langit malam, bintang, dan aksen emas.', preview: 'tp-midnight', demo: 'demo-langit', colors: ['#0d1330', '#d8c074', '#1b234e'], category: 'Elegan & Mewah' },
  { id: 'sage-botanical', name: 'Kebun Sage', desc: 'Segar dan natural dengan hijau sage & dedaunan eukaliptus.', preview: 'tp-sage', demo: 'demo-sage', colors: ['#eef2ea', '#7d9471', '#3f5340'], category: 'Rustic & Botani' },
  { id: 'mauve-rose', name: 'Mauve Anggun', desc: 'Anggun dan lembut dengan nuansa mauve dusty rose.', preview: 'tp-mauve', demo: 'demo-mauve', colors: ['#f6eef0', '#b07c8a', '#6e4452'], category: 'Floral & Lembut' },
  { id: 'ivory-classic', name: 'Klasik Gading', desc: 'Klasik abadi dengan gading, sampanye, dan emas.', preview: 'tp-ivory', demo: 'demo-gading', colors: ['#f7f1e6', '#c9a86a', '#e3d2ac'], category: 'Klasik' },
  { id: 'tropical-green', name: 'Tropis Hijau', desc: 'Tropis mewah dengan dedaunan monstera & aksen emas.', preview: 'tp-tropical', demo: 'demo-tropis', colors: ['#0f2417', '#d8b65a', '#3c6b4a'], category: 'Elegan & Mewah' },
  { id: 'lavender-dream', name: 'Lembayung', desc: 'Lembut dan dreamy dengan nuansa lavender.', preview: 'tp-lavender', demo: 'demo-lembayung', colors: ['#f1edf7', '#8a76b0', '#4e4068'], category: 'Floral & Lembut' },
  { id: 'coral-peach', name: 'Koral Hangat', desc: 'Hangat dan ceria dengan gradasi koral & persik.', preview: 'tp-coral', demo: 'demo-koral', colors: ['#fdf0ea', '#e08a6a', '#9c4e3a'], category: 'Floral & Lembut' },
  { id: 'charcoal-marble', name: 'Marmer Arang', desc: 'Modern dan mewah dengan arang gelap & tekstur marmer.', preview: 'tp-charcoal', demo: 'demo-marmer', colors: ['#1e1e22', '#c9a86a', '#b8b8c0'], category: 'Modern' },
  { id: 'islamic-arabesque', name: 'Arabesque Emas', desc: 'Islami elegan dengan motif geometris hijau & emas.', preview: 'tp-arabesque', demo: 'demo-arabesque', colors: ['#0e2a24', '#d4af5a', '#1f6b56'], category: 'Klasik' },
  { id: 'navy-gold', name: 'Navy Klasik', desc: 'Formal dan berkelas dengan navy dalam & emas.', preview: 'tp-navy', demo: 'demo-navy', colors: ['#101a33', '#c9a86a', '#2a3f66'], category: 'Klasik' },
  { id: 'plum-gold', name: 'Plum Anggur', desc: 'Mewah dengan nuansa plum anggur gelap dan kilau emas.', preview: 'tp-plum', demo: 'demo-plum', colors: ['#241026', '#cba35a', '#5a2a5e'], category: 'Elegan & Mewah' },
  { id: 'teal-ocean', name: 'Teal Samudra', desc: 'Elegan jewel-tone dengan teal samudra dalam & aksen emas.', preview: 'tp-teal', demo: 'demo-teal', colors: ['#07252b', '#d6b45c', '#1f6b6b'], category: 'Elegan & Mewah' },
  { id: 'deco-noir', name: 'Deco Hitam Emas', desc: 'Glamor Art Deco dengan hitam pekat dan ornamen emas.', preview: 'tp-deco', demo: 'demo-deco', colors: ['#0c0c0e', '#cda349', '#16161a'], category: 'Elegan & Mewah' },
  { id: 'sunflower-mustard', name: 'Bunga Matahari', desc: 'Ceria dan hangat dengan kuning bunga matahari.', preview: 'tp-sunflower', demo: 'demo-matahari', colors: ['#fdf6e3', '#d49a2a', '#8a6418'], category: 'Rustic & Botani' },
  { id: 'beige-korean', name: 'Aesthetic Beige', desc: 'Minimalis tenang dengan nuansa beige aesthetic ala Korea.', preview: 'tp-beige', demo: 'demo-beige', colors: ['#f3ede4', '#a89a86', '#6b5f4e'], category: 'Modern' },
  { id: 'rose-gold', name: 'Rose Gold', desc: 'Anggun dan feminin dengan kilau rose gold metalik.', preview: 'tp-rosegold', demo: 'demo-rosegold', colors: ['#fbeee9', '#c98a76', '#9c5a4a'], category: 'Klasik' },
  { id: 'mono-editorial', name: 'Editorial Mono', desc: 'Editorial monokrom hitam-putih dengan tipografi tegas.', preview: 'tp-mono', demo: 'demo-mono', colors: ['#ffffff', '#111111', '#777777'], category: 'Modern' },
  { id: 'royal-purple', name: 'Ungu Kerajaan', desc: 'Megah dan regal dengan ungu kerajaan dan emas.', preview: 'tp-purple', demo: 'demo-ungu', colors: ['#1e1233', '#cba35a', '#46276b'], category: 'Elegan & Mewah' },
  { id: 'marble-white', name: 'Marmer Putih', desc: 'Mewah dan bersih dengan tekstur marmer putih dan emas.', preview: 'tp-marble', demo: 'demo-marmerputih', colors: ['#f8f6f2', '#c2a35e', '#d8d2c6'], category: 'Klasik' },
]

// Filter categories for the gallery (order matters; "Semua" first).
export const THEME_CATEGORIES = ['Semua', 'Elegan & Mewah', 'Floral & Lembut', 'Klasik', 'Modern', 'Rustic & Botani']

// A curated, visually diverse 6 surfaced on the landing page.
export const FEATURED_THEME_IDS = ['javanese-dark', 'luxury-emerald', 'midnight-celestial', 'floral-light', 'sage-botanical', 'ivory-classic']

export const FEATURED_THEMES = FEATURED_THEME_IDS
  .map(id => THEME_CATALOG.find(t => t.id === id))
  .filter(Boolean)
