export interface Translations {
  // ── Navigation ─────────────────────────────────────────────────────────
  nav: {
    hackathons: string; cabinet: string; login: string; register: string
    logout: string; profile: string; matchmaking: string; mentors: string
    about: string; guide: string
  }
  // ── Sidebar (app) ───────────────────────────────────────────────────────
  sidebar: {
    myHackathons: string; matchmaking: string; profile: string
    judgeProjects: string; judgeScores: string; judgeConflicts: string
    mentorSlots: string; mentorAvailability: string
  }
  // ── Admin sidebar ───────────────────────────────────────────────────────
  adminNav: {
    dashboard: string; hackathons: string; teams: string
    users: string; judging: string; mentorship: string
  }
  // ── Common actions ──────────────────────────────────────────────────────
  actions: {
    save: string; cancel: string; delete: string; edit: string; create: string
    back: string; close: string; confirm: string; loading: string; search: string
    filter: string; apply: string; reset: string; submit: string; yes: string
    no: string; add: string; remove: string; invite: string; copy: string
    join: string; leave: string; refresh: string; view: string; score: string
    approve: string; reject: string; disqualify: string; publish: string
    archive: string; select: string; upload: string; send: string; book: string
    clear: string
  }
  // ── Common states ───────────────────────────────────────────────────────
  states: {
    loading: string; noData: string; error: string; success: string
    notFound: string; pending: string; approved: string; rejected: string
    disqualified: string; active: string; past: string; upcoming: string
    all: string; draft: string; published: string; finished: string
  }
  // ── Auth ────────────────────────────────────────────────────────────────
  auth: {
    loginTitle: string; loginSubtitle: string
    registerTitle: string; registerSubtitle: string
    emailLabel: string; emailPlaceholder: string
    passwordLabel: string; passwordPlaceholder: string
    confirmPasswordLabel: string; confirmPasswordPlaceholder: string
    fullNameLabel: string; fullNamePlaceholder: string
    usernameLabel: string; usernameHint: string
    loginBtn: string; registerBtn: string
    loginError: string; registerError: string
    invalidEmail: string; enterPassword: string
    nameTooShort: string; usernameTooShort: string; usernameTooLong: string
    usernameInvalid: string; passwordTooShort: string; passwordsMismatch: string
    emailTaken: string; usernameTaken: string
    orCreateAccount: string; alreadyHaveAccount: string; noAccount: string
  }
  // ── Footer ──────────────────────────────────────────────────────────────
  footer: {
    platform: string; aboutProject: string; hackathons: string; mentors: string
    guide: string; about: string; college: string; rights: string
    madeIn: string; inUkraine: string; desc: string
  }
  // ── Profile ─────────────────────────────────────────────────────────────
  profile: {
    title: string; subtitle: string; personalInfo: string; skills: string
    socials: string; lookingForTeam: string; bio: string; saveChanges: string
    saving: string; username: string; email: string; fullName: string
    addSkill: string; noSkills: string; addSocial: string; github: string
    linkedin: string; twitter: string; telegram: string; website: string
    lookingForTeamHint: string
    successUpdate: string
    emailLabel: string
    fullNameLabel: string
    bioPlaceholder: string
    skillsDesc: string
    lookingForTeamDesc: string
    myExpertise: string
    expertiseDesc: string
    noExpertise: string
    judgeRoleTitle: string
    judgeRoleDesc: string
    myTeams: string
    skillsPlaceholder: string
    addSocialsHint: string
    noSocialsAdded: string
    enterUrlError: string
    addSocialError: string
  }
  // ── Hackathons (HackathonsPage) ─────────────────────────────────────────
  hackathonsPage: {
    title: string; myHackathons: string; findHackathon: string
    noMyHackathons: string; noMyHackathonsDesc: string
    noAvailableHackathons: string; noAvailableHackathonsDesc: string
    searchPlaceholder: string; join: string; teamLabel: string; trackLabel: string
    status: { APPROVED: string; REJECTED: string; DISQUALIFIED: string; PENDING: string }
  }
  // ── HomePage ────────────────────────────────────────────────────────────
  homePage: {
    heroTitle: string; heroSubtitle: string
    tabAll: string; tabActive: string; tabUpcoming: string; tabPast: string
    searchPlaceholder: string; noHackathons: string; noHackathonsDesc: string
    participants: string; teams: string; prize: string
    viewAll: string; registerCTA: string
  }
  // ── HackathonDashboard ──────────────────────────────────────────────────
  dashboard: {
    backToList: string; notFound: string
    tabTeam: string; tabProject: string; tabMentors: string
    tabResults: string; tabSettings: string
    stages: {
      REGISTRATION: string; HACKING: string; JUDGING: string
      FINISHED: string; REVIEW: string
    }
    shareLink: string; inviteMember: string; copyLink: string; linkCopied: string
    stageProgress: string; stageLabel: string; stageTask: string
    lockMessages: {
      registration: string
      hacking: string
      judging: string
      finished: string
      upcoming: string
    }
  }
  // ── Team tab ────────────────────────────────────────────────────────────
  teamTab: {
    teamName: string; track: string; members: string; captain: string
    inviteLink: string; copyInvite: string; noTeam: string; noTeamDesc: string
    createTeam: string; joinTeam: string; leaveTeam: string; disbandTeam: string
    teamSettings: string; inviteSent: string; kicked: string; promote: string
    demote: string; kick: string; you: string; member: string; lookingForTeam: string
    status: string; registrationStatus: string
    joinErrorGeneric: string; joinErrorInvalid: string; joinErrorAlready: string
    joinErrorFull: string; enterNamePlaceholder: string; nameRequired: string
    trackChangeHint: string; teamDescriptionPlaceholder: string; createError: string
    insertLinkOrToken: string; joinLinkPlaceholder: string; joinExample: string
    registrationClosed: string; applicationPending: string; applicationPendingDesc: string
    applicationRejected: string; applicationRejectedNoComment: string; applicationDisqualified: string
    applicationDisqualifiedNoComment: string; transferCaptainTitle: string; transferCaptainDesc: string
    transferCaptainBtn: string; removeMemberConfirm: string; leaveTeamDesc: string
    incomingRequests: string; noIncomingRequests: string; accept: string
    inviteLinkDesc: string; validUntil: string; usedCount: string
    noActiveInvite: string; inviteResetConfirm: string; createInviteBtn: string
  }
  // ── Project tab ─────────────────────────────────────────────────────────
  projectTab: {
    title: string; description: string; repoUrl: string; demoUrl: string
    noProject: string; noProjectDesc: string; createProject: string
    editProject: string; saveProject: string; projectSaved: string
    projectName: string; projectDesc: string; technologies: string
    trackManual: string; clickToView: string; manualEmpty: string
    timeExpired: string; timeHours: string; timeMinutes: string; timeSeconds: string
    joinTeamFirst: string; teamBlocked: string; newProject: string
    titleLabel: string; titlePlaceholder: string; descLabel: string; descPlaceholder: string
    creating: string; createDraft: string; editing: string; saving: string
    submitConfirmTitle: string; submitConfirmDesc: string; submitWarning: string
    confirmSubmitBtn: string; submitting: string; timeRemaining: string
    submittedAt: string; lateBy: string; commentLabel: string; editBtn: string
    reopenBtn: string; reopening: string; titleNotSpecified: string; descNotSpecified: string
    resourcesTitle: string; addResourceBtn: string; noResources: string; noResourcesDesc: string
    resourceLabel: string; deleteConfirm: string; newResourceTitle: string
    resourceTypeLabel: string; selectTypePlaceholder: string; urlLabel: string
    optionalDescLabel: string; optionalDescPlaceholder: string; addingResource: string
    validationTitle: string; submitPrompt: string; submitBannerDesc: string; submitBtn: string
    submittedSuccessFooter: string
  }
  // ── Mentors tab ─────────────────────────────────────────────────────────
  mentorsTab: {
    title: string; subtitle: string; noMentors: string; noMentorsDesc: string
    bookSlot: string; cancelBooking: string; booked: string; available: string
    myBookings: string; duration: string; minutes: string; message: string
    messagePlaceholder: string; bookSuccess: string; cancelSuccess: string
    days: string[]; months: string[]; monthsFull: string[]
    today: string; bookingUnavailable: string; bookingUnavailableDesc: string
    noSlotsThisWeek: string; nextWeek: string; archive: string
    cancelSessionTitle: string; cancelSessionConfirm: string; confirmCancelBtn: string
    timePassed: string; joinMeeting: string; blocked: string; minPerSlot: string
    allSlotsBusy: string; slotBusy: string; dateTime: string
    helpDescriptionPlaceholder: string; sendRequestConfirm: string
  }
  // ── Results tab ─────────────────────────────────────────────────────────
  resultsTab: {
    title: string; noResults: string; noResultsDesc: string
    rank: string; team: string; score: string; project: string
    yourTeam: string
    place: string; criteria: string; weight: string; progress: string
    evaluatedBy: string; judgeSingular: string; judgePlural: string
    reasonLabel: string; notSubmittedInTime: string; notInLeaderboard: string
    leaderboardTitle: string; ratingLabel: string; teamsCount: string
    noRankedTeams: string; unrankedTitle: string; teamDisqualified: string
    teamNotSubmitted: string; noProjectReason: string; rejectedReason: string
  }
  // ── Settings tab ────────────────────────────────────────────────────────
  settingsTab: {
    title: string; danger: string; leaveTeam: string; leaveTeamConfirm: string
    disbandTeam: string; disbandTeamConfirm: string
    onlyCaptain: string; manageTeam: string; editTeam: string; nameDescTrack: string
    editWarning: string; min2Chars: string; noTrack: string; trackChangeWarning: string
    saveSuccess: string; irreversible: string; disbandWarning: string; enterNameToConfirm: string
    deletePermanentlyBtn: string; deleting: string
  }
  // ── Matchmaking ─────────────────────────────────────────────────────────
  matchmaking: {
    title: string; subtitle: string; searchPlaceholder: string
    noUsers: string; noUsersDesc: string; inviteToTeam: string
    invited: string; skills: string; lookingForTeam: string
    searchTeamTitle: string; searchTeamSubtitle: string; searchTeamPlaceholder: string
    noTeamsFound: string; noTeamsFoundDesc: string; fullBadge: string
    teamApprovedBadge: string; messageToCaptain: string; aboutYourselfPlaceholder: string
    requestSent: string; requestError: string; loginToApply: string
    applyBtn: string; matchmakingTip: string
  }
  // ── Judge pages ─────────────────────────────────────────────────────────
  judge: {
    projects: string; scores: string; conflicts: string
    noProjects: string; noProjectsDesc: string; score: string
    totalScore: string; commentLabel: string; submitScore: string
    scoreUpdated: string; conflictMark: string; conflictRemove: string
    noScores: string; noScoresDesc: string; noConflicts: string; noConflictsDesc: string
    hasConflict: string; resolved: string; selectHackathon: string
    scored: string; untitled: string
    selectHackathonPlaceholder: string
    noTrack: string
    notAssignedToTrack: string
    contactOrganizerForTrack: string
    hackathonFinishedJudgingClosed: string
    canViewCannotEditScores: string
    youAreJudgeOfTracks: string
    judgingProgress: string
    of: string
    projectsCount: (n: number) => string
    completed: string
    projectSingular: string
    projectPlural: string
    notEvaluated: string
    teamLabel: string
    submitted: string
    evaluationUnavailable: string
    conflictTitle: string
    conflictSubtitle: string
    whatIsConflict: string
    conflictInfoDesc: string
    dismissInfo: string
    reportedAllConflicts: string
    selectTeam: string
    notSelected: string
    conflictType: string
    mentorReason: string
    mentorReasonDesc: string
    personalReason: string
    personalReasonDesc: string
    reportConflictBtn: string
    processing: string
    errorReporting: string
    myConflicts: string
    recordedAt: string
    mentoredReasonLabel: string
    personalReasonLabel: string
    scoresSubtitle: string
    scoredProjects: string
    avgAssessment: string
    highestScore: string
    lowestScore: string
    judgingHistory: string
    avgScore: string
    updatedAt: string
    actions: string
    ago: string
    editScore: string
    backToList: string
    descriptionMissing: string
    noResourcesSubmitted: string
    presentationLabel: string
    judgesScores: (n: number) => string
    judgeComment: string
    alreadyScored: string
    alreadyScoredDesc: (time: string) => string
    draftFound: string
    draftSavedAgo: (time: string) => string
    restore: string
    ignore: string
    myAssessment: string
    weightLabel: (weight: number) => string
    commentOptional: string
    commentPlaceholder: string
    summaryScore: string
    totalLabel: string
    judgingClosed: string
    updateScore: string
  }
  // ── Mentor pages ────────────────────────────────────────────────────────
  mentor: {
    mySlots: string; availability: string; createSlot: string
    noSlots: string; noSlotsDesc: string; slotDate: string
    startTime: string; endTime: string; slotDuration: string
    requests: string; accept: string; decline: string; complete: string
    pending: string; accepted: string; declined: string; completed: string
    cancelled: string; noRequests: string; selectTrack: string
    hackathonLabel: string; deleteSlot: string; deleteSlotConfirm: string
    daysFull: string[]
    monthsFull: string[]
    noBookedSessions: string
    noUpcomingSessions: string
    noCompletedSessions: string
    noCancelledSessions: string
    allStats: string
    todaySessionsCount: (n: number) => string
    nextSessionInfo: (team: string, time: string, mins: string) => string
    nextSessionInfoNow: (team: string, time: string) => string
    joinNow: string
    openMeetingLink: string
    filterScheduled: string
    filterCompleted: string
    filterCancelled: string
    teamLabel: string
    trackLabel: string
    openLink: string
    completedAgo: (time: string) => string
    timePassed: string
    bookedStatus: string
    confirmBtn: (secs: number) => string
    markCompleted: string
    sessionStartsIn: (team: string, mins: number) => string
    joinArrow: string
    sessionsTitle: string
    sessionsSubtitle: string
    slotsCount: (n: number) => string
    freeLabel: string
    pendingLabel: string
    confirmedLabel: string
    blockedLabel: string
    requestLabel: string
    freeSlotLabel: string
    pendingStatusLabel: string
    confirmedStatusLabel: string
    completedStatusLabel: string
    blockedStatusLabel: string
    rejectedStatusLabel: string
    cancelledStatusLabel: string
    blockAction: string
    unblockAction: string
    meetingLinkLabel: string
    acceptAction: string
    declineAction: string
    deleteAvailabilityTitle: string
    deleteAvailabilityHasBookings: (n: number) => string
    deleteAvailabilityConfirm: (time: string) => string
    deleteConfirmBtn: string
    statsAvailBlocks: string
    statsFreeSlots: string
    statsThisWeek: string
    allHackathonsSelector: string
    mySchedule: string
    calendarSubtitle: string
    availabilityHint: string
    todayNav: string
    legendFree: string
    legendPending: string
    legendConfirmed: string
    legendBlocked: string
    addAvailabilityTitle: string
    allTracks: string
    selectDateTime: string
    increaseRange: string
    startTimePassed: string
    endTimeLater: string
    futureDateOnly: string
    selectDateError: string
    overlapError: string
    addToScheduleBtn: string
    slotsOf: (count: number, duration: number) => string
    sessionImminentHeader: (mins: number) => string
    sessionWaitingTeam: (team: string) => string
    joinCall: string
  }
  // ── Public hackathon page ───────────────────────────────────────────────
  publicHackathon: {
    register: string; registered: string; description: string
    tracks: string; schedule: string; prizes: string; organizer: string
    startDate: string; endDate: string; maxTeamSize: string; minTeamSize: string
    teamSize: string; loginToRegister: string; alreadyRegistered: string
    registerSuccess: string; rules: string; requirements: string
    manual: string; noManual: string; currentStage: string; futureStage: string
    allHackathons: string; hackathonNotFound: string; stageLabel: string
    tracksTitle: string; stagesTitle: string; datesTitle: string; formatTitle: string
    onlineFormat: string; teamCompositionTitle: string; teamCompositionDesc: string
    rulesButton: string; registrationClosed: string; applyButton: string; tagsTitle: string
  }
  // ── Mentors public page ─────────────────────────────────────────────────
  mentorsPage: {
    title: string; subtitle: string; searchPlaceholder: string
    noMentors: string; noResults: string; clearSearch: string
    wantMentor: string; contactAdmin: string; loginToView: string
    mentor: string; count: (n: number) => string
    loadError: string; wantMentorDesc: string
  }
  // ── About page ──────────────────────────────────────────────────────────
  aboutPage: {
    title: string; studentProject: string; hackathons: string
    hackathonsDesc: string; mentorship: string; mentorshipDesc: string
    openSource: string; openSourceDesc: string; developer: string
    student: string; institution: string; techStack: string; viewHackathons: string
    collegeDesc: string; collegeLinkText: string
    developerName: string; heroDescription: string
  }
  // ── Admin: Dashboard ────────────────────────────────────────────────────
  adminDashboard: {
    title: string; totalHackathons: string; totalTeams: string
    totalUsers: string; totalProjects: string; activeHackathons: string
    recentActivity: string; quickActions: string; createHackathon: string
    manageUsers: string; viewTeams: string
  }
  // ── Admin: Hackathons ───────────────────────────────────────────────────
  adminHackathons: {
    title: string; create: string; edit: string; delete: string
    searchPlaceholder: string; noHackathons: string; status: string
    participants: string; teams: string; tracks: string; stages: string
    deleteConfirm: string; publish: string; archive: string
    name: string; description: string; startDate: string; endDate: string
    maxTeamSize: string; minTeamSize: string; tags: string; prizes: string
    awards: string; createSuccess: string; updateSuccess: string; deleteSuccess: string
    formTitle: string; formSubtitle: string; back: string
    approvals: string; approveTeam: string; rejectTeam: string
    generateResults: string; results: string
    teamsSelected: (n: number) => string
    approveAll: string
    rejectAll: string
    noApprovalRecords: string
  }
  // ── Admin: Teams ────────────────────────────────────────────────────────
  adminTeams: {
    title: string; searchPlaceholder: string; noTeams: string
    members: string; captain: string; track: string; hackathon: string
    status: string; approve: string; reject: string; disqualify: string
    view: string; project: string; scores: string
  }
  // ── Admin: Users ────────────────────────────────────────────────────────
  adminUsers: {
    title: string; searchPlaceholder: string; noUsers: string
    role: string; email: string; username: string; fullName: string
    status: string; view: string; edit: string; changeRole: string
    activity: string; teams: string; hackathons: string
    roles: { admin: string; judge: string; mentor: string; participant: string }
  }
  // ── Admin: Judging ──────────────────────────────────────────────────────
  adminJudging: {
    title: string; selectHackathon: string; noHackathon: string
    judges: string; projects: string; scores: string; track: string
    assignJudge: string; removeJudge: string; scoreDetail: string
    totalScore: string; avgScore: string; noScores: string
  }
  // ── Admin: Mentorship ───────────────────────────────────────────────────
  adminMentorship: {
    title: string; selectHackathon: string; mentors: string
    slots: string; requests: string; status: string
    accept: string; decline: string; pending: string
    accepted: string; declined: string; completed: string; cancelled: string
  }
  // ── Shared components ───────────────────────────────────────────────────
  shared: {
    confirmDelete: string; areYouSure: string; thisActionCannotBeUndone: string
    notifications: string; noNotifications: string; markAllRead: string
    hackathonCard: {
      participants: string; teams: string; prize: string
      register: string; viewMore: string; startDate: string; endDate: string
    }
    statusBadge: {
      active: string; upcoming: string; past: string; draft: string
      published: string; registration: string; hacking: string
      judging: string; finished: string
    }
    emptyState: {
      defaultTitle: string; defaultDesc: string
    }
  }
  joinTeamPage: {
    alreadyMember: string
    invalidInvite: string
    joiningError: string
    successTitle: string
    redirecting: string
    errorTitle: string
    invitedTitle: string
    loginToSeeDetails: string
    loginToJoinPrompt: string
    loginBtn: string
    registerBtn: string
    confirmTitle: string
    declineBtn: string
    joinBtn: string
    backToHackathons: string
  }
  userGuide: {
    guideTitle: string
    heroTitle: string
    heroTitle2: string
    heroSubtitle: string
    participantLabel: string
    judgeLabel: string
    mentorLabel: string
    selectedBadge: string
    participantRoleTitle: string
    participantRoleDesc: string
    judgeRoleTitle: string
    judgeRoleDesc: string
    mentorRoleTitle: string
    mentorRoleDesc: string
    faqTitle: string
    glossaryTitle: string
    ctaTitle: string
    ctaSubtitle: string
    ctaRegister: string
    ctaHome: string
    participantSteps: { title: string; description: string; tip?: string }[]
    judgeSteps: { title: string; description: string; tip?: string }[]
    mentorSteps: { title: string; description: string; tip?: string }[]
    faq: { q: string; a: string }[]
    glossary: { term: string; def: string }[]
  }
  adminDashboardPage: {
    judgingTab: string
    mentorshipTab: string
    teamsInLeaderboard: string
    judgeConflicts: string
    tracks: string
    criteria: string
    leaderboard: string
    scores: string
    criteriaTab: string
    conflictsTab: string
    selectHackathonLeaderboard: string
    team: string
    track: string
    score: string
    actions: string
    noData: string
    stats: string
    selectHackathonScores: string
    teamScores: string
    noTeams: string
    addConflict: string
    selectJudge: string
    selectTeam: string
    mentoredTeam: string
    personalRelationship: string
    save: string
    judge: string
    email: string
    date: string
    noConflicts: string
    selectHackathonFilter: string
    notSpecified: string
    confirmDeleteConflict: string
    evaluationCriteria: string
    selectTrack: string
    addCriterion: string
    criterionName: string
    maxScore: string
    weight: string
    descriptionOptional: string
    selectTrackView: string
    noCriteria: string
    all: string
    pending: string
    acceptedStatus: string
    completedStatus: string
    rejectedStatus: string
    cancelledStatus: string
    blockedStatus: string
    mentorshipRequests: string
    noRequests: string
    mentor: string
    time: string
    duration: string
    minutes: string
    adminPanelTitle: string
    adminPanelSubtitle: string
    allHackathons: string
  }
  notificationAlerts: {
    hackathonDefault: string
    approvedTitle: (team: string) => string
    approvedBodyComment: (comment: string) => string
    approvedBodyDefault: (hackathon: string) => string
    rejectedTitle: (team: string) => string
    rejectedBodyComment: (comment: string) => string
    rejectedBodyDefault: string
    disqualifiedTitle: (team: string) => string
    disqualifiedBodyComment: (comment: string) => string
    disqualifiedBodyDefault: string
    pendingTitle: (team: string) => string
    pendingBodyComment: (comment: string) => string
  }
}

export const uk: Translations = {
  nav: {
    hackathons: 'Хакатони', cabinet: 'Кабінет', login: 'Вхід',
    register: 'Реєстрація', logout: 'Вийти', profile: 'Профіль',
    matchmaking: 'Матчмейкінг', mentors: 'Ментори', about: 'Про нас', guide: 'Посібник',
  },
  sidebar: {
    myHackathons: 'Мої хакатони', matchmaking: 'Матчмейкінг', profile: 'Профіль',
    judgeProjects: 'Проєкти', judgeScores: 'Мої оцінки', judgeConflicts: 'Конфлікти',
    mentorSlots: 'Мої слоти', mentorAvailability: 'Доступність',
  },
  adminNav: {
    dashboard: 'Dashboard', hackathons: 'Хакатони', teams: 'Команди',
    users: 'Користувачі', judging: 'Суддівство', mentorship: 'Менторство',
  },
  actions: {
    save: 'Зберегти', cancel: 'Скасувати', delete: 'Видалити', edit: 'Редагувати',
    create: 'Створити', back: 'Назад', close: 'Закрити', confirm: 'Підтвердити',
    loading: 'Завантаження...', search: 'Пошук', filter: 'Фільтр', apply: 'Застосувати',
    reset: 'Скинути', submit: 'Відправити', yes: 'Так', no: 'Ні', add: 'Додати',
    remove: 'Видалити', invite: 'Запросити', copy: 'Копіювати', join: 'Приєднатись',
    leave: 'Покинути', refresh: 'Оновити', view: 'Переглянути', score: 'Оцінити',
    approve: 'Схвалити', reject: 'Відхилити', disqualify: 'Дискваліфікувати',
    publish: 'Опублікувати', archive: 'Архівувати', select: 'Обрати', upload: 'Завантажити',
    send: 'Відправити', book: 'Забронювати', clear: 'Очистити',
  },
  states: {
    loading: 'Завантаження...', noData: 'Немає даних', error: 'Помилка',
    success: 'Успішно', notFound: 'Не знайдено', pending: 'Очікує',
    approved: 'Схвалено', rejected: 'Відхилено', disqualified: 'Дискваліфіковано',
    active: 'Активні', past: 'Минулі', upcoming: 'Майбутні', all: 'Всі',
    draft: 'Чернетка', published: 'Опубліковано', finished: 'Завершено',
  },
  auth: {
    loginTitle: 'Вхід в систему', loginSubtitle: 'створіть новий акаунт',
    registerTitle: 'Реєстрація акаунту', registerSubtitle: 'Вже є акаунт?',
    emailLabel: 'Email адреса', emailPlaceholder: 'ivan@example.com',
    passwordLabel: 'Пароль', passwordPlaceholder: 'Мінімум 8 символів',
    confirmPasswordLabel: 'Підтвердження паролю', confirmPasswordPlaceholder: 'Повторіть пароль',
    fullNameLabel: 'Ім\'я', fullNamePlaceholder: 'Іван Петренко',
    usernameLabel: 'Нікнейм', usernameHint: '(лише літери, цифри та "_")',
    loginBtn: 'Увійти', registerBtn: 'Зареєструватись',
    loginError: 'Помилка авторизації', registerError: 'Помилка реєстрації',
    invalidEmail: 'Невірний формат email', enterPassword: 'Введіть пароль',
    nameTooShort: 'Ім\'я має містити мінімум 2 символи',
    usernameTooShort: 'Нікнейм має містити мінімум 3 символи',
    usernameTooLong: 'Нікнейм не може перевищувати 30 символів',
    usernameInvalid: 'Лише латинські літери, цифри та "_"',
    passwordTooShort: 'Пароль має містити мінімум 8 символів',
    passwordsMismatch: 'Паролі не співпадають',
    emailTaken: 'З цим email вже є акаунт', usernameTaken: 'Цей нікнейм вже зайнятий',
    orCreateAccount: 'Або', alreadyHaveAccount: 'Вже є акаунт?', noAccount: 'Немає акаунту?',
  },
  footer: {
    platform: 'Платформа', aboutProject: 'Про проєкт', hackathons: 'Хакатони',
    mentors: 'Ментори', guide: 'Посібник', about: 'Про нас', college: 'Коледж УжНУ',
    rights: 'Коледж УжНУ.', madeIn: 'Зроблено з', inUkraine: 'в Україні',
    desc: 'Платформа для організації та участі у хакатонах. Розроблено у Коледжі УжНУ.',
  },
  profile: {
    title: 'Мій профіль', subtitle: 'Керуйте своїми особистими даними та налаштуваннями.',
    personalInfo: 'Персональна інформація', skills: 'Навички', socials: 'Соціальні мережі',
    lookingForTeam: 'Шукаю команду', bio: 'Про себе', saveChanges: 'Зберегти зміни',
    saving: 'Збереження...', username: 'Нікнейм', email: 'Email', fullName: 'Ім\'я',
    addSkill: 'Додати навичку', noSkills: 'Навичок не додано', addSocial: 'Додати посилання',
    github: 'GitHub', linkedin: 'LinkedIn', twitter: 'Twitter', telegram: 'Telegram',
    website: 'Веб-сайт', lookingForTeamHint: 'Відображатись у матчмейкінгу',
    successUpdate: 'Профіль успішно оновлено',
    emailLabel: 'Email (не змінюється)',
    fullNameLabel: 'ПІБ',
    bioPlaceholder: 'Розкажіть трохи про свій досвід та інтереси...',
    skillsDesc: 'Введіть навичку та натисніть Enter або кому щоб додати (макс. 20)',
    lookingForTeamDesc: 'Ваш профіль буде видно іншим учасникам при пошуку',
    myExpertise: 'Моя експертиза',
    expertiseDesc: 'Треки, у яких ви зареєстрували доступність для менторства',
    noExpertise: 'Ви ще не додали жодного специфічного треку до свого розкладу.',
    judgeRoleTitle: 'Роль судді',
    judgeRoleDesc: 'Ви призначені суддею. Переходьте до відповідного розділу для оцінювання проєктів.',
    myTeams: 'Мої команди',
    skillsPlaceholder: 'Введіть навичку та натисніть Enter...',
    addSocialsHint: 'Додайте посилання на ваші профілі у соціальних мережах',
    noSocialsAdded: 'Жодних соціальних мереж ще не додано',
    enterUrlError: 'Введіть URL',
    addSocialError: 'Не вдалося додати. Перевірте URL.',
  },
  hackathonsPage: {
    title: 'Хакатони', myHackathons: 'Мої хакатони', findHackathon: 'Знайти хакатон',
    noMyHackathons: 'Ви ще не берете участь у хакатонах',
    noMyHackathonsDesc: 'Перейдіть на вкладку \'Знайти хакатон\', щоб знайти цікаву подію',
    noAvailableHackathons: 'Немає доступних хакатонів',
    noAvailableHackathonsDesc: 'Зараз немає хакатонів, відкритих для реєстрації',
    searchPlaceholder: 'Пошук...', join: 'Приєднатись', teamLabel: 'Команда',
    trackLabel: 'Трек',
    status: { APPROVED: 'Схвалено', REJECTED: 'Відхилено', DISQUALIFIED: 'Дискваліфіковано', PENDING: 'Очікує' },
  },
  homePage: {
    heroTitle: 'Ласкаво просимо до Hack-Flow',
    heroSubtitle: 'Платформа для організації та участі у хакатонах. Знаходьте команди, беріть участь і перемагайте!',
    tabAll: 'Всі', tabActive: 'Активні', tabUpcoming: 'Майбутні', tabPast: 'Минулі',
    searchPlaceholder: 'Пошук хакатонів...', noHackathons: 'Немає хакатонів',
    noHackathonsDesc: 'Спробуйте змінити фільтри або поверніться пізніше',
    participants: 'учасників', teams: 'команд', prize: 'Призовий фонд',
    viewAll: 'Переглянути всі', registerCTA: 'Зареєструватись',
  },
  dashboard: {
    backToList: 'До списку хакатонів', notFound: 'Хакатон не знайдено',
    tabTeam: 'Моя команда', tabProject: 'Проєкт', tabMentors: 'Ментори',
    tabResults: 'Результати', tabSettings: 'Налаштування',
    stages: {
      REGISTRATION: '📋 Реєстрація', HACKING: '💻 Хакінг', JUDGING: '⚖️ Суддівство',
      FINISHED: '🏆 Завершено', REVIEW: '🔍 Перегляд',
    },
    shareLink: 'Поділитися посиланням', inviteMember: 'Запросити учасника',
    copyLink: 'Скопіювати посилання', linkCopied: 'Посилання скопійовано!',
    stageProgress: 'Прогрес етапу', stageLabel: 'Етап', stageTask: 'Завдання етапу',
    lockMessages: {
      registration: 'Йде реєстрація команд',
      hacking: 'Йде хакінг',
      judging: 'Йде суддівство',
      finished: 'Хакатон завершено',
      upcoming: 'Хакатон ще не розпочато',
    },
  },
  teamTab: {
    teamName: 'Назва команди', track: 'Трек', members: 'Учасники', captain: 'Капітан',
    inviteLink: 'Посилання-запрошення', copyInvite: 'Скопіювати',
    noTeam: 'Ви не в команді', noTeamDesc: 'Створіть команду або приєднайтесь до існуючої',
    createTeam: 'Створити команду', joinTeam: 'Приєднатись', leaveTeam: 'Покинути команду',
    disbandTeam: 'Розпустити команду', teamSettings: 'Налаштування команди',
    inviteSent: 'Запрошення надіслано', kicked: 'Виключено', promote: 'Призначити капітаном',
    demote: 'Зняти роль', kick: 'Виключити', you: '(Ви)', member: 'Учасник',
    lookingForTeam: 'Шукає команду', status: 'Статус', registrationStatus: 'Статус реєстрації',
    joinErrorGeneric: 'Помилка приєднання',
    joinErrorInvalid: 'Посилання недійсне або застаріле',
    joinErrorAlready: 'Ви вже є учасником команди в цьому хакатоні',
    joinErrorFull: 'Команда заповнена (досягнуто максимум учасників)',
    enterNamePlaceholder: 'Введіть назву...',
    nameRequired: "Назва обов'язкова",
    trackChangeHint: 'ℹ️ Трек змінити після створення не можна',
    teamDescriptionPlaceholder: 'Кілька слів про вашу команду...',
    createError: 'Помилка створення',
    insertLinkOrToken: 'Вставте посилання або токен',
    joinLinkPlaceholder: 'https://hackflow.com/join/abc123  або  abc123',
    joinExample: 'Приклад: hackflow.com/join/xxxxxx',
    registrationClosed: 'Реєстрація наразі закрита',
    applicationPending: 'Заявка на розгляді',
    applicationPendingDesc: 'Ваша заявка або зміни очікують затвердження організатором. Ми повідомимо вас після розгляду.',
    applicationRejected: 'Заявку відхилено',
    applicationRejectedNoComment: 'Організатор не вказав причини. Зв’яжіться з організаторами хакатону.',
    applicationDisqualified: 'Команду дискваліфіковано',
    applicationDisqualifiedNoComment: 'Зв’яжіться з організаторами для уточнення.',
    transferCaptainTitle: 'Передати роль капітана?',
    transferCaptainDesc: '{name} стане новим капітаном. Ви станете звичайним учасником і втратите доступ до керування командою.',
    transferCaptainBtn: 'Передати капітанство',
    removeMemberConfirm: 'Видалити {name} з команди?',
    leaveTeamDesc: 'Повернутись можна тільки по новому запрошенню від капітана.',
    incomingRequests: 'Вхідні заявки',
    noIncomingRequests: 'Поки що немає нових заявок',
    accept: 'Прийняти',
    inviteLinkDesc: 'Поділіться посиланням — перейшовши по ньому, користувач автоматично приєднається до вашої команди.',
    validUntil: 'Дійсне до',
    usedCount: 'Використано',
    noActiveInvite: 'Активне посилання відсутнє. Натисніть кнопку нижче, щоб створити нове.',
    inviteResetConfirm: 'Попереднє посилання стане недійсним. Продовжити?',
    createInviteBtn: 'Створити нове посилання',
  },
  projectTab: {
    title: 'Проєкт', description: 'Опис', repoUrl: 'Репозиторій', demoUrl: 'Демо посилання',
    noProject: 'Проєкт ще не створено', noProjectDesc: 'Додайте опис вашого рішення',
    createProject: 'Створити проєкт', editProject: 'Редагувати', saveProject: 'Зберегти',
    projectSaved: 'Проєкт збережено', projectName: 'Назва проєкту', projectDesc: 'Опис проєкту',
    technologies: 'Технології',
    trackManual: 'Мануал треку: {name}', clickToView: 'Натисніть щоб переглянути', manualEmpty: 'Мануал ще не заповнено',
    timeExpired: 'Час вийшов', timeHours: 'г', timeMinutes: 'хв', timeSeconds: 'с',
    joinTeamFirst: 'Спершу приєднайтесь до команди', teamBlocked: 'Команду відхилено / дискваліфіковано', newProject: 'Новий проєкт',
    titleLabel: 'Назва *', titlePlaceholder: 'Введіть назву проєкту...', descLabel: 'Опис *', descPlaceholder: 'Розкажіть про ідею та технологічний стек...',
    creating: 'Створення...', createDraft: 'Створити чернетку →', editing: 'Редагування', saving: 'Збереження...',
    submitConfirmTitle: 'Подати проєкт?', submitConfirmDesc: 'Після подачі редагування буде недоступне', submitWarning: 'Переконайтесь що всі посилання активні та опис заповнено.',
    confirmSubmitBtn: 'Так, подати', submitting: 'Подаємо...', timeRemaining: 'До кінця хакінгу:',
    submittedAt: 'Подано:', lateBy: 'Запізнення +{minutes} хв', commentLabel: 'Коментар:', editBtn: 'Редагувати',
    reopenBtn: 'Редагувати і переподати', reopening: 'Відкриваємо...', titleNotSpecified: 'Назву не вказано', descNotSpecified: 'Опис не заповнено',
    resourcesTitle: 'Ресурси проєкту', addResourceBtn: 'Додати ресурс', noResources: 'Ресурсів ще немає', noResourcesDesc: 'Ресурсів ще немає. Додайте посилання на репозиторій.',
    resourceLabel: 'Посилання', deleteConfirm: 'Видалити?', newResourceTitle: 'Новий ресурс',
    resourceTypeLabel: 'Тип ресурсу', selectTypePlaceholder: 'Оберіть тип...', urlLabel: 'URL *',
    optionalDescLabel: 'Опис (необовʼязково)', optionalDescPlaceholder: 'Короткий опис...', addingResource: 'Додавання...',
    validationTitle: 'Перед подачею заповніть:', submitPrompt: 'Все готово? Подайте проєкт на розгляд.', submitBannerDesc: 'Після подачі редагування буде недоступне.', submitBtn: 'Подати проєкт на розгляд',
    submittedSuccessFooter: 'Проєкт передано на перевірку. Очікуйте рішення.',
  },
  mentorsTab: {
    title: 'Ментори', subtitle: 'Забронюйте слот для консультації',
    noMentors: 'Менторів немає', noMentorsDesc: 'Ментори ще не додали доступність',
    bookSlot: 'Забронювати', cancelBooking: 'Скасувати бронювання',
    booked: 'Заброньовано', available: 'Доступно', myBookings: 'Мої бронювання',
    duration: 'Тривалість', minutes: 'хв', message: 'Повідомлення',
    messagePlaceholder: 'Що хочете обговорити?', bookSuccess: 'Слот заброньовано!',
    cancelSuccess: 'Бронювання скасовано',
    days: ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    months: ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'],
    monthsFull: ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'],
    today: 'Сьогодні',
    bookingUnavailable: 'Бронювання менторів недоступне',
    bookingUnavailableDesc: 'Доступно під час етапу хакінгу.',
    noSlotsThisWeek: 'Немає слотів та бронювань на цей тиждень',
    nextWeek: 'Наступний тиждень →',
    archive: 'Архів',
    cancelSessionTitle: 'Скасувати сесію?',
    cancelSessionConfirm: 'Скасувати бронювання ментора {name}?',
    confirmCancelBtn: 'Так, скасувати',
    timePassed: 'Час минув',
    joinMeeting: 'Приєднатись',
    blocked: 'Заблоковано',
    minPerSlot: 'хв/слот',
    allSlotsBusy: 'Всі зайняті',
    slotBusy: 'Зайнято',
    dateTime: 'Дата і час',
    helpDescriptionPlaceholder: 'Опишіть, з чим потрібна допомога...',
    sendRequestConfirm: 'Надіслати запит на {time} ({duration} хв)?',
  },
  resultsTab: {
    title: 'Результати', noResults: 'Результати ще не оголошено',
    noResultsDesc: 'Зачекайте завершення суддівства', rank: '№', team: 'Команда',
    score: 'Бал', project: 'Проєкт', yourTeam: 'Ваша команда',
    place: 'місце', criteria: 'Критерій', weight: 'вага', progress: 'Прогрес',
    evaluatedBy: 'Оцінювали:', judgeSingular: 'суддя', judgePlural: 'судді',
    reasonLabel: 'Причина:', notSubmittedInTime: 'Проєкт не було подано вчасно', notInLeaderboard: 'Ваша команда не потрапила до рейтингу.',
    leaderboardTitle: 'Лідерборд', ratingLabel: 'Рейтинг', teamsCount: '{count} команд',
    noRankedTeams: 'Оцінених команд немає', unrankedTitle: 'Не потрапили до рейтингу', teamDisqualified: 'Команда дискваліфікована',
    teamNotSubmitted: 'Не подали проєкт', noProjectReason: 'Проєкт не подано', rejectedReason: 'Проєкт відхилено',
  },
  settingsTab: {
    title: 'Налаштування', danger: 'Небезпечна зона', leaveTeam: 'Покинути команду',
    leaveTeamConfirm: 'Ви впевнені, що хочете покинути команду?',
    disbandTeam: 'Розпустити команду',
    disbandTeamConfirm: 'Це незворотна дія. Команда та всі дані будуть видалені.',
    onlyCaptain: 'Тільки капітан команди може змінювати налаштування.',
    manageTeam: 'Керуй командою — редагуй або видаляй',
    editTeam: 'Редагувати команду',
    nameDescTrack: 'Назва, опис, трек',
    editWarning: 'Після збереження статус команди буде змінено на «Очікує перегляду» — організатор повинен повторно затвердити зміни.',
    min2Chars: 'Мінімум 2 символи',
    noTrack: '— Без треку —',
    trackChangeWarning: 'Зміна треку потребує затвердження організатора.',
    saveSuccess: 'Зміни збережено. Очікуйте затвердження організатора.',
    irreversible: 'Незворотня дія — всі дані будуть видалені',
    disbandWarning: 'Команда буде розпущена. Всі учасники, запрошення та дані команди будуть видалені. Відновити неможливо.',
    enterNameToConfirm: 'Введіть назву команди {name} для підтвердження:',
    deletePermanentlyBtn: '🗑 Видалити команду назавжди',
    deleting: 'Видалення...',
  },
  matchmaking: {
    title: 'Матчмейкінг', subtitle: 'Знайдіть учасників для своєї команди',
    searchPlaceholder: 'Пошук за ім\'ям або навичками...', noUsers: 'Нікого не знайдено',
    noUsersDesc: 'Спробуйте змінити параметри пошуку', inviteToTeam: 'Запросити до команди',
    invited: 'Запрошено', skills: 'Навички', lookingForTeam: 'Шукає команду',
    searchTeamTitle: 'Пошук команди',
    searchTeamSubtitle: 'Знайдіть команду для участі в хакатоні та подайте заявку на вступ',
    searchTeamPlaceholder: 'Пошук за назвою команди...',
    noTeamsFound: 'Команди не знайдено',
    noTeamsFoundDesc: 'Спробуйте змінити пошуковий запит або поверніться пізніше',
    fullBadge: '(заповнена)',
    teamApprovedBadge: 'Підтверджена',
    messageToCaptain: "Повідомлення для капітана (необов'язково)",
    aboutYourselfPlaceholder: 'Розкажіть про себе або свої навички...',
    requestSent: 'Заявку надіслано',
    requestError: 'Помилка. Спробуйте ще раз',
    loginToApply: 'Увійдіть, щоб подати заявку',
    applyBtn: 'Подати заявку',
    matchmakingTip: 'Після подачі заявки капітан команди отримає запит і зможе прийняти або відхилити вас. Слідкуйте за статусом у вкладці «Моя команда» в кабінеті хакатону.',
  },
  judge: {
    projects: 'Проєкти', scores: 'Оцінки', conflicts: 'Конфлікти',
    noProjects: 'Немає проєктів для оцінювання', noProjectsDesc: 'Проєкти ще не подані',
    score: 'Оцінити', totalScore: 'Загальний бал', commentLabel: 'Коментар',
    submitScore: 'Зберегти оцінку', scoreUpdated: 'Оцінку збережено',
    conflictMark: 'Позначити конфлікт', conflictRemove: 'Зняти конфлікт',
    noScores: 'Оцінок ще немає', noScoresDesc: 'Ви ще не оцінили жодного проєкту', noConflicts: 'Конфліктів немає',
    noConflictsDesc: 'Ви не позначили жодного конфлікту інтересів', hasConflict: 'Конфлікт',
    resolved: 'Вирішено', selectHackathon: 'Оберіть хакатон', scored: 'Оцінено', untitled: 'Без назви',
    selectHackathonPlaceholder: 'Оберіть хакатон...',
    noTrack: 'Без треку',
    notAssignedToTrack: 'Вас ще не призначено на жоден трек',
    contactOrganizerForTrack: 'Зверніться до організатора хакатону для отримання призначення.',
    hackathonFinishedJudgingClosed: 'Хакатон завершено — оцінювання закрито',
    canViewCannotEditScores: 'Ви можете переглядати проєкти, але не змінювати оцінки.',
    youAreJudgeOfTracks: 'Ви суддя треків:',
    judgingProgress: 'Прогрес оцінювання',
    of: 'з',
    projectsCount: (n: number) => n === 1 ? 'проєкту' : 'проєктів',
    completed: 'виконано',
    projectSingular: 'проєкт',
    projectPlural: 'проєктів',
    notEvaluated: 'Не оцінено',
    teamLabel: 'Команда: ',
    submitted: 'Подано',
    evaluationUnavailable: 'Оцінювання недоступне',
    conflictTitle: 'Конфлікт інтересів',
    conflictSubtitle: 'Управління конфліктами інтересів з командами',
    whatIsConflict: 'Що таке конфлікт інтересів?',
    conflictInfoDesc: 'Якщо ви були ментором команди або маєте особисті стосунки з її учасниками — ви зобов\'язані повідомити про конфлікт. Після цього ви не зможете оцінювати цю команду.',
    dismissInfo: 'Зрозуміло, більше не показувати',
    reportedAllConflicts: '✅ Ви повідомили про конфлікти для всіх команд у ваших треках.',
    selectTeam: 'Оберіть команду',
    notSelected: '— Не обрано —',
    conflictType: 'Тип конфлікту',
    mentorReason: 'Ментор',
    personalReason: 'Особисті стосунки',
    mentorReasonDesc: 'Я консультував цю команду як ментор',
    personalReasonDesc: 'Я особисто знайомий з учасниками',
    reportConflictBtn: 'Повідомити про конфлікт',
    processing: 'Обробка...',
    errorReporting: 'Помилка при декларуванні',
    myConflicts: 'Мої конфлікти',
    recordedAt: 'Зафіксовано:',
    mentoredReasonLabel: '👨‍🏫 Ментор команди',
    personalReasonLabel: '👥 Особисті стосунки',
    scoresSubtitle: 'Перегляд та редагування виставлених вами оцінок',
    scoredProjects: 'Оцінено проєктів',
    avgAssessment: 'Середній бал',
    highestScore: 'Найвища оцінка',
    lowestScore: 'Найнижча оцінка',
    judgingHistory: 'Історія оцінювання',
    avgScore: 'Середнє',
    updatedAt: 'Оновлено',
    actions: 'Дії',
    ago: 'тому',
    editScore: 'Редагувати оцінку',
    backToList: 'Повернутись до списку',
    descriptionMissing: 'Опис відсутній.',
    noResourcesSubmitted: 'Команда не додала ресурси.',
    presentationLabel: 'Презентація',
    judgesScores: (n: number) => `Оцінки суддів (${n})`,
    judgeComment: 'Коментар судді',
    alreadyScored: 'Ви вже оцінили цей проєкт',
    alreadyScoredDesc: (time: string) => `${time} тому. Змінити можна до закінчення суддівства.`,
    draftFound: 'Знайдено незбережену чернетку',
    draftSavedAgo: (time: string) => `Збережено ${time} тому`,
    restore: 'Відновити',
    ignore: 'Ігнорувати',
    myAssessment: 'Моя оцінка',
    weightLabel: (weight: number) => `вага: ${weight}%`,
    commentOptional: 'Коментар (необов\'язково)',
    commentPlaceholder: 'Що сподобалось, що варто покращити...',
    summaryScore: 'Підсумкова оцінка',
    totalLabel: 'Загалом:',
    judgingClosed: 'Оцінювання закрито',
    updateScore: 'Оновити оцінку',
  },
  mentor: {
    mySlots: 'Мої слоти', availability: 'Доступність', createSlot: 'Додати слот',
    noSlots: 'Немає слотів', noSlotsDesc: 'Додайте доступний час для консультацій',
    slotDate: 'Дата', startTime: 'Початок', endTime: 'Кінець', slotDuration: 'Тривалість слоту (хв)',
    requests: 'Запити', accept: 'Прийняти', decline: 'Відхилити', complete: 'Завершити',
    pending: 'Очікує', accepted: 'Прийнято', declined: 'Відхилено', completed: 'Завершено',
    cancelled: 'Скасовано', noRequests: 'Запитів немає', selectTrack: 'Обрати трек',
    hackathonLabel: 'Хакатон', deleteSlot: 'Видалити слот',
    deleteSlotConfirm: 'Видалити слот? Всі пов\'язані запити будуть скасовані.',
    daysFull: ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота'],
    monthsFull: ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'],
    noBookedSessions: 'У вас ще немає заброньованих сесій',
    noUpcomingSessions: 'Немає запланованих сесій',
    noCompletedSessions: 'Ще немає завершених сесій',
    noCancelledSessions: 'Скасованих сесій немає',
    allStats: 'Всього',
    todaySessionsCount: (n: number) => n === 1 ? `Сьогодні у вас 1 сесія` : `Сьогодні у вас ${n} сесії`,
    nextSessionInfo: (team: string, time: string, mins: string) => `Наступна: ${team} о ${time} (через ${mins} хв)`,
    nextSessionInfoNow: (team: string, time: string) => `Наступна: ${team} о ${time} (зараз)`,
    joinNow: '🟢 Приєднатись зараз',
    openMeetingLink: 'Відкрити посилання на зустріч',
    filterScheduled: 'Заплановані',
    filterCompleted: 'Завершені',
    filterCancelled: 'Скасовані / Відхилені',
    teamLabel: '👥 Команда: ',
    trackLabel: '🎯 Трек: ',
    openLink: 'Відкрити',
    completedAgo: (time: string) => `Завершено · ${time} тому`,
    timePassed: '🕒 Час минув',
    bookedStatus: '● Заброньовано',
    confirmBtn: (secs: number) => `Підтвердити? (${secs}с)`,
    markCompleted: '✓ Позначити як завершено',
    sessionStartsIn: (team: string, mins: number) => `Сесія з ${team} починається через ${mins} хв`,
    joinArrow: 'Приєднатись →',
    sessionsTitle: 'Мої сесії',
    sessionsSubtitle: 'Управління заброньованими сесіями',
    slotsCount: (n: number) => `${n} слотів`,
    freeLabel: 'Вільних',
    pendingLabel: 'Очікує',
    confirmedLabel: 'Підтверджено',
    blockedLabel: 'Заблоковано',
    requestLabel: 'Запит: ',
    freeSlotLabel: 'Вільний слот',
    pendingStatusLabel: '⏳ Очікує',
    confirmedStatusLabel: '✓ Підтверджено',
    completedStatusLabel: '✅ Завершено',
    blockedStatusLabel: '🔒 Заблоковано',
    rejectedStatusLabel: '✗ Відхилено',
    cancelledStatusLabel: '✗ Скасовано',
    blockAction: '🔒 Блокувати',
    unblockAction: 'Розблокувати',
    meetingLinkLabel: 'Google Meet / Zoom посилання',
    acceptAction: '✓ Прийняти',
    declineAction: '✗ Відхилити',
    deleteAvailabilityTitle: 'Видалити блок доступності?',
    deleteAvailabilityHasBookings: (n: number) => `Є ${n} активних бронювань. Команди отримають сповіщення.`,
    deleteAvailabilityConfirm: (time: string) => `Видалити блок ${time}?`,
    deleteConfirmBtn: 'Так, видалити',
    statsAvailBlocks: 'Блоків доступності',
    statsFreeSlots: 'Вільних слотів',
    statsThisWeek: 'Цього тижня',
    allHackathonsSelector: 'Всі хакатони',
    mySchedule: 'Мій розклад',
    calendarSubtitle: 'Календар менторських сесій',
    availabilityHint: 'Ваші слоти бачать лише команди хакатонів, на які вас призначив адміністратор. При видаленні слоту з активними бронюваннями — команди отримають сповіщення.',
    todayNav: '← Сьогодні',
    legendFree: 'Вільний',
    legendPending: 'Очікує запит',
    legendConfirmed: 'Підтверджений',
    legendBlocked: 'Заблокований',
    addAvailabilityTitle: 'Додати доступність',
    allTracks: '🌐 Всі треки',
    selectDateTime: 'Оберіть дату та час',
    increaseRange: 'Збільшіть діапазон або зменшіть тривалість',
    startTimePassed: 'Час початку вже минув. Оберіть час у майбутньому.',
    endTimeLater: 'Кінець має бути пізніше початку',
    futureDateOnly: 'Оберіть майбутню дату',
    selectDateError: 'Оберіть дату',
    overlapError: 'Цей час перетинається з іншим вашим блоком доступності. Оберіть інший час.',
    addToScheduleBtn: 'Додати до розкладу',
    slotsOf: (count: number, duration: number) => `📅 ${count} слотів по ${duration} хв`,
    sessionImminentHeader: (mins: number) => `Сесія починається через ${mins} хв`,
    sessionWaitingTeam: (team: string) => `Команда ${team} чекає на вас.`,
    joinCall: 'Приєднатись до дзвінка',
  },
  publicHackathon: {
    register: 'Зареєструватись', registered: 'Ви зареєстровані', description: 'Опис',
    tracks: 'Треки', schedule: 'Розклад', prizes: 'Призи', organizer: 'Організатор',
    startDate: 'Початок', endDate: 'Кінець', maxTeamSize: 'Макс. учасників',
    minTeamSize: 'Мін. учасників', teamSize: 'Розмір команди',
    loginToRegister: 'Увійдіть для реєстрації', alreadyRegistered: 'Вже зареєстровано',
    registerSuccess: 'Ви успішно зареєстровані!', rules: 'Правила', requirements: 'Вимоги',
    manual: 'мануал',
    noManual: 'Організатори ще не заповнили детальний мануал для цього треку.',
    currentStage: 'Зараз',
    futureStage: 'майбутній',
    allHackathons: 'Всі хакатони',
    hackathonNotFound: 'Хакатон не знайдено',
    stageLabel: 'Етап',
    tracksTitle: 'Напрямки (Tracks)',
    stagesTitle: 'Етапи хакатону',
    datesTitle: 'Дати проведення',
    formatTitle: 'Формат',
    onlineFormat: 'Онлайн',
    teamCompositionTitle: 'Склад команди',
    teamCompositionDesc: 'учасників',
    rulesButton: 'Правила участі',
    registrationClosed: 'Реєстрація закрита',
    applyButton: 'Подати заявку на участь',
    tagsTitle: 'Теги',
  },
  mentorsPage: {
    title: 'Ментори Hack-Flow', subtitle: 'Досвідчені фахівці, готові допомогти вашій команді.',
    searchPlaceholder: 'Пошук за ім\'ям, навичками...', noMentors: 'Менторів поки немає',
    noResults: 'Нікого не знайдено за вашим запитом', clearSearch: 'Очистити пошук',
    wantMentor: 'Хочете стати ментором?', contactAdmin: 'Написати адміністратору',
    loginToView: 'Увійдіть для перегляду', mentor: 'Ментор',
    count: (n: number) => n === 1 ? 'ментор' : n < 5 ? 'ментори' : 'менторів',
    loadError: 'Не вдалось завантажити список менторів.',
    wantMentorDesc: 'Якщо маєте досвід у розробці, дизайні або стартапах — напишіть адміністратору.',
  },
  aboutPage: {
    title: 'Про Hack-Flow', studentProject: 'Студентський проєкт',
    hackathons: 'Хакатони', hackathonsDesc: 'Повний цикл управління хакатонами.',
    mentorship: 'Ментори', mentorshipDesc: 'Система менторства з бронюванням слотів.',
    openSource: 'Відкритий код', openSourceDesc: 'Проєкт з відкритим кодом на GitHub.',
    developer: 'Розробник', student: 'Студент Коледжу УжНУ', institution: 'Навчальний заклад',
    techStack: 'Технології', viewHackathons: 'Переглянути хакатони',
    collegeDesc: 'Проєкт розроблений на базі Коледжу Ужгородського національного університету.',
    collegeLinkText: 'Сайт коледжу',
    developerName: 'Адріан Тежа',
    heroDescription: 'Hack-Flow — платформа для організації та проведення хакатонів, розроблена студентами Коледжу УжНУ як дипломний проєкт.',
  },
  adminDashboard: {
    title: 'Панель адміністратора', totalHackathons: 'Хакатони', totalTeams: 'Команди',
    totalUsers: 'Користувачі', totalProjects: 'Проєкти', activeHackathons: 'Активні хакатони',
    recentActivity: 'Остання активність', quickActions: 'Швидкі дії',
    createHackathon: 'Створити хакатон', manageUsers: 'Керувати користувачами', viewTeams: 'Переглянути команди',
  },
  adminHackathons: {
    title: 'Хакатони', create: 'Створити хакатон', edit: 'Редагувати', delete: 'Видалити',
    searchPlaceholder: 'Пошук хакатонів...', noHackathons: 'Немає хакатонів',
    status: 'Статус', participants: 'Учасники', teams: 'Команди', tracks: 'Треки',
    stages: 'Етапи', deleteConfirm: 'Видалити хакатон? Цю дію не можна скасувати.',
    publish: 'Опублікувати', archive: 'Архівувати', name: 'Назва', description: 'Опис',
    startDate: 'Дата початку', endDate: 'Дата завершення', maxTeamSize: 'Макс. команда',
    minTeamSize: 'Мін. команда', tags: 'Теги', prizes: 'Призи', awards: 'Нагороди',
    createSuccess: 'Хакатон створено', updateSuccess: 'Хакатон оновлено', deleteSuccess: 'Хакатон видалено',
    formTitle: 'Налаштування хакатону', formSubtitle: 'Заповніть інформацію про хакатон',
    back: 'Назад до списку', approvals: 'Заявки команд', approveTeam: 'Схвалити',
    rejectTeam: 'Відхилити', generateResults: 'Сформувати результати', results: 'Результати',
    teamsSelected: (n: number) => {
      const lastDigit = n % 10;
      const lastTwo = n % 100;
      if (lastTwo >= 11 && lastTwo <= 19) return `Обрано ${n} команд`;
      if (lastDigit === 1) return `Обрано ${n} команду`;
      if (lastDigit >= 2 && lastDigit <= 4) return `Обрано ${n} команди`;
      return `Обрано ${n} команд`;
    },
    approveAll: 'Схвалити всі',
    rejectAll: 'Відхилити всі',
    noApprovalRecords: 'Записів про затвердження ще немає.',
  },
  adminTeams: {
    title: 'Команди', searchPlaceholder: 'Пошук команд...', noTeams: 'Немає команд',
    members: 'Учасники', captain: 'Капітан', track: 'Трек', hackathon: 'Хакатон',
    status: 'Статус', approve: 'Схвалити', reject: 'Відхилити', disqualify: 'Дискваліфікувати',
    view: 'Переглянути', project: 'Проєкт', scores: 'Оцінки',
  },
  adminUsers: {
    title: 'Користувачі', searchPlaceholder: 'Пошук користувачів...', noUsers: 'Немає користувачів',
    role: 'Роль', email: 'Email', username: 'Нікнейм', fullName: 'Ім\'я', status: 'Статус',
    view: 'Переглянути', edit: 'Редагувати', changeRole: 'Змінити роль',
    activity: 'Активність', teams: 'Команди', hackathons: 'Хакатони',
    roles: { admin: 'Адміністратор', judge: 'Суддя', mentor: 'Ментор', participant: 'Учасник' },
  },
  adminJudging: {
    title: 'Суддівство', selectHackathon: 'Оберіть хакатон', noHackathon: 'Хакатон не обрано',
    judges: 'Судді', projects: 'Проєкти', scores: 'Оцінки', track: 'Трек',
    assignJudge: 'Призначити суддю', removeJudge: 'Зняти суддю', scoreDetail: 'Деталі оцінки',
    totalScore: 'Загальний бал', avgScore: 'Середній бал', noScores: 'Оцінок немає',
  },
  adminMentorship: {
    title: 'Менторство', selectHackathon: 'Оберіть хакатон', mentors: 'Ментори',
    slots: 'Слоти', requests: 'Запити', status: 'Статус', accept: 'Прийняти',
    decline: 'Відхилити', pending: 'Очікує', accepted: 'Прийнято', declined: 'Відхилено',
    completed: 'Завершено', cancelled: 'Скасовано',
  },
  shared: {
    confirmDelete: 'Підтвердіть видалення', areYouSure: 'Ви впевнені?',
    thisActionCannotBeUndone: 'Цю дію не можна скасувати.',
    notifications: 'Сповіщення', noNotifications: 'Немає сповіщень', markAllRead: 'Позначити всі прочитаними',
    hackathonCard: {
      participants: 'учасників', teams: 'команд', prize: 'Приз', register: 'Реєстрація',
      viewMore: 'Детальніше', startDate: 'Початок', endDate: 'Кінець',
    },
    statusBadge: {
      active: 'Активний', upcoming: 'Майбутній', past: 'Минулий', draft: 'Чернетка',
      published: 'Опубліковано', registration: 'Реєстрація', hacking: 'Хакінг',
      judging: 'Суддівство', finished: 'Завершено',
    },
    emptyState: { defaultTitle: 'Нічого не знайдено', defaultDesc: 'Спробуйте змінити параметри пошуку' },
  },
  joinTeamPage: {
    alreadyMember: 'Ви вже є учасником команди в цьому хакатоні',
    invalidInvite: 'Це запрошення більше не дійсне. Попросіть капітана надіслати нове.',
    joiningError: 'Помилка при приєднанні',
    successTitle: 'Ви приєдналися до команди!',
    redirecting: 'Переходимо до вашого кабінету...',
    errorTitle: 'Помилка',
    invitedTitle: 'Вас запрошено до команди',
    loginToSeeDetails: 'Щоб побачити деталі, увійдіть або зареєструйтесь',
    loginToJoinPrompt: 'Щоб приєднатись, увійдіть або зареєструйтесь',
    loginBtn: 'Увійти',
    registerBtn: 'Зареєструватись',
    confirmTitle: 'Приєднатись до команди?',
    declineBtn: 'Відхилити',
    joinBtn: 'Приєднатись ✓',
    backToHackathons: 'До моїх хакатонів',
  },
  userGuide: {
    guideTitle: 'Посібник користувача',
    heroTitle: 'Як користуватись',
    heroTitle2: 'Hack-Flow',
    heroSubtitle: 'Детальний покроковий посібник для всіх ролей платформи. Від реєстрації до отримання нагород — пояснюємо кожен крок простою мовою.',
    participantLabel: 'Учасник',
    judgeLabel: 'Суддя',
    mentorLabel: 'Ментор',
    selectedBadge: 'Обрано',
    participantRoleTitle: 'Ви — Учасник хакатону',
    participantRoleDesc: 'Учасники реєструються, формують команди, подають проєкти та замовляють консультації у менторів. Саме ви — серце кожного хакатону.',
    judgeRoleTitle: 'Ви — Суддя хакатону',
    judgeRoleDesc: 'Судді оцінюють проєкти команд за встановленими критеріями. Ваші оцінки визначають переможців, тому чесність та послідовність — найважливіші якості.',
    mentorRoleTitle: 'Ви — Ментор хакатону',
    mentorRoleDesc: 'Ментори надають консультації командам під час хакатону. Ви ділитесь досвідом, допомагаєте вирішувати проблеми та направляєте учасників до кращого результату.',
    faqTitle: 'Часті запитання',
    glossaryTitle: 'Словник термінів',
    ctaTitle: 'Готові розпочати?',
    ctaSubtitle: 'Зареєструйтесь на платформі та приєднуйтесь до наступного хакатону вже сьогодні.',
    ctaRegister: 'Зареєструватись',
    ctaHome: 'На головну',
    participantSteps: [
      {
        title: '1. Реєстрація на платформі',
        description: 'Перейдіть на головну сторінку та натисніть кнопку «Зареєструватися». Заповніть ім\'я, email та пароль. Після реєстрації ви автоматично отримуєте роль Учасника.',
        tip: 'Використовуйте реальне ім\'я — воно відображається команді та організаторам.',
      },
      {
        title: '2. Перегляд хакатонів',
        description: 'У розділі «Хакатони» ви побачите всі доступні змагання. Натисніть на картку хакатону щоб побачити деталі: дати, треки, призи та правила.',
        tip: 'Хакатони зі статусом «Реєстрація відкрита» доступні для приєднання прямо зараз.',
      },
      {
        title: '3. Створення або приєднання до команди',
        description: 'Після вибору хакатону — створіть нову команду або приєднайтеся за інвайт-посиланням. Щоб запросити учасника — відкрийте вкладку «Команда» → «Запросити учасника» → скопіюйте посилання та надішліть другу.',
        tip: 'Інвайт-посилання діє обмежений час. Якщо протермінувалось — згенеруйте нове.',
      },
      {
        title: '4. Пошук команди через Matchmaking',
        description: 'Якщо ви шукаєте команду або вільних учасників — скористайтеся розділом «Matchmaking». Позначте себе як «Шукаю команду» у профілі, і вас побачать капітани.',
        tip: 'Заповніть профіль: навички та опис значно підвищують шанси бути поміченим.',
      },
      {
        title: '5. Подача проєкту',
        description: 'У вкладці «Проєкт» на дашборді хакатону заповніть назву, опис та додайте ресурси (GitHub, відео, слайди). Натисніть «Подати проєкт» — після цього він потрапить на оцінювання суддям.',
        tip: 'Переконайтеся що всі посилання відкриті (public) перед подачею.',
      },
      {
        title: '6. Бронювання ментора',
        description: 'У вкладці «Ментори» виберіть доступного ментора та вільний часовий слот. Заповніть тему консультації та натисніть «Забронювати». Ментор підтвердить або відхилить запит.',
        tip: 'Не забудьте перевірити статус запиту — після підтвердження з\'явиться посилання на зустріч.',
      },
      {
        title: '7. Результати та нагороди',
        description: 'Після завершення судді оцінять проєкти. У вкладці «Результати» ви побачите ранжування команд, бали та нагороди. Бали автоматично нормалізуються для справедливості.',
      },
    ],
    judgeSteps: [
      {
        title: '1. Вхід у систему',
        description: 'Адміністратор заздалегідь створює ваш акаунт із роллю «Суддя». Увійдіть на платформу, і система автоматично покаже ваш робочий кабінет судді.',
      },
      {
        title: '2. Перегляд призначених проєктів',
        description: 'Розділ «Мої проєкти» показує всі проєкти, призначені вам для оцінювання. Вони відсортовані по треках, до яких вас призначив організатор.',
        tip: 'Ви бачите тільки проєкти свого треку — це зроблено навмисно для справедливості.',
      },
      {
        title: '3. Декларування конфлікту інтересів',
        description: 'ВАЖЛИВО: Якщо ви знаєте учасників команди особисто (родичі, колеги, ви їх менторували) — зайдіть в «Конфлікти інтересів» та задекларуйте конфлікт з цією командою. Ви не зможете оцінювати їхній проєкт.',
        tip: 'Система автоматично заблокує оцінювання команд, з якими ви декларували конфлікт.',
      },
      {
        title: '4. Виставлення оцінок',
        description: 'Натисніть «Оцінити» навпроти проєкту. Для кожного критерію трека виставте бал від 0 до максимального значення. Можна залишити коментар до кожного критерію.',
        tip: 'Оцінки можна змінювати до закінчення фази судді. Після закриття — зміни неможливі.',
      },
      {
        title: '5. Огляд поданих оцінок',
        description: 'У розділі «Мої оцінки» ви бачите всі виставлені вами бали. Це допомагає відстежити які проєкти вже оцінені, а які ще ні.',
      },
      {
        title: '6. Як рахуються бали?',
        description: 'Система автоматично нормалізує ваші оцінки відносно середнього балу всіх суддів. Це означає: якщо ви ставите середні бали, а інший суддя ставить завищені — алгоритм це враховує та прибирає упередженість.',
        tip: 'Будьте чесні та послідовні — алгоритм нормалізації найкраще працює при стабільному підході до оцінювання.',
      },
    ],
    mentorSteps: [
      {
        title: '1. Вхід у систему',
        description: 'Адміністратор заздалегідь надає вам роль «Ментор». Увійдіть на платформу — ви потрапите в кабінет ментора з двома розділами: «Доступність» та «Мої слоти».',
      },
      {
        title: '2. Налаштування доступності',
        description: 'У розділі «Доступність» додайте часові вікна, коли ви готові проводити консультації. Вкажіть початок і кінець доступності, теми (JavaScript, UI/UX, бізнес тощо) та максимальну кількість одночасних сесій.',
        tip: 'Уникайте перекриття часових вікон — система не дозволить додати конфліктуючі слоти.',
      },
      {
        title: '3. Підтвердження запитів',
        description: 'Коли команда бронює ваш слот — ви отримаєте запит у розділі «Мої слоти». Перегляньте деталі: хто, коли, тема. Підтвердіть або відхиліть запит.',
        tip: 'При підтвердженні обов\'язково вкажіть посилання на зустріч (Zoom, Google Meet тощо) — учасники побачать його у своєму кабінеті.',
      },
      {
        title: '4. Нагадування',
        description: 'Система автоматично надсилає нагадування перед початком підтвердженої сесії. Час нагадування налаштовується адміністратором платформи.',
      },
      {
        title: '5. Завершення сесії',
        description: 'Після проведення консультації — позначте слот як «Завершено». Це оновить статистику та дозволить учасникам знати що сесія відбулась.',
      },
      {
        title: '6. Блокування часу',
        description: 'Якщо вам потрібно заблокувати час (власні справи, відпустка) — скористайтеся функцією «Заблокувати слот». Команди не зможуть забронювати цей час.',
      },
    ],
    faq: [
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
    ],
    glossary: [
      { term: 'Хакатон', def: 'Змагання де команди за обмежений час розробляють проєкт і представляють його журі.' },
      { term: 'Трек', def: 'Тематичний напрямок хакатону (наприклад: AI, Web3, EdTech). Команда обирає трек на початку.' },
      { term: 'Стадія', def: 'Поточний етап хакатону: Реєстрація → Хакінг → Презентація → Суддівство → Завершено.' },
      { term: 'Matchmaking', def: 'Система пошуку команди або учасників. Корисна якщо ви шукаєте команду або потрібен новий учасник.' },
      { term: 'Критерій оцінювання', def: 'Параметр за яким суддя оцінює проєкт (наприклад: інноваційність, якість коду, презентація).' },
      { term: 'Нормалізація балів', def: 'Математичний алгоритм що прибирає упередженість суддів — "суворий" та "добрий" суддя стають рівноцінними.' },
      { term: 'Конфлікт інтересів', def: 'Особиста або ділова пов\'язаність судді з командою яку він оцінює. Обов\'язково декларується.' },
      { term: 'Інвайт-посилання', def: 'Унікальне посилання для запрошення до команди. Має термін дії та ліміт використань.' },
    ],
  },
  adminDashboardPage: {
    judgingTab: 'Суддівство',
    mentorshipTab: 'Менторство',
    teamsInLeaderboard: 'Команд у лідерборді',
    judgeConflicts: 'Конфлікти суддів',
    tracks: 'Треки',
    criteria: 'Критеріїв',
    leaderboard: 'Лідерборд',
    scores: 'Оцінки',
    criteriaTab: 'Критерії',
    conflictsTab: 'Конфлікти',
    selectHackathonLeaderboard: 'Оберіть хакатон для перегляду лідерборду',
    team: 'Команда',
    track: 'Трек',
    score: 'Бал',
    actions: 'Дії',
    noData: 'Немає даних',
    stats: 'Статистика',
    selectHackathonScores: 'Оберіть хакатон для перегляду оцінок',
    teamScores: 'Оцінки команд',
    noTeams: 'Немає команд',
    addConflict: 'Додати конфлікт',
    selectJudge: 'Оберіть суддю',
    selectTeam: 'Оберіть команду',
    mentoredTeam: '👨‍🏫 Ментор команди',
    personalRelationship: '👥 Особисті стосунки',
    save: 'Зберегти',
    judge: 'Суддя',
    email: 'Email',
    date: 'Дата',
    noConflicts: 'Жодних конфліктів не зафіксовано',
    selectHackathonFilter: 'Оберіть хакатон для фільтрації або переглядайте всі',
    notSpecified: 'Не вказано',
    confirmDeleteConflict: 'Видалити конфлікт?',
    evaluationCriteria: 'Критерії оцінювання',
    selectTrack: 'Оберіть трек',
    addCriterion: 'Додати критерій',
    criterionName: 'Назва критерію',
    maxScore: 'Макс. бал',
    weight: 'Вага',
    descriptionOptional: "Опис (необов'язково)",
    selectTrackView: 'Оберіть трек для перегляду критеріїв',
    noCriteria: 'Немає критеріїв',
    all: 'Всього',
    pending: '⏳ Очікує',
    acceptedStatus: '✓ Підтверджено',
    completedStatus: '✅ Завершено',
    rejectedStatus: '✗ Відхилено',
    cancelledStatus: '✗ Скасовано',
    blockedStatus: '🔒 Заблок.',
    mentorshipRequests: 'Запити на менторство',
    noRequests: 'Немає запитів',
    mentor: 'Ментор',
    time: 'Час',
    duration: 'Тривалість',
    minutes: 'хв',
    adminPanelTitle: 'Адмін-панель',
    adminPanelSubtitle: 'Управління суддівством та менторством',
    allHackathons: '🌐 Всі хакатони',
  },
  notificationAlerts: {
    hackathonDefault: 'Хакатон',
    approvedTitle: (team: string) => `✅ Команду «${team}» схвалено`,
    approvedBodyComment: (comment: string) => `Коментар організатора: ${comment}`,
    approvedBodyDefault: (hackathon: string) => `Ваша команда успішно затверджена для участі в хакатоні «${hackathon}».`,
    rejectedTitle: (team: string) => `❌ Команду «${team}» відхилено`,
    rejectedBodyComment: (comment: string) => `Причина: ${comment}`,
    rejectedBodyDefault: 'Організатор відхилив вашу команду без пояснення.',
    disqualifiedTitle: (team: string) => `🚫 Команду «${team}» дискваліфіковано`,
    disqualifiedBodyComment: (comment: string) => `Причина: ${comment}`,
    disqualifiedBodyDefault: 'Зверніться до організаторів хакатону.',
    pendingTitle: (team: string) => `⏳ Заявку команди «${team}» повернуто на розгляд`,
    pendingBodyComment: (comment: string) => `Повідомлення організатора: ${comment}`,
  },
}
