import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage.jsx'
import DashboardLogin from './pages/DashboardLogin.jsx'
import DashboardRSVP from './pages/DashboardRSVP.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import OnboardingPage from './pages/OnboardingPage.jsx'
import EditorPage from './pages/EditorPage.jsx'
import InvitationPage from './pages/InvitationPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardLogin />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/dashboard/:slug" element={<DashboardRSVP />} />
        <Route path="/dashboard/:slug/edit" element={<EditorPage />} />
        <Route path="/:slug" element={<InvitationPage />} />
      </Routes>
    </BrowserRouter>
  )
}
