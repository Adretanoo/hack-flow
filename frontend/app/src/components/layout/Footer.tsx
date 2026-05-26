import { Link } from 'react-router-dom'
import { Mail, Heart, Zap, Shield, Users, BookOpen } from 'lucide-react'

// Custom social icons (Lucide removed brand icons in v1.0)
const Github = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
)

const Twitter = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
)

const Linkedin = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-md">
      <div className="container mx-auto px-4 py-16 md:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand & Mission */}
          <div className="space-y-6">
            <Link to="#" className="flex items-center gap-2 group">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center transition-transform group-hover:scale-110">
                <Zap className="h-6 w-6 text-primary-foreground fill-current" />
              </div>
              <span className="text-2xl font-bold tracking-tight">Hack-Flow</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Найкраща платформа для організації та участі у хакатонах. Створюємо інновації разом, крок за кроком.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold uppercase tracking-widest text-foreground/50">Платформа</h4>
            <nav className="flex flex-col gap-4 text-sm font-medium">
              <Link to="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                <Zap className="h-4 w-4" /> Хакатони
              </Link>
              <Link to="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                <Users className="h-4 w-4" /> Ментори
              </Link>
              <Link to="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                <Shield className="h-4 w-4" /> Правила
              </Link>
              <Link to="/guide" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Посібник користувача
              </Link>
            </nav>
          </div>

          {/* Company */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold uppercase tracking-widest text-foreground/50">Компанія</h4>
            <nav className="flex flex-col gap-4 text-sm font-medium text-muted-foreground">
              <Link to="#" className="hover:text-primary transition-colors">Про нас</Link>
              <Link to="#" className="hover:text-primary transition-colors">Блог</Link>
              <Link to="#" className="hover:text-primary transition-colors">Кар'єра</Link>
              <Link to="#" className="hover:text-primary transition-colors">Конфіденційність</Link>
            </nav>
          </div>

          {/* Newsletter */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold uppercase tracking-widest text-foreground/50">Залишайтесь на зв'язку</h4>
            <p className="text-sm text-muted-foreground">
              Отримуйте новини про нові хакатони прямо у вашу пошту.
            </p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Ваш email" 
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                OK
              </button>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border flex flex-col items-center justify-between gap-6 md:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Hack-Flow. Всі права захищені.
          </p>
          <Link
            to="/guide"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Посібник користувача
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Зроблено з <Heart className="h-3.5 w-3.5 text-red-500 fill-current" /> в Україні
          </div>
        </div>
      </div>
    </footer>
  )
}
