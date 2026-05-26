import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Zap, BookOpen, ChevronRight, CheckCircle2, ArrowRight,
  UserPlus, Search, Star, Calendar, Trophy, Bell,
  MessageSquare, ClipboardList, Award, BarChart3,
  LogIn, Settings, FileText, Eye, ThumbsUp, AlertTriangle, Home
} from 'lucide-react'
import { useI18n } from '@/i18n'

type Role = 'participant' | 'judge' | 'mentor'

interface Step {
  icon: React.ReactNode
  title: string
  description: string
  tip?: string
}

const ROLES_META: { key: Role; icon: React.ReactNode; color: string; bg: string }[] = [
  {
    key: 'participant',
    icon: <Users className="h-5 w-5" />,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/30',
  },
  {
    key: 'judge',
    icon: <Star className="h-5 w-5" />,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30',
  },
  {
    key: 'mentor',
    icon: <BookOpen className="h-5 w-5" />,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
  },
]

function StepCard({ step }: { step: Step }) {
  return (
    <div className="group relative flex gap-5 rounded-2xl border border-border bg-card/60 p-6 hover:border-primary/30 hover:bg-card transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
      <div className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-gradient-to-b from-primary/60 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-muted/60 flex items-center justify-center">
        {step.icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground mb-2 leading-tight">{step.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
        {step.tip && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-primary/8 border border-primary/20 px-3 py-2">
            <Zap className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-primary/90 font-medium leading-relaxed">{step.tip}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function UserGuidePage() {
  const [activeRole, setActiveRole] = useState<Role>('participant')
  const { t } = useI18n()

  const participantStepsIcons = [
    <UserPlus className="h-6 w-6 text-blue-400" />,
    <Search className="h-6 w-6 text-blue-400" />,
    <Users className="h-6 w-6 text-blue-400" />,
    <Search className="h-6 w-6 text-blue-400" />,
    <FileText className="h-6 w-6 text-blue-400" />,
    <Calendar className="h-6 w-6 text-blue-400" />,
    <Trophy className="h-6 w-6 text-blue-400" />
  ]

  const judgeStepsIcons = [
    <LogIn className="h-6 w-6 text-amber-400" />,
    <ClipboardList className="h-6 w-6 text-amber-400" />,
    <AlertTriangle className="h-6 w-6 text-amber-400" />,
    <Star className="h-6 w-6 text-amber-400" />,
    <Eye className="h-6 w-6 text-amber-400" />,
    <BarChart3 className="h-6 w-6 text-amber-400" />
  ]

  const mentorStepsIcons = [
    <LogIn className="h-6 w-6 text-emerald-400" />,
    <Calendar className="h-6 w-6 text-emerald-400" />,
    <ThumbsUp className="h-6 w-6 text-emerald-400" />,
    <Bell className="h-6 w-6 text-emerald-400" />,
    <CheckCircle2 className="h-6 w-6 text-emerald-400" />,
    <Settings className="h-6 w-6 text-emerald-400" />
  ]

  const getStepsForRole = (role: Role): Step[] => {
    if (role === 'participant') {
      return t.userGuide.participantSteps.map((step, idx) => ({
        icon: participantStepsIcons[idx],
        ...step
      }))
    }
    if (role === 'judge') {
      return t.userGuide.judgeSteps.map((step, idx) => ({
        icon: judgeStepsIcons[idx],
        ...step
      }))
    }
    return t.userGuide.mentorSteps.map((step, idx) => ({
      icon: mentorStepsIcons[idx],
      ...step
    }))
  }

  const steps = getStepsForRole(activeRole)

  const roles = ROLES_META.map(r => {
    let label = ''
    if (r.key === 'participant') label = t.userGuide.participantLabel
    if (r.key === 'judge') label = t.userGuide.judgeLabel
    if (r.key === 'mentor') label = t.userGuide.mentorLabel
    return { ...r, label }
  })

  const role = roles.find(r => r.key === activeRole)!

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(var(--primary-rgb),0.15),transparent)]" />
        <div className="relative container mx-auto px-4 py-20 md:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <BookOpen className="h-4 w-4" />
            {t.userGuide.guideTitle}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
            {t.userGuide.heroTitle}<br />
            <span className="text-primary">{t.userGuide.heroTitle2}</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t.userGuide.heroSubtitle}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 md:px-8 max-w-4xl">

        {/* Quick nav */}
        <div className="grid grid-cols-3 gap-3 mb-12">
          {roles.map(r => (
            <button
              key={r.key}
              onClick={() => setActiveRole(r.key)}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-5 transition-all duration-200 ${
                activeRole === r.key
                  ? `${r.bg} border-opacity-100 shadow-lg`
                  : 'border-border bg-card/40 hover:bg-card hover:border-border/80'
              }`}
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${activeRole === r.key ? r.color : 'text-muted-foreground'} ${activeRole === r.key ? 'bg-current/10' : 'bg-muted'}`}>
                <span className={activeRole === r.key ? r.color : 'text-muted-foreground'}>
                  {r.icon}
                </span>
              </div>
              <span className={`text-sm font-semibold ${activeRole === r.key ? r.color : 'text-muted-foreground'}`}>
                {r.label}
              </span>
              {activeRole === r.key && (
                <div className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${r.bg} ${r.color}`}>
                  {t.userGuide.selectedBadge}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Role description */}
        <div className={`rounded-2xl border p-6 mb-8 ${role.bg}`}>
          <div className="flex items-center gap-3 mb-2">
            <span className={role.color}>{role.icon}</span>
            <h2 className={`text-lg font-bold ${role.color}`}>
              {activeRole === 'participant' && t.userGuide.participantRoleTitle}
              {activeRole === 'judge' && t.userGuide.judgeRoleTitle}
              {activeRole === 'mentor' && t.userGuide.mentorRoleTitle}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {activeRole === 'participant' && t.userGuide.participantRoleDesc}
            {activeRole === 'judge' && t.userGuide.judgeRoleDesc}
            {activeRole === 'mentor' && t.userGuide.mentorRoleDesc}
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-16">
          {steps.map((step, i) => (
            <StepCard key={i} step={step} />
          ))}
        </div>

        {/* FAQ / Common questions */}
        <div className="rounded-2xl border border-border bg-card/60 p-8 mb-12">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            {t.userGuide.faqTitle}
          </h2>
          <div className="space-y-5">
            {t.userGuide.faq.map((item, i) => (
              <div key={i} className="border-b border-border last:border-0 pb-5 last:pb-0">
                <p className="font-semibold text-sm text-foreground mb-1.5 flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  {item.q}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed pl-6">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Glossary */}
        <div className="rounded-2xl border border-border bg-card/60 p-8 mb-12">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {t.userGuide.glossaryTitle}
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {t.userGuide.glossary.map((item, i) => (
              <div key={i} className="rounded-xl bg-muted/40 p-4">
                <p className="font-semibold text-sm text-primary mb-1">{item.term}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.def}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center rounded-2xl border border-primary/20 bg-primary/5 p-10">
          <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Award className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-2xl font-bold mb-3">{t.userGuide.ctaTitle}</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {t.userGuide.ctaSubtitle}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {t.userGuide.ctaRegister} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-accent transition-colors"
            >
              <Home className="h-4 w-4" /> {t.userGuide.ctaHome}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
