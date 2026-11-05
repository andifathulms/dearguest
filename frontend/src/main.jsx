import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { startErrorTracking } from './observability.js'
import './ui.css'
import './index.css'

startErrorTracking()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
