import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Route-level code splitting: each page (and its deps) loads on demand,
// so a guest opening an invitation never downloads the editor/cropper/etc.
const LandingPage = lazy(() => import('./pages/LandingPage.jsx'))
const ThemesGalleryPage = lazy(() => import('./pages/ThemesGalleryPage.jsx'))
const ThemeDetailPage = lazy(() => import('./pages/ThemeDetailPage.jsx'))
const DashboardLogin = lazy(() => import('./pages/DashboardLogin.jsx'))
const DashboardRSVP = lazy(() => import('./pages/DashboardRSVP.jsx'))
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'))
const OnboardingPage = lazy(() => import('./pages/OnboardingPage.jsx'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.jsx'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage.jsx'))
const MyInvitationsPage = lazy(() => import('./pages/MyInvitationsPage.jsx'))
const EditorPage = lazy(() => import('./pages/EditorPage.jsx'))
const SendQueuePage = lazy(() => import('./pages/SendQueuePage.jsx'))
const InvitationPage = lazy(() => import('./pages/InvitationPage.jsx'))

function Loading() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#8a7f74', fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}>
      Memuat…
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/tema" element={<ThemesGalleryPage />} />
          <Route path="/tema/:id" element={<ThemeDetailPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardLogin />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/my" element={<MyInvitationsPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/dashboard/:slug" element={<DashboardRSVP />} />
          <Route path="/dashboard/:slug/edit" element={<EditorPage />} />
          <Route path="/dashboard/:slug/kirim" element={<SendQueuePage />} />
          <Route path="/:slug/:code" element={<InvitationPage />} />
          <Route path="/:slug" element={<InvitationPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
