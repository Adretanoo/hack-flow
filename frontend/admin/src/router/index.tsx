import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { PageLayout } from '@/components/layout/PageLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { HackathonsListPage } from '@/pages/hackathons/HackathonsListPage'
import { HackathonFormPage } from '@/pages/hackathons/HackathonFormPage'
import { HackathonDetailPage } from '@/pages/hackathons/HackathonDetailPage'
import { TeamsListPage } from '@/pages/teams/TeamsListPage'
import { TeamDetailPage } from '@/pages/teams/TeamDetailPage'
import { UsersListPage } from '@/pages/users/UsersListPage'
import { UserDetailPage } from '@/pages/users/UserDetailPage'
import { JudgingPage } from '@/pages/judging/JudgingPage'
import { MentorshipPage } from '@/pages/mentorship/MentorshipPage'



const NotFoundPage = () => (
  <div className="flex h-screen flex-col items-center justify-center gap-2">
    <p className="text-7xl font-extrabold text-muted">404</p>
    <p className="text-xl font-semibold">Сторінку не знайдено</p>
  </div>
)

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <PageLayout>{children}</PageLayout>
    </ProtectedRoute>
  )
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/', element: <Navigate to="/dashboard" replace /> },

  { path: '/dashboard',           element: <Protected><DashboardPage /></Protected> },

  // ── Hackathons ──────────────────────────────────────────────────────────
  { path: '/hackathons',          element: <Protected><HackathonsListPage /></Protected> },
  { path: '/hackathons/new',      element: <Protected><HackathonFormPage /></Protected> },
  { path: '/hackathons/:id',      element: <Protected><HackathonDetailPage /></Protected> },
  { path: '/hackathons/:id/edit', element: <Protected><HackathonFormPage /></Protected> },

  // ── Teams ───────────────────────────────────────────────────────────────
  { path: '/teams',               element: <Protected><TeamsListPage /></Protected> },
  { path: '/teams/:id',           element: <Protected><TeamDetailPage /></Protected> },

  // ── Users ───────────────────────────────────────────────────────────────
  { path: '/users',               element: <Protected><UsersListPage /></Protected> },
  { path: '/users/:id',           element: <Protected><UserDetailPage /></Protected> },

  // ── Judging ─────────────────────────────────────────────────────────────
  { path: '/judging',                  element: <Protected><JudgingPage /></Protected> },
  { path: '/judging/:hackathonId',     element: <Protected><JudgingPage /></Protected> },

  // ── Mentorship ──────────────────────────────────────────────────────────
  { path: '/mentorship',               element: <Protected><MentorshipPage /></Protected> },
  { path: '/mentorship/:hackathonId',  element: <Protected><MentorshipPage /></Protected> },

  { path: '*', element: <NotFoundPage /> },
])
