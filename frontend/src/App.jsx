import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage.jsx'
import DashboardLogin from './pages/DashboardLogin.jsx'
import DashboardRSVP from './pages/DashboardRSVP.jsx'
import InvitationPage from './pages/InvitationPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardLogin />} />
        <Route path="/dashboard/:slug" element={<DashboardRSVP />} />
        <Route path="/:slug" element={<InvitationPage />} />
      </Routes>
    </BrowserRouter>
  )
}
