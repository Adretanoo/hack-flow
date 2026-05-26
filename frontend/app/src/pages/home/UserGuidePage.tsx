import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Zap, BookOpen, ChevronRight, CheckCircle2, ArrowRight,
  UserPlus, Search, Star, Calendar, Trophy, Bell,
  MessageSquare, ClipboardList, Award, BarChart3,
  LogIn, Settings, FileText, Eye, ThumbsUp, AlertTriangle, Home
} from 'lucide-react'

type Role = 'participant' | 'judge' | 'mentor'

interface Step {
  icon: React.ReactNode
  title: string
  description: string
  tip?: string
}

const ROLES: { key: Role; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
  {
    key: 'participant',
    label: 'Учасник',
    icon: <Users className="h-5 w-5" />,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/30',
  },
  {
    key: 'judge',
    label: 'Суддя',
    icon: <Star className="h-5 w-5" />,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30',
  },
  {
    key: 'mentor',
    label: 'Ментор',
    icon: <BookOpen className="h-5 w-5" />,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
  },
]

const PARTICIPANT_STEPS: Step[] = [
  {
    icon: <UserPlus className="h-6 w-6 text-blue-400" />,
    title: '1. Реєстрація на платформі',
    description:
      'Перейдіть на головну сторінку та натисніть кнопку «Зареєструватися». Заповніть ім\'я, email та пароль. Після реєстрації ви автоматично отримуєте роль Учасника.',
    tip: 'Використовуйте реальне ім\'я — воно відображається команді та організаторам.',
  },
  {
    icon: <Search className="h-6 w-6 text-blue-400" />,
    title: '2. Перегляд хакатонів',
    description:
      'У розділі «Хакатони» ви побачите всі доступні змагання. Натисніть на картку хакатону щоб побачити деталі: дати, треки, призи та правила.',
    tip: 'Хакатони зі статусом «Реєстрація відкрита» доступні для приєднання прямо зараз.',
  },
  {
    icon: <Users className="h-6 w-6 text-blue-400" />,
    title: '3. Створення або приєднання до команди',
    description:
      'Після вибору хакатону — створіть нову команду або приєднайтеся за інвайт-посиланням. Щоб запросити учасника — відкрийте вкладку «Команда» → «Запросити учасника» → скопіюйте посилання та надішліть другу.',
    tip: 'Інвайт-посилання діє обмежений час. Якщо протермінувалось — згенеруйте нове.',
  },
  {
    icon: <Search className="h-6 w-6 text-blue-400" />,
    title: '4. Пошук команди через Matchmaking',
    description:
      'Якщо ви шукаєте команду або вільних учасників — скористайтеся розділом «Matchmaking». Позначте себе як «Шукаю команду» у профілі, і вас побачать капітани.',
    tip: 'Заповніть профіль: навички та опис значно підвищують шанси бути поміченим.',
  },
  {
    icon: <FileText className="h-6 w-6 text-blue-400" />,
    title: '5. Подача проєкту',
    description:
      'У вкладці «Проєкт» на дашборді хакатону заповніть назву, опис та додайте ресурси (GitHub, відео, слайди). Натисніть «Подати проєкт» — після цього він потрапить на оцінювання суддям.',
    tip: 'Переконайтеся що всі посилання відкриті (public) перед подачею.',
  },
  {
    icon: <Calendar className="h-6 w-6 text-blue-400" />,
    title: '6. Бронювання ментора',
    description:
      'У вкладці «Ментори» виберіть доступного ментора та вільний часовий слот. Заповніть тему консультації та натисніть «Забронювати». Ментор підтвердить або відхилить запит.',
    tip: 'Не забудьте перевірити статус запиту — після підтвердження з\'явиться посилання на зустріч.',
  },
  {
    icon: <Trophy className="h-6 w-6 text-blue-400" />,
    title: '7. Результати та нагороди',
    description:
      'Після завершення судді оцінять проєкти. У вкладці «Результати» ви побачите ранжування команд, бали та нагороди. Бали автоматично нормалізуються для справедливості.',
  },
]

const JUDGE_STEPS: Step[] = [
  {
    icon: <LogIn className="h-6 w-6 text-amber-400" />,
    title: '1. Вхід у систему',
    description:
      'Адміністратор заздалегідь створює ваш акаунт із роллю «Суддя». Увійдіть на платформу, і система автоматично покаже ваш робочий кабінет судді.',
  },
  {
    icon: <ClipboardList className="h-6 w-6 text-amber-400" />,
    title: '2. Перегляд призначених проєктів',
    description:
      'Розділ «Мої проєкти» показує всі проєкти, призначені вам для оцінювання. Вони відсортовані по треках, до яких вас призначив організатор.',
    tip: 'Ви бачите тільки проєкти свого треку — це зроблено навмисно для справедливості.',
  },
  {
    icon: <AlertTriangle className="h-6 w-6 text-amber-400" />,
    title: '3. Декларування конфлікту інтересів',
    description:
      'ВАЖЛИВО: Якщо ви знаєте учасників команди особисто (родичі, колеги, ви їх менторували) — зайдіть в «Конфлікти інтересів» та задекларуйте конфлікт з цією командою. Ви не зможете оцінювати їхній проєкт.',
    tip: 'Система автоматично заблокує оцінювання команд, з якими ви декларували конфлікт.',
  },
  {
    icon: <Star className="h-6 w-6 text-amber-400" />,
    title: '4. Виставлення оцінок',
    description:
      'Натисніть «Оцінити» навпроти проєкту. Для кожного критерію трека виставте бал від 0 до максимального значення. Можна залишити коментар до кожного критерію.',
    tip: 'Оцінки можна змінювати до закінчення фази судді. Після закриття — зміни неможливі.',
  },
  {
    icon: <Eye className="h-6 w-6 text-amber-400" />,
    title: '5. Огляд поданих оцінок',
    description:
      'У розділі «Мої оцінки» ви бачите всі виставлені вами бали. Це допомагає відстежити які проєкти вже оцінені, а які ще ні.',
  },
  {
    icon: <BarChart3 className="h-6 w-6 text-amber-400" />,
    title: '6. Як рахуються бали?',
    description:
      'Система автоматично нормалізує ваші оцінки відносно середнього балу всіх суддів. Це означає: якщо ви ставите середні бали, а інший суддя ставить завищені — алгоритм це враховує та прибирає упередженість.',
    tip: 'Будьте чесні та послідовні — алгоритм нормалізації найкраще працює при стабільному підході до оцінювання.',
  },
]

const MENTOR_STEPS: Step[] = [
  {
    icon: <LogIn className="h-6 w-6 text-emerald-400" />,
    title: '1. Вхід у систему',
    description:
      'Адміністратор заздалегідь надає вам роль «Ментор». Увійдіть на платформу — ви потрапите в кабінет ментора з двома розділами: «Доступність» та «Мої слоти».',
  },
  {
    icon: <Calendar className="h-6 w-6 text-emerald-400" />,
    title: '2. Налаштування доступності',
    description:
      'У розділі «Доступність» додайте часові вікна, коли ви готові проводити консультації. Вкажіть початок і кінець доступності, теми (JavaScript, UI/UX, бізнес тощо) та максимальну кількість одночасних сесій.',
    tip: 'Уникайте перекриття часових вікон — система не дозволить додати конфліктуючі слоти.',
  },
  {
    icon: <ThumbsUp className="h-6 w-6 text-emerald-400" />,
    title: '3. Підтвердження запитів',
    description:
      'Коли команда бронює ваш слот — ви отримаєте запит у розділі «Мої слоти». Перегляньте деталі: хто, коли, тема. Підтвердіть або відхиліть запит.',
    tip: 'При підтвердженні обов\'язково вкажіть посилання на зустріч (Zoom, Google Meet тощо) — учасники побачать його у своєму кабінеті.',
  },
  {
    icon: <Bell className="h-6 w-6 text-emerald-400" />,
    title: '4. Нагадування',
    description:
      'Система автоматично надсилає нагадування перед початком підтвердженої сесії. Час нагадування налаштовується адміністратором платформи.',
  },
  {
    icon: <CheckCircle2 className="h-6 w-6 text-emerald-400" />,
    title: '5. Завершення сесії',
    description:
      'Після проведення консультації — позначте слот як «Завершено». Це оновить статистику та дозволить учасникам знати що сесія відбулась.',
  },
  {
    icon: <Settings className="h-6 w-6 text-emerald-400" />,
    title: '6. Блокування часу',
    description:
      'Якщо вам потрібно заблокувати час (власні справи, відпустка) — скористайтеся функцією «Заблокувати слот». Команди не зможуть забронювати цей час.',
  },
]

const stepsMap: Record<Role, Step[]> = {
  participant: PARTICIPANT_STEPS,
  judge: JUDGE_STEPS,
  mentor: MENTOR_STEPS,
}

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
  const steps = stepsMap[activeRole]
  const role = ROLES.find(r => r.key === activeRole)!

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(var(--primary-rgb),0.15),transparent)]" />
        <div className="relative container mx-auto px-4 py-20 md:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <BookOpen className="h-4 w-4" />
            Посібник користувача
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
            Як користуватись<br />
            <span className="text-primary">Hack-Flow</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Детальний покроковий посібник для всіх ролей платформи. Від реєстрації до отримання нагород — пояснюємо кожен крок простою мовою.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 md:px-8 max-w-4xl">

        {/* Quick nav */}
        <div className="grid grid-cols-3 gap-3 mb-12">
          {ROLES.map(r => (
            <button
              key={r.key}
              onClick={() => setActiveRole(r.key)}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-5 transition-all duration-200 ${
                activeRole === r.key
                  ? `${r.bg} border-opacity-100 shadow-lg`
                  : 'border-border bg-card/40 hover:bg-card hover:border-border/80'
              }`}
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${activeRole === r.key ? r.color : 'text-muted-foreground'} ${activeRole === r.key ? 'bg-current/10' : 'bg-muted'}`}
                style={activeRole === r.key ? {} : {}}>
                <span className={activeRole === r.key ? r.color : 'text-muted-foreground'}>
                  {r.icon}
                </span>
              </div>
              <span className={`text-sm font-semibold ${activeRole === r.key ? r.color : 'text-muted-foreground'}`}>
                {r.label}
              </span>
              {activeRole === r.key && (
                <div className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${r.bg} ${r.color}`}>
                  Обрано
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
              {activeRole === 'participant' && 'Ви — Учасник хакатону'}
              {activeRole === 'judge' && 'Ви — Суддя хакатону'}
              {activeRole === 'mentor' && 'Ви — Ментор хакатону'}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {activeRole === 'participant' && 'Учасники реєструються, формують команди, подають проєкти та замовляють консультації у менторів. Саме ви — серце кожного хакатону.'}
            {activeRole === 'judge' && 'Судді оцінюють проєкти команд за встановленими критеріями. Ваші оцінки визначають переможців, тому чесність та послідовність — найважливіші якості.'}
            {activeRole === 'mentor' && 'Ментори надають консультації командам під час хакатону. Ви ділитесь досвідом, допомагаєте вирішувати проблеми та направляєте учасників до кращого результату.'}
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
            Часті запитання
          </h2>
          <div className="space-y-5">
            {[
              {
                q: 'Як приєднатися до команди за посиланням?',
                a: 'Перейдіть за посиланням у браузері (вигляд: /join/XXXXXX). Якщо ви вже залогінені — система автоматично додасть вас до команди. Якщо ні — спочатку зареєструйтесь, потім перейдіть за посиланням.',
              },
              {
                q: 'Що робити якщо я хочу змінити команду?',
                a: 'Зверніться до адміністратора хакатону. Самостійна зміна команди після початку хакатону зазвичай не дозволена за правилами.',
              },
              {
                q: 'Чому мій проєкт ще не оцінений?',
                a: 'Оцінювання відбувається тільки в фазі «Суддівство». Перевірте поточну стадію хакатону на дашборді. Якщо стадія активна — зачекайте, судді оцінять проєкти у встановлений термін.',
              },
              {
                q: 'Ментор відхилив мій запит — що робити?',
                a: 'Спробуйте обрати інший вільний часовий слот у того ж ментора або знайдіть іншого ментора зі схожою спеціалізацією. Ментор міг бути зайнятий або ваша тема виходить за рамки його компетенції.',
              },
              {
                q: 'Як розраховуються фінальні бали?',
                a: 'Кожен критерій має вагу та максимальний бал. Система рахує зважену суму оцінок від усіх суддів та застосовує нормалізацію — щоб «суворіший» суддя не ставив систематично нижчих балів ніж «добрий».',
              },
              {
                q: 'Що таке «конфлікт інтересів» у судді?',
                a: 'Якщо суддя особисто знайомий з членами команди (родичі, друзі, колеги, попередні учні) — він зобов\'язаний задекларувати конфлікт. Це виключить його з оцінювання тієї команди та зробить процес справедливим.',
              },
            ].map((item, i) => (
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
            Словник термінів
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { term: 'Хакатон', def: 'Змагання де команди за обмежений час розробляють проєкт і представляють його журі.' },
              { term: 'Трек', def: 'Тематичний напрямок хакатону (наприклад: AI, Web3, EdTech). Команда обирає трек на початку.' },
              { term: 'Стадія', def: 'Поточний етап хакатону: Реєстрація → Хакінг → Презентація → Суддівство → Завершено.' },
              { term: 'Matchmaking', def: 'Система пошуку команди або учасників. Корисна якщо ви шукаєте команду або потрібен новий учасник.' },
              { term: 'Критерій оцінювання', def: 'Параметр за яким суддя оцінює проєкт (наприклад: інноваційність, якість коду, презентація).' },
              { term: 'Нормалізація балів', def: 'Математичний алгоритм що прибирає упередженість суддів — "суворий" та "добрий" суддя стають рівноцінними.' },
              { term: 'Конфлікт інтересів', def: 'Особиста або ділова пов\'язаність судді з командою яку він оцінює. Обов\'язково декларується.' },
              { term: 'Інвайт-посилання', def: 'Унікальне посилання для запрошення до команди. Має термін дії та ліміт використань.' },
            ].map((item, i) => (
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
          <h3 className="text-2xl font-bold mb-3">Готові розпочати?</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Зареєструйтесь на платформі та приєднуйтесь до наступного хакатону вже сьогодні.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Зареєструватись <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-accent transition-colors"
            >
              <Home className="h-4 w-4" /> На головну
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
