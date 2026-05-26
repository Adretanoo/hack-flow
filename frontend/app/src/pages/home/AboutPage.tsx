import { ExternalLink, Mail, Zap, GraduationCap, Code2, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
)

export function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 md:px-8 max-w-4xl space-y-16">

        {/* Hero */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Zap className="h-4 w-4" />
            Студентський проєкт
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Про <span className="text-primary">Hack-Flow</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Hack-Flow — платформа для організації та проведення хакатонів, розроблена студентами
            Коледжу УжНУ як дипломний проєкт.
          </p>
        </div>

        {/* About project */}
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              icon: Trophy,
              title: 'Хакатони',
              desc: 'Повний цикл управління хакатонами: реєстрація, команди, проєкти, суддівство та результати.',
            },
            {
              icon: GraduationCap,
              title: 'Ментори',
              desc: 'Система менторства з бронюванням слотів та підтримкою команд під час хакатону.',
            },
            {
              icon: Code2,
              title: 'Відкритий код',
              desc: 'Проєкт з відкритим вихідним кодом, доступний на GitHub для вивчення та розвитку.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-6 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Author */}
        <div className="rounded-xl border border-border bg-card p-8 space-y-6">
          <h2 className="text-2xl font-bold">Розробник</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
              A
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-lg">Адріан Тежа</p>
              <p className="text-sm text-muted-foreground">Студент Коледжу УжНУ</p>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <a
                  href="mailto:c.tehza.adrian@student.uzhnu.edu.ua"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  c.tehza.adrian@student.uzhnu.edu.ua
                </a>
                <a
                  href="https://github.com/Adretanoo/hack-flow"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <GithubIcon className="h-4 w-4" />
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* College */}
        <div className="rounded-xl border border-border bg-card p-8 space-y-4">
          <h2 className="text-2xl font-bold">Навчальний заклад</h2>
          <p className="text-muted-foreground">
            Проєкт розроблений на базі <strong>Коледжу Ужгородського національного університету</strong>.
          </p>
          <a
            href="https://www.college.uzhnu.edu.ua/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Сайт коледжу <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {/* Tech stack */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Технології</h2>
          <div className="flex flex-wrap gap-2">
            {['React', 'TypeScript', 'Node.js', 'Fastify', 'PostgreSQL', 'Drizzle ORM', 'TailwindCSS', 'TanStack Query'].map(t => (
              <span key={t} className="rounded-full bg-muted px-3 py-1 text-sm font-medium">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Zap className="h-4 w-4" />
            Переглянути хакатони
          </Link>
        </div>

      </div>
    </div>
  )
}
