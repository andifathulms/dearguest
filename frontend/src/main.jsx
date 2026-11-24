import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { startErrorTracking } from './observability.js'
import './ui.css'
import './index.css'
// The brand system loads with the entry, so it always comes before a page's
// own CSS. Imported only from lazy pages, the production build split it into
// a chunk that loaded after the page's file and won every equal-specificity
// tie (the landing hero's phones went full width).
import './brand/brand.css'

startErrorTracking()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
