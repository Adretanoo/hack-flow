// ── Shared API response envelope ─────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  data: T
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  total: number
  page: number
  limit: number
}

// ── Pagination ────────────────────────────────────────────────────────────
export interface PaginationMeta {
  total: number
  page: number
  limit: number
}

// ── Auth ──────────────────────────────────────────────────────────────────
export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface UserProfile {
  id: string
  email: string
  username: string
  fullName: string
  role: 'admin' | 'judge' | 'mentor' | 'participant'
  avatarUrl?: string | null
  description?: string | null
  isLookingForTeam: boolean
  createdAt: string
  deletedAt?: string | null
}

// ── Hackathon ─────────────────────────────────────────────────────────────
export type HackathonStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export interface Hackathon {
  id: string
  title: string
  subtitle?: string | null
  description?: string | null
  location?: string | null
  online: boolean
  startDate: string
  endDate: string
  minTeamSize: number
  maxTeamSize: number
  banner?: string | null
  rulesUrl?: string | null
  contactEmail?: string | null
  status: HackathonStatus
  createdAt: string
  tags?: Tag[]
  tracks?: Track[]
  stages?: Stage[]
  _count?: { teams: number; projects?: number }
}

export interface Track {
  id: string
  hackathonId: string
  name: string
  description?: string | null
}

export interface Stage {
  id: string
  hackathonId: string
  name: string
  startDate: string
  endDate: string
  orderIndex: number
}

// ── Team ──────────────────────────────────────────────────────────────────
export type TeamStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISQUALIFIED'

export interface Team {
  id: string
  hackathonId: string
  name: string
  description?: string | null
  logo?: string | null
  trackId?: string | null
  approvalStatus: TeamStatus
  createdAt: string
  hackathon?: { id: string; title: string }
  track?: { id: string; name: string } | null
  _count?: { members: number }
}

export interface TeamMember {
  id: string
  teamId: string
  userId: string
  role: 'captain' | 'member'
  joinedAt: string
  user?: {
    id: string
    fullName: string
    email: string
    avatarUrl?: string | null
  }
}

export interface TeamApproval {
  id: string
  teamId: string
  status: TeamStatus
  comment?: string | null
  approvedById?: string | null
  createdAt: string
  approvedBy?: { id: string; fullName: string; email: string } | null
}

export interface TeamInvite {
  id: string
  teamId: string
  token: string
  maxUses: number
  usesCount: number
  expiresAt: string
  isActive: boolean
}

// ── Project ───────────────────────────────────────────────────────────────
export type ProjectStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'

export interface ProjectResource {
  id: string
  projectId: string
  type: string
  url: string
  description?: string | null
}

export interface Project {
  id: string
  teamId: string
  stageId?: string | null
  title: string
  status: ProjectStatus
  submittedAt?: string | null
  reviewedAt?: string | null
  comment?: string | null
  resources?: ProjectResource[]
}

// ── User social ───────────────────────────────────────────────────────────
export interface UserSocial {
  id: string
  userId: string
  typeSocial: 'discord' | 'telegram' | 'viber' | 'github'
  url: string
}

// ── Audit log ─────────────────────────────────────────────────────────────
export interface AuditLogEntry {
  id: string
  userId: string
  action: string
  entityType?: string | null
  entityId?: string | null
  createdAt: string
}


// ── Tags ──────────────────────────────────────────────────────────────────
export interface Tag {
  id: string
  name: string
}

// ── Judging ───────────────────────────────────────────────────────────────
export interface Criteria {
  id: string
  trackId: string
  name: string
  description?: string | null
  maxScore: number
  weight: number
}

export interface Score {
  id: string
  judgeId: string
  projectId: string
  criteriaId: string
  assessment: number
  comment?: string | null
}

export interface Conflict {
  id: string
  judgeId: string
  teamId: string
  reason?: string | null
  createdAt: string
  judge?: { id: string; fullName: string; email: string }
  team?: { id: string; name: string }
}

export interface LeaderboardEntry {
  id?: string
  projectId: string
  teamName: string
  totalScore: number
  rank: number
}

// ── Mentorship ────────────────────────────────────────────────────────────
export interface MentorAvailability {
  id: string
  mentorId: string
  hackathonId?: string | null
  trackId?: string | null
  startDatetime: string
  endDatetime: string
  maxConcurrentSessions: number
  meetingLink?: string | null
  topics?: string[]
}

export interface MentorSlot {
  id: string
  mentorAvailabilityId: string
  teamId: string
  startDatetime: string
  durationMinute: number
  meetingLink?: string | null
  status: 'booked' | 'completed' | 'cancelled'
}

// ── Awards ────────────────────────────────────────────────────────────────
export interface PhysicalGift {
  id: string
  awardId: string
  name: string
  description?: string | null
  image?: string | null
}

export interface Award {
  id: string
  hackathonId: string
  name: string
  place: number
  certificate?: string | null
  description?: string | null
  physicalGifts?: PhysicalGift[]
}

// ── Judge assignment ──────────────────────────────────────────────────────
export interface JudgeAssignment {
  id: string
  userId: string
  trackId: string
  hackathonId: string
  isHeadJudge: boolean
  user?: {
    id: string
    fullName: string
    email: string
    avatarUrl?: string | null
  }
}
