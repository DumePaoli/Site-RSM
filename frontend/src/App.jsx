import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { LangProvider } from './contexts/LangContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import CheckoutPage from './pages/CheckoutPage'
import SuccessPage from './pages/SuccessPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import AdminPage from './pages/AdminPage'
import BotPage from './pages/BotPage'
import StatusPage from './pages/StatusPage'
import CGVPage from './pages/CGVPage'
import PrivacyPage from './pages/PrivacyPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-[#0b0d0e]">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/"          element={<HomePage />} />
              <Route path="/checkout"  element={<CheckoutPage />} />
              <Route path="/success"   element={<SuccessPage />} />
              <Route path="/login"     element={<LoginPage />} />
              <Route path="/register"  element={<RegisterPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/admin"     element={<AdminPage />} />
              <Route path="/bot"       element={<BotPage />} />
              <Route path="/status"          element={<StatusPage />} />
              <Route path="/cgv"            element={<CGVPage />} />
              <Route path="/confidentialite" element={<PrivacyPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password"  element={<ResetPasswordPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </LangProvider>
  )
}
