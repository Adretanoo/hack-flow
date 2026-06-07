import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { AppCabinetLayout } from '@/components/layout/AppCabinetLayout'
import { RoleGuard } from '@/components/layout/RoleGuard'

import { HomePage } from '@/pages/home/HomePage'
import { HackathonPublicPage } from '@/pages/home/HackathonPublicPage'
import { UserGuidePage } from '@/pages/home/UserGuidePage'
import { AboutPage } from '@/pages/home/AboutPage'
import { MentorsPage } from '@/pages/home/MentorsPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ProfilePage } from '@/pages/shared/ProfilePage'
import { HackathonsPage } from '@/pages/participant/HackathonsPage'
import { HackathonDashboardPage } from '@/pages/participant/HackathonDashboardPage'
import { MatchmakingPage } from '@/pages/participant/MatchmakingPage'
import { JoinTeamPage } from '@/pages/participant/JoinTeamPage'

import { JudgeProjectsPage } from '@/pages/judge/JudgeProjectsPage'
import { JudgeScorePage } from '@/pages/judge/JudgeScorePage'
import { JudgeScoresOverviewPage } from '@/pages/judge/JudgeScoresOverviewPage'
import { JudgeConflictsPage } from '@/pages/judge/JudgeConflictsPage'
import { MentorAvailabilityPage } from '@/pages/mentor/MentorAvailabilityPage'
import { MentorSlotsPage } from '@/pages/mentor/MentorSlotsPage'

import { useAuthStore } from '@/store/auth.store'

// Organizer and Admin redirect to admin panel (port 5173)
const ADMIN_URL = 'http://localhost:5173'

function AppRedirect() {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" />

  // Organizer and admin → redirect to admin panel
  if (user.role === 'admin' || user.role === 'organizer') {
    window.location.href = ADMIN_URL
    return null
  }
  if (user.role === 'judge')  return <Navigate to="/app/judge/projects" />
  if (user.role === 'mentor') return <Navigate to="/app/mentor/slots" />
  return <Navigate to="/app/hackathons" />
}

export const router = createBrowserRouter([
  // Public join page
  { path: '/join/:token', element: <JoinTeamPage /> },

  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'hackathons/:id', element: <HackathonPublicPage /> },
      { path: 'guide', element: <UserGuidePage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'mentors', element: <MentorsPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
    ],
  },
  {
    path: '/app',
    element: <AppCabinetLayout />,
    children: [
      { index: true, element: <AppRedirect /> },
      {
        path: 'profile',
        element: (
          <RoleGuard roles={['participant', 'judge', 'mentor']}>
            <ProfilePage />
          </RoleGuard>
        ),
      },
      // ── Participant ────────────────────────────────────────────────────────
      { path: 'hackathons', element: <RoleGuard roles={['participant']}><HackathonsPage /></RoleGuard> },
      { path: 'hackathons/:hackathonId', element: <RoleGuard roles={['participant']}><HackathonDashboardPage /></RoleGuard> },
      { path: 'matchmaking', element: <RoleGuard roles={['participant']}><MatchmakingPage /></RoleGuard> },
      // ── Judge ──────────────────────────────────────────────────────────────
      { path: 'judge/projects', element: <RoleGuard roles={['judge']}><JudgeProjectsPage /></RoleGuard> },
      { path: 'judge/score/:projectId', element: <RoleGuard roles={['judge']}><JudgeScorePage /></RoleGuard> },
      { path: 'judge/scores', element: <RoleGuard roles={['judge']}><JudgeScoresOverviewPage /></RoleGuard> },
      { path: 'judge/conflicts', element: <RoleGuard roles={['judge']}><JudgeConflictsPage /></RoleGuard> },
      // ── Mentor ─────────────────────────────────────────────────────────────
      { path: 'mentor/availability', element: <RoleGuard roles={['mentor']}><MentorAvailabilityPage /></RoleGuard> },
      { path: 'mentor/slots', element: <RoleGuard roles={['mentor']}><MentorSlotsPage /></RoleGuard> },
    ],
  },
])
