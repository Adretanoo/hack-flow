import { Link } from 'react-router-dom'
import { Mail, Heart, Zap, Users, BookOpen, ExternalLink } from 'lucide-react'

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
)

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-md">
      <div className="container mx-auto px-6 py-12 md:px-8">

        {/* Top section */}
        <div className="grid gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">

          {/* Brand */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-4">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center transition-transform group-hover:scale-110 shrink-0">
                <Zap className="h-5 w-5 text-primary-foreground fill-current" />
              </div>
              <span className="text-xl font-bold tracking-tight">Hack-Flow</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Платформа для організації та участі у хакатонах. Розроблено у Коледжі УжНУ.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/Adretanoo/hack-flow"
                target="_blank"
                rel="noreferrer"
                title="GitHub репозиторій"
                className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <GithubIcon className="h-4 w-4" />
              </a>
              <a
                href="https://www.college.uzhnu.edu.ua/"
                target="_blank"
                rel="noreferrer"
                title="Коледж УжНУ"
                className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <a
                href="mailto:c.tehza.adrian@student.uzhnu.edu.ua"
                title="Написати нам"
                className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-foreground/50">Платформа</h4>
            <nav className="flex flex-col gap-3 text-sm font-medium">
              <Link to="/" className="text-muted-foreground hover:text-primary transition-colors flex items-center justify-center sm:justify-start gap-2">
                <Zap className="h-4 w-4 shrink-0" /> Хакатони
              </Link>
              <Link to="/mentors" className="text-muted-foreground hover:text-primary transition-colors flex items-center justify-center sm:justify-start gap-2">
                <Users className="h-4 w-4 shrink-0" /> Ментори
              </Link>
              <Link to="/guide" className="text-muted-foreground hover:text-primary transition-colors flex items-center justify-center sm:justify-start gap-2">
                <BookOpen className="h-4 w-4 shrink-0" /> Посібник
              </Link>
            </nav>
          </div>

          {/* About */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-foreground/50">Про проєкт</h4>
            <nav className="flex flex-col gap-3 text-sm font-medium">
              <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">
                Про нас
              </Link>
              <a
                href="https://www.college.uzhnu.edu.ua/"
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors flex items-center justify-center sm:justify-start gap-1"
              >
                Коледж УжНУ <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="mailto:c.tehza.adrian@student.uzhnu.edu.ua"
                className="text-muted-foreground hover:text-primary transition-colors text-xs break-all"
              >
                c.tehza.adrian@student.uzhnu.edu.ua
              </a>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-border flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            © {new Date().getFullYear()} Hack-Flow. Коледж УжНУ.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Зроблено з <Heart className="h-3.5 w-3.5 text-red-500 fill-current" /> в Україні
          </div>
        </div>
      </div>
    </footer>
  )
}
