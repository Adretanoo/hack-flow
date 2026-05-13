import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as bcrypt from 'bcryptjs';
import {
  users, roles, userRoles, userSocials,
  hackathons, hackathonTags, hackathonTagRelations,
  stages, tracks,
  teams, teamMembers, teamApprovals, teamStage,
  projects, projectResources,
  mentorAvailabilities, mentorRequests,
  scores, criteria, judgeConflicts, judgeTrack
} from '../drizzle/schema';
import * as schema from '../drizzle/schema';
import { env } from '../config/env';
import { eq, inArray, and } from 'drizzle-orm';

const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
});

const db = drizzle(pool, { schema });

async function cleanDatabase() {
  await db.delete(scores);
  await db.delete(judgeConflicts);
  await db.delete(mentorRequests);
  await db.delete(mentorAvailabilities);
  await db.delete(projectResources);
  await db.delete(schema.projectResourceTypes);
  await db.delete(projects);
  await db.delete(schema.teamAwards);
  await db.delete(schema.awards);
  await db.delete(teamApprovals);
  await db.delete(teamMembers);
  await db.delete(teamStage);
  await db.delete(teams);
  await db.delete(criteria);
  await db.delete(judgeTrack);
  await db.delete(tracks);
  await db.delete(stages);
  await db.delete(hackathonTagRelations);
  await db.delete(hackathons);
  await db.delete(hackathonTags);
  await db.delete(userSocials);
  await db.delete(userRoles);
  await db.delete(users);
}

async function getRoles() {
  const DEFAULT_ROLES = ['admin', 'judge', 'mentor', 'participant'] as const;

  for (const name of DEFAULT_ROLES) {
    await db.insert(roles).values({ name }).onConflictDoNothing().execute();
  }

  const allRoles = await db.select().from(roles);
  return {
    admin: allRoles.find(r => r.name === 'admin')?.id,
    judge: allRoles.find(r => r.name === 'judge')?.id,
    mentor: allRoles.find(r => r.name === 'mentor')?.id,
    participant: allRoles.find(r => r.name === 'participant')?.id,
  };
}

async function seedUsers() {
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const roleIds = await getRoles();

  const usersData = [
    // Admins
    { email: 'admin@hackflow.com', fullName: 'Адмін Системи', username: 'admin', role: 'admin' },
    { email: 'organizer@hackflow.com', fullName: 'Організатор Іван', username: 'organizer', role: 'admin' },
    // Judges
    { email: 'judge1@hackflow.com', fullName: 'Суддя Олена Коваль', username: 'judge1', role: 'judge' },
    { email: 'judge2@hackflow.com', fullName: 'Суддя Михайло Бойко', username: 'judge2', role: 'judge' },
    { email: 'judge3@hackflow.com', fullName: 'Суддя Андрій Мельник', username: 'judge3', role: 'judge' },
    // Mentors
    { email: 'mentor1@hackflow.com', fullName: 'Ментор Sophia Chen', username: 'mentor1', role: 'mentor' },
    { email: 'mentor2@hackflow.com', fullName: 'Ментор Олексій Шевченко', username: 'mentor2', role: 'mentor' },
    { email: 'mentor3@hackflow.com', fullName: 'Ментор Аліна Петренко', username: 'mentor3', role: 'mentor' },
    // Participants
    { email: 'user1@hackflow.com', fullName: 'Денис Ткаченко', username: 'user1', role: 'participant', skills: ['React', 'TypeScript', 'Node.js'] },
    { email: 'user2@hackflow.com', fullName: 'Марія Іваненко', username: 'user2', role: 'participant', skills: ['Python', 'ML', 'FastAPI'] },
    { email: 'user3@hackflow.com', fullName: 'Богдан Сидоренко', username: 'user3', role: 'participant', skills: ['Vue.js', 'PostgreSQL'] },
    { email: 'user4@hackflow.com', fullName: 'Юлія Кравченко', username: 'user4', role: 'participant', skills: ['UI/UX', 'Figma', 'React'] },
    { email: 'user5@hackflow.com', fullName: 'Артем Павленко', username: 'user5', role: 'participant', skills: ['Go', 'Docker', 'K8s'], isLookingForTeam: true },
    { email: 'user6@hackflow.com', fullName: 'Олена Романенко', username: 'user6', role: 'participant', skills: ['React', 'GraphQL'], isLookingForTeam: true },
    { email: 'user7@hackflow.com', fullName: 'Ігор Лисенко', username: 'user7', role: 'participant', skills: ['Python', 'Data Science'], isLookingForTeam: true },
    { email: 'user8@hackflow.com', fullName: 'Vasyl Kovalenko', username: 'user8', role: 'participant', skills: ['React', 'Node.js'] },
    { email: 'user9@hackflow.com', fullName: 'Natalia Bondar', username: 'user9', role: 'participant', skills: ['CSS', 'Vue.js'] },
    { email: 'user10@hackflow.com', fullName: 'Roman Savchenko', username: 'user10', role: 'participant', skills: ['Python', 'CV'] },
  ];

  const createdUsers: any = {};

  for (const u of usersData) {
    const [inserted] = await db.insert(users).values({
      email: u.email,
      fullName: u.fullName,
      username: u.username,
      passwordHash,
      skills: u.skills || [],
      isLookingForTeam: u.isLookingForTeam || false,
    }).returning();

    createdUsers[u.username] = inserted;

    const rId = roleIds[u.role as keyof typeof roleIds];
    if (rId) {
      await db.insert(userRoles).values({
        userId: inserted.id,
        roleId: rId,
      });
    }
  }

  // Socials
  const socialUsernames = ['user1', 'user2', 'user3', 'user4'];
  for (const un of socialUsernames) {
    const uId = createdUsers[un].id;
    await db.insert(userSocials).values([
      { userId: uId, typeSocial: 'github', url: `https://github.com/${un}` },
      { userId: uId, typeSocial: 'telegram', url: `https://t.me/${un}` },
      { userId: uId, typeSocial: 'discord', url: `https://discord.com/users/${un}` },
    ]);
  }

  return createdUsers;
}

async function seedTags() {
  const tagNames = ['web', 'ai/ml', 'mobile', 'cybersecurity', 'blockchain', 'iot', 'edtech', 'healthtech'];
  const createdTags: any = {};
  for (const name of tagNames) {
    const [inserted] = await db.insert(hackathonTags).values({ name }).returning();
    createdTags[name] = inserted;
  }
  return createdTags;
}

async function seedHackathons(tags: any) {
  const createdHackathons: any = {};

  const now = new Date();

  // Hackathon 1
  const [h1] = await db.insert(hackathons).values({
    title: 'IT-Fest 2025',
    subtitle: 'Найбільший студентський хакатон України',
    online: false,
    location: 'КПІ ім. Ігоря Сікорського, Київ',
    contactEmail: 'organizer@hackflow.com',
    minTeamSize: 2,
    maxTeamSize: 5,
    status: 'PUBLISHED',
    banner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=2000',
    startDate: new Date(now.getTime() - 7 * 86400000),
    endDate: new Date(now.getTime() + 3 * 86400000),
  }).returning();
  createdHackathons['IT-Fest 2025'] = h1;

  for (const t of ['web', 'ai/ml', 'mobile']) {
    await db.insert(hackathonTagRelations).values({ hackathonId: h1.id, tagId: tags[t].id });
  }

  // Hackathon 2
  const [h2] = await db.insert(hackathons).values({
    title: 'CyberHack 2025',
    subtitle: 'Хакатон з кібербезпеки',
    online: true,
    status: 'PUBLISHED',
    startDate: new Date(now.getTime() + 1 * 86400000),
    endDate: new Date(now.getTime() + 9 * 86400000),
  }).returning();
  createdHackathons['CyberHack 2025'] = h2;
  await db.insert(hackathonTagRelations).values({ hackathonId: h2.id, tagId: tags['cybersecurity'].id });

  // Hackathon 3
  const [h3] = await db.insert(hackathons).values({
    title: 'EduTech Sprint',
    online: true,
    status: 'ARCHIVED',
    startDate: new Date(now.getTime() - 30 * 86400000),
    endDate: new Date(now.getTime() - 21 * 86400000),
  }).returning();
  createdHackathons['EduTech Sprint'] = h3;
  await db.insert(hackathonTagRelations).values([
    { hackathonId: h3.id, tagId: tags['edtech'].id },
    { hackathonId: h3.id, tagId: tags['healthtech'].id }
  ]);

  return createdHackathons;
}

async function seedTracksAndCriteria(hackathons: any) {
  const now = new Date();

  const h1 = hackathons['IT-Fest 2025'];
  await db.insert(stages).values([
    { hackathonId: h1.id, name: 'Реєстрація', type: 'REGISTRATION', startDate: new Date(now.getTime() - 7 * 86400000), endDate: new Date(now.getTime() - 2 * 86400000), orderIndex: 1 },
    { hackathonId: h1.id, name: 'Хакінг',     type: 'HACKING',      startDate: new Date(now.getTime() - 2 * 86400000), endDate: new Date(now.getTime() + 1 * 86400000), orderIndex: 2 },
    { hackathonId: h1.id, name: 'Судочинство',type: 'JUDGING',       startDate: new Date(now.getTime() + 1 * 86400000), endDate: new Date(now.getTime() + 2 * 86400000), orderIndex: 3 },
    { hackathonId: h1.id, name: 'Завершено',  type: 'FINISHED',      startDate: new Date(now.getTime() + 2 * 86400000), endDate: new Date(now.getTime() + 3 * 86400000), orderIndex: 4 },
  ]);

  const [t1w, t1a, t1m] = await db.insert(tracks).values([
    { hackathonId: h1.id, name: 'Web Development', description: 'Веб застосунки та сервіси' },
    { hackathonId: h1.id, name: 'AI/ML', description: 'Штучний інтелект та машинне навчання' },
    { hackathonId: h1.id, name: 'Mobile', description: 'iOS та Android застосунки' },
  ]).returning();
  h1.tracks = { 'Web Development': t1w, 'AI/ML': t1a, 'Mobile': t1m };

  await db.insert(criteria).values([
    { trackId: t1w.id, name: 'Технічна реалізація', weight: '0.35', maxScore: '10' },
    { trackId: t1w.id, name: 'Дизайн та UX', weight: '0.25', maxScore: '10' },
    { trackId: t1w.id, name: 'Інноваційність', weight: '0.25', maxScore: '10' },
    { trackId: t1w.id, name: 'Презентація', weight: '0.15', maxScore: '10' },

    { trackId: t1a.id, name: 'Якість моделі', weight: '0.40', maxScore: '10' },
    { trackId: t1a.id, name: 'Практичність', weight: '0.35', maxScore: '10' },
    { trackId: t1a.id, name: 'Презентація', weight: '0.25', maxScore: '10' },

    { trackId: t1m.id, name: 'UX/UI дизайн', weight: '0.35', maxScore: '10' },
    { trackId: t1m.id, name: 'Технічна якість', weight: '0.40', maxScore: '10' },
    { trackId: t1m.id, name: 'Ідея та інновація', weight: '0.25', maxScore: '10' },
  ]);

  const h2 = hackathons['CyberHack 2025'];
  await db.insert(stages).values([
    { hackathonId: h2.id, name: 'Реєстрація', type: 'REGISTRATION', startDate: new Date(now.getTime() + 1 * 86400000), endDate: new Date(now.getTime() + 5 * 86400000), orderIndex: 1 },
    { hackathonId: h2.id, name: 'Хакінг',     type: 'HACKING',      startDate: new Date(now.getTime() + 5 * 86400000), endDate: new Date(now.getTime() + 7 * 86400000), orderIndex: 2 },
    { hackathonId: h2.id, name: 'Судочинство',type: 'JUDGING',       startDate: new Date(now.getTime() + 7 * 86400000), endDate: new Date(now.getTime() + 8 * 86400000), orderIndex: 3 },
    { hackathonId: h2.id, name: 'Завершено',  type: 'FINISHED',      startDate: new Date(now.getTime() + 8 * 86400000), endDate: new Date(now.getTime() + 9 * 86400000), orderIndex: 4 },
  ]);

  const [t2c] = await db.insert(tracks).values([
    { hackathonId: h2.id, name: 'Cybersecurity', description: 'Захист систем та пентестинг' },
  ]).returning();
  h2.tracks = { 'Cybersecurity': t2c };

  const h3 = hackathons['EduTech Sprint'];
  await db.insert(stages).values([
    { hackathonId: h3.id, name: 'Реєстрація', type: 'REGISTRATION', startDate: new Date(now.getTime() - 30 * 86400000), endDate: new Date(now.getTime() - 25 * 86400000), orderIndex: 1 },
    { hackathonId: h3.id, name: 'Хакінг',     type: 'HACKING',      startDate: new Date(now.getTime() - 25 * 86400000), endDate: new Date(now.getTime() - 23 * 86400000), orderIndex: 2 },
    { hackathonId: h3.id, name: 'Судочинство',type: 'JUDGING',       startDate: new Date(now.getTime() - 23 * 86400000), endDate: new Date(now.getTime() - 22 * 86400000), orderIndex: 3 },
    { hackathonId: h3.id, name: 'Завершено',  type: 'FINISHED',      startDate: new Date(now.getTime() - 22 * 86400000), endDate: new Date(now.getTime() - 21 * 86400000), orderIndex: 4 },
  ]);

  const [t3e, t3h] = await db.insert(tracks).values([
    { hackathonId: h3.id, name: 'EdTech', description: 'Освітні технології' },
    { hackathonId: h3.id, name: 'HealthTech', description: 'Медичні технології' },
  ]).returning();
  h3.tracks = { 'EdTech': t3e, 'HealthTech': t3h };
}

async function seedTeams(hackathons: any, users: any) {
  const h1 = hackathons['IT-Fest 2025'];
  const h3 = hackathons['EduTech Sprint'];
  const createdTeams: any = {};

  const h1HackingStage = await db.query.stages.findFirst({ where: (s, { eq, and }) => and(eq(s.hackathonId, h1.id), eq(s.name, 'HACKING')) });

  // Team 1
  const [team1] = await db.insert(teams).values({ hackathonId: h1.id, name: 'ByteForce', trackId: h1.tracks['Web Development'].id }).returning();
  await db.insert(teamMembers).values([
    { teamId: team1.id, userId: users.user1.id, role: 'captain' },
    { teamId: team1.id, userId: users.user2.id, role: 'participant' },
    { teamId: team1.id, userId: users.user4.id, role: 'participant' },
  ]);
  await db.insert(teamApprovals).values({ teamId: team1.id, status: 'APPROVED' });
  await db.insert(teamStage).values({ teamId: team1.id, stageId: h1HackingStage!.id });
  createdTeams['ByteForce'] = team1;

  // Team 2
  const [team2] = await db.insert(teams).values({ hackathonId: h1.id, name: 'NeuralNinjas', trackId: h1.tracks['AI/ML'].id }).returning();
  await db.insert(teamMembers).values([
    { teamId: team2.id, userId: users.user3.id, role: 'captain' },
    { teamId: team2.id, userId: users.user7.id, role: 'participant' },
  ]);
  await db.insert(teamApprovals).values({ teamId: team2.id, status: 'APPROVED' });
  await db.insert(teamStage).values({ teamId: team2.id, stageId: h1HackingStage!.id });
  createdTeams['NeuralNinjas'] = team2;

  // Team 3
  const [team3] = await db.insert(teams).values({ hackathonId: h1.id, name: 'MobileFirst', trackId: h1.tracks['Mobile'].id }).returning();
  await db.insert(teamMembers).values([
    { teamId: team3.id, userId: users.user5.id, role: 'captain' },
    { teamId: team3.id, userId: users.user6.id, role: 'participant' },
  ]);
  await db.insert(teamApprovals).values({ teamId: team3.id, status: 'APPROVED' });
  await db.insert(teamStage).values({ teamId: team3.id, stageId: h1HackingStage!.id });
  createdTeams['MobileFirst'] = team3;

  // Team 4
  const [team4] = await db.insert(teams).values({ hackathonId: h1.id, name: 'CodeRebels', trackId: h1.tracks['Web Development'].id }).returning();
  await db.insert(teamMembers).values([
    { teamId: team4.id, userId: users.user8.id, role: 'captain' },
    { teamId: team4.id, userId: users.user9.id, role: 'participant' },
  ]);
  await db.insert(teamApprovals).values({ teamId: team4.id, status: 'PENDING' });
  createdTeams['CodeRebels'] = team4;

  // Team 5
  const [team5] = await db.insert(teams).values({ hackathonId: h1.id, name: 'AIVision', trackId: h1.tracks['AI/ML'].id }).returning();
  await db.insert(teamMembers).values([
    { teamId: team5.id, userId: users.user10.id, role: 'captain' },
  ]);
  await db.insert(teamApprovals).values({ teamId: team5.id, status: 'REJECTED', comment: 'Команда не відповідає вимогам треку' });
  createdTeams['AIVision'] = team5;

  // EduTech Sprint Teams
  const h3FinishedStage = await db.query.stages.findFirst({ where: (s, { eq, and }) => and(eq(s.hackathonId, h3.id), eq(s.name, 'FINISHED')) });

  const [team6] = await db.insert(teams).values({ hackathonId: h3.id, name: 'LearnTech', trackId: h3.tracks['EdTech'].id }).returning();
  await db.insert(teamMembers).values([{ teamId: team6.id, userId: users.user1.id, role: 'captain' }]);
  await db.insert(teamApprovals).values({ teamId: team6.id, status: 'APPROVED' });
  await db.insert(teamStage).values({ teamId: team6.id, stageId: h3FinishedStage!.id });
  createdTeams['LearnTech'] = team6;

  const [team7] = await db.insert(teams).values({ hackathonId: h3.id, name: 'EduInnovators', trackId: h3.tracks['EdTech'].id }).returning();
  await db.insert(teamMembers).values([{ teamId: team7.id, userId: users.user2.id, role: 'captain' }]);
  await db.insert(teamApprovals).values({ teamId: team7.id, status: 'APPROVED' });
  await db.insert(teamStage).values({ teamId: team7.id, stageId: h3FinishedStage!.id });
  createdTeams['EduInnovators'] = team7;

  return createdTeams;
}

async function seedProjects(teams: any) {
  const now = new Date();

  // Project 1
  const [p1] = await db.insert(projects).values({
    teamId: teams['ByteForce'].id,
    stageId: (await db.query.teamStage.findFirst({ where: (s, { eq }) => eq(s.teamId, teams['ByteForce'].id) }))!.stageId,
    status: 'SUBMITTED',
    submittedAt: new Date(now.getTime() - 6 * 3600000),
  }).returning();

  const [typeRepo] = await db.insert(schema.projectResourceTypes).values({ name: 'repository', description: 'Репозиторій з кодом' }).onConflictDoNothing().returning();
  const [typeDemo] = await db.insert(schema.projectResourceTypes).values({ name: 'demo', description: 'Посилання на демо' }).onConflictDoNothing().returning();
  const [typePres] = await db.insert(schema.projectResourceTypes).values({ name: 'presentation', description: 'Презентація або слайди' }).onConflictDoNothing().returning();
  await db.insert(schema.projectResourceTypes).values({ name: 'video', description: 'Відео демонстрація' }).onConflictDoNothing();
  await db.insert(schema.projectResourceTypes).values({ name: 'documentation', description: 'Документація' }).onConflictDoNothing();
  await db.insert(schema.projectResourceTypes).values({ name: 'other', description: 'Інше' }).onConflictDoNothing();

  await db.insert(projectResources).values([
    { projectId: p1.id, projectTypeId: typeRepo.id, url: 'https://github.com/byteforce/ecotrack' },
    { projectId: p1.id, projectTypeId: typeDemo.id, url: 'https://ecotrack.demo.com' },
    { projectId: p1.id, projectTypeId: typePres.id, url: 'https://slides.com/byteforce' },
  ]);

  // Project 2
  const [p2] = await db.insert(projects).values({
    teamId: teams['NeuralNinjas'].id,
    stageId: (await db.query.teamStage.findFirst({ where: (s, { eq }) => eq(s.teamId, teams['NeuralNinjas'].id) }))!.stageId,
    status: 'DRAFT',
  }).returning();
  await db.insert(projectResources).values([{ projectId: p2.id, projectTypeId: typeRepo.id, url: 'https://github.com/neuralnin/medai' }]);

  // Project 3
  await db.insert(projects).values({
    teamId: teams['MobileFirst'].id,
    stageId: (await db.query.teamStage.findFirst({ where: (s, { eq }) => eq(s.teamId, teams['MobileFirst'].id) }))!.stageId,
    status: 'SUBMITTED',
    submittedAt: new Date(now.getTime() - 3 * 3600000),
  });

  // EduTech Sprint Projects
  await db.insert(projects).values({
    teamId: teams['LearnTech'].id,
    stageId: (await db.query.teamStage.findFirst({ where: (s, { eq }) => eq(s.teamId, teams['LearnTech'].id) }))!.stageId,
    status: 'SUBMITTED',
  });
  await db.insert(projects).values({
    teamId: teams['EduInnovators'].id,
    stageId: (await db.query.teamStage.findFirst({ where: (s, { eq }) => eq(s.teamId, teams['EduInnovators'].id) }))!.stageId,
    status: 'SUBMITTED',
  });
}

async function seedMentorAvailabilities(hackathons: any, users: any, teams: any) {
  const h1 = hackathons['IT-Fest 2025'];
  const now = new Date();

  // Mentor 1 (Web Dev)
  const m1Start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0, 0);
  const m1End = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 13, 0, 0);
  const [avail1] = await db.insert(mentorAvailabilities).values({
    mentorId: users.mentor1.id,
    hackathonId: h1.id,
    trackId: h1.tracks['Web Development'].id,
    startDatetime: m1Start,
    endDatetime: m1End,
    slotDuration: 30,
  }).returning();

  await db.insert(mentorRequests).values([
    { mentorAvailabilityId: avail1.id, teamId: teams['ByteForce'].id, startDatetime: m1Start, durationMinute: 30, status: 'accepted', meetingLink: 'https://meet.google.com/abc-defg-hij' },
    { mentorAvailabilityId: avail1.id, teamId: teams['MobileFirst'].id, startDatetime: new Date(m1Start.getTime() + 30 * 60000), durationMinute: 30, status: 'completed' }
  ]);

  // Mentor 2 (AI/ML)
  const m2Start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0, 0);
  const m2End = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 0, 0);
  const [avail2] = await db.insert(mentorAvailabilities).values({
    mentorId: users.mentor2.id,
    hackathonId: h1.id,
    trackId: h1.tracks['AI/ML'].id,
    startDatetime: m2Start,
    endDatetime: m2End,
    slotDuration: 30,
  }).returning();

  await db.insert(mentorRequests).values([
    { mentorAvailabilityId: avail2.id, teamId: teams['NeuralNinjas'].id, startDatetime: m2Start, durationMinute: 30, status: 'pending', message: 'Hello, we need help with AI model deployment.' }
  ]);

  // Mentor 3 (All tracks)
  const m3Start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0);
  const m3End = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 11, 0, 0);
  await db.insert(mentorAvailabilities).values({
    mentorId: users.mentor3.id,
    hackathonId: h1.id,
    startDatetime: m3Start,
    endDatetime: m3End,
    slotDuration: 30,
  });
}

async function seedJudgeAssignments(hackathons: any, users: any) {
  const h1 = hackathons['IT-Fest 2025'];

  await db.insert(judgeTrack).values([
    // Web Dev
    { hackathonId: h1.id, userId: users.judge1.id, trackId: h1.tracks['Web Development'].id, isHeadJudge: true },
    { hackathonId: h1.id, userId: users.judge2.id, trackId: h1.tracks['Web Development'].id, isHeadJudge: false },
    // AI/ML
    { hackathonId: h1.id, userId: users.judge2.id, trackId: h1.tracks['AI/ML'].id, isHeadJudge: false },
    { hackathonId: h1.id, userId: users.judge3.id, trackId: h1.tracks['AI/ML'].id, isHeadJudge: true },
    // Mobile
    { hackathonId: h1.id, userId: users.judge1.id, trackId: h1.tracks['Mobile'].id, isHeadJudge: false },
    { hackathonId: h1.id, userId: users.judge3.id, trackId: h1.tracks['Mobile'].id, isHeadJudge: false },
  ]);
}

async function seedScores(hackathons: any, users: any) {
  const h3 = hackathons['EduTech Sprint'];
  const t1 = await db.query.teams.findFirst({ where: (t, { eq }) => eq(t.name, 'LearnTech') });
  const t2 = await db.query.teams.findFirst({ where: (t, { eq }) => eq(t.name, 'EduInnovators') });
  const projLearnTech = await db.query.projects.findFirst({ where: (p, { eq }) => eq(p.teamId, t1!.id) });
  const projEduInnovators = await db.query.projects.findFirst({ where: (p, { eq }) => eq(p.teamId, t2!.id) });

  const criteriaEdTech = await db.query.criteria.findMany({ where: (c, { eq }) => eq(c.trackId, h3.tracks['EdTech'].id) });

  if (projLearnTech && projEduInnovators && criteriaEdTech.length > 0) {
    // We didn't seed criteria for EdTech above, let's just create one criteria for it if it doesn't exist
    let c = criteriaEdTech[0];
    if (!c) {
      const [newC] = await db.insert(criteria).values({ trackId: h3.tracks['EdTech'].id, name: 'General', weight: '1.0', maxScore: '10' }).returning();
      c = newC;
    }

    await db.insert(scores).values([
      // Judge 1 (lenient)
      { judgeId: users.judge1.id, projectId: projLearnTech.id, criteriaId: c.id, assessment: '9.0', comment: 'Great job!' },
      { judgeId: users.judge1.id, projectId: projEduInnovators.id, criteriaId: c.id, assessment: '8.0' },
      // Judge 2 (strict)
      { judgeId: users.judge2.id, projectId: projLearnTech.id, criteriaId: c.id, assessment: '7.0', comment: 'Good, but needs work.' },
      { judgeId: users.judge2.id, projectId: projEduInnovators.id, criteriaId: c.id, assessment: '6.0' },
    ]);
  }
}

async function seedConflicts(users: any, teams: any) {
  if (teams['LearnTech']) {
    await db.insert(judgeConflicts).values({
      judgeId: users.judge1.id,
      teamId: teams['LearnTech'].id,
      reason: 'Був ментором під час підготовки'
    });
  }
}

async function seed() {
  console.log('🌱 Starting seed...');

  if (process.env.SEED_CLEAN === 'true') {
    console.log('🧹 Cleaning existing data...');
    await cleanDatabase();
  }

  console.log('👤 Seeding users...');
  const users = await seedUsers();

  console.log('🏷️  Seeding tags...');
  const tags = await seedTags();

  console.log('🏆 Seeding hackathons...');
  const hackathons = await seedHackathons(tags);

  console.log('🎯 Seeding tracks & criteria...');
  await seedTracksAndCriteria(hackathons);

  console.log('👥 Seeding teams & members...');
  const teams = await seedTeams(hackathons, users);

  console.log('📁 Seeding projects...');
  await seedProjects(teams);

  console.log('🧑🏫 Seeding mentor availabilities...');
  await seedMentorAvailabilities(hackathons, users, teams);

  console.log('⚖️  Seeding judge assignments...');
  await seedJudgeAssignments(hackathons, users);

  console.log('⭐ Seeding scores...');
  await seedScores(hackathons, users);

  console.log('⚠️  Seeding conflicts...');
  await seedConflicts(users, teams);

  console.log('🏅 Seeding awards...');
  await seedAwards(hackathons, teams);

  console.log('✅ Seed complete!');
  console.log('');
  console.log('Test accounts (password: Password123!):');
  console.log('  Admin:    admin@hackflow.com');
  console.log('  Judge:    judge1@hackflow.com');
  console.log('  Mentor:   mentor1@hackflow.com');
  console.log('  User:     user1@hackflow.com');

  process.exit(0);
}

async function seedAwards(hackathons: any, teams: any) {
  const h3 = hackathons['EduTech Sprint'];
  if (!h3) return;

  // Create awards for EduTech Sprint
  const [award1] = await db.insert(schema.awards).values({
    hackathonId: h3.id, name: '🥇 Гран-прі EdTech', place: 1,
    description: 'Найкращий проєкт у галузі освітніх технологій',
  }).returning();

  const [award2] = await db.insert(schema.awards).values({
    hackathonId: h3.id, name: '🥈 2 місце EdTech', place: 2,
    description: 'Друге місце серед освітніх проєктів',
  }).returning();

  const [award3] = await db.insert(schema.awards).values({
    hackathonId: h3.id, name: '🥉 3 місце HealthTech', place: 3,
    description: 'Найкращий проєкт у галузі медичних технологій',
  }).returning();

  // Assign awards to top teams from EduTech Sprint
  const teamLearnify = teams['LearnTech'];
  const teamHealthBot = teams['EduInnovators'];

  if (teamLearnify && award1) {
    await db.insert(schema.teamAwards).values({ teamId: teamLearnify.id, awardId: award1.id }).onConflictDoNothing();
  }
  if (teamHealthBot && award2) {
    await db.insert(schema.teamAwards).values({ teamId: teamHealthBot.id, awardId: award2.id }).onConflictDoNothing();
  }
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
