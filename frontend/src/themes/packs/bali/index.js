// Bali pack entry: its own chunk, loaded only for invitations using it.
import './fonts/fonts.css'
import './tokens.css'
import './overrides.css'
import manifest from './theme.json'
import { definePack } from '../_system/ThemeContext.jsx'

export default definePack({
  manifest,
  urls: {
    ...import.meta.glob('./assets/*.{webp,avif,png,jpg,json}', { eager: true, query: '?url', import: 'default' }),
    ...import.meta.glob('./fonts/*.woff2', { eager: true, query: '?url', import: 'default' }),
  },
  svgs: import.meta.glob('./assets/*.svg', { eager: true, query: '?raw', import: 'default' }),
  components: import.meta.glob('./slots/*.jsx', { eager: true, import: 'default' }),
})
