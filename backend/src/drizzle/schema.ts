import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  pgEnum,
  decimal,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ── Enums ────────────────────────────────────────────────────

export const tokenTypeEnum = pgEnum('token_type', [
  'EMAIL_CONFIRM',
  'PASSWORD_RESET',
  'CHANGE_EMAIL',
  'TWO_FACTOR',
  'GITHUB',
  'REFRESH',
]);

export const socialTypeEnum = pgEnum('social_type', ['discord', 'telegram', 'viber', 'github']);

export const roleNameEnum = pgEnum('role_name', ['admin', 'judge', 'mentor', 'participant']);

export const teamMemberRoleEnum = pgEnum('team_member_role', ['captain', 'participant']);

export const approvalStatusEnum = pgEnum('approval_status', [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'DISQUALIFIED',
]);

export const projectStatusEnum = pgEnum('project_status', [
  'DRAFT',
  'SUBMITTED',
  'REVIEWED',
  'APPROVED',
  'REJECTED',
]);

export const mentorAvailabilityStatusEnum = pgEnum('mentor_availability_status', [
  'available',
  'blocked',
]);

export const mentorSlotStatusEnum = pgEnum('mentor_slot_status', [
  'booked',
  'completed',
  'cancelled',
]);

// ── Users ─────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  avatarUrl: text('avatar_url'),
  description: text('description'),
  // ── Matchmaking ──────────────────────────────────────
  isLookingForTeam: boolean('is_looking_for_team').default(false).notNull(),
  skills: jsonb('skills').$type<string[]>().default([]),
  // ── Soft delete ───────────────────────────────────────
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const userTokens = pgTable('user_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  type: tokenTypeEnum('type').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userSocials = pgTable('user_socials', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  typeSocial: socialTypeEnum('type_social').notNull(),
  url: text('url').notNull(),
});

// ── Roles ─────────────────────────────────────────────────────

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: roleNameEnum('name').notNull().unique(),
});

export const userRoles = pgTable('user_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade' }),
  hackathonId: uuid('hackathon_id').references(() => hackathons.id, { onDelete: 'set null' }),
});

// ── Student Context ───────────────────────────────────────────

export const specialties = pgTable('specialties', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
});

export const studentGroups = pgTable('student_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  specialtiesId: uuid('specialties_id')
    .notNull()
    .references(() => specialties.id),
});

export const studentInformation = pgTable('student_information', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  groupId: uuid('group_id')
    .notNull()
    .references(() => studentGroups.id),
});

// ── Hackathons ────────────────────────────────────────────────

export const hackathons = pgTable('hackathons', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  subtitle: varchar('subtitle', { length: 500 }),
  description: text('description'),
  location: varchar('location', { length: 255 }),
  online: boolean('online').default(false).notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  minTeamSize: integer('min_team_size').default(1).notNull(),
  maxTeamSize: integer('max_team_size').default(5).notNull(),
  banner: text('banner'),
  rulesUrl: text('rules_url'),
  contactEmail: varchar('contact_email', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const stages = pgTable('stages', {
  id: uuid('id').primaryKey().defaultRandom(),
  hackathonId: uuid('hackathon_id')
    .notNull()
    .references(() => hackathons.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  orderIndex: integer('order_index').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
});

export const tracks = pgTable('tracks', {
  id: uuid('id').primaryKey().defaultRandom(),
  hackathonId: uuid('hackathon_id')
    .notNull()
    .references(() => hackathons.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
});

// ── Awards ────────────────────────────────────────────────────

export const awards = pgTable('awards', {
  id: uuid('id').primaryKey().defaultRandom(),
  hackathonId: uuid('hackathon_id')
    .notNull()
    .references(() => hackathons.id, { onDelete: 'cascade' }),
  certificate: text('certificate'),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  place: integer('place').notNull(),
});

export const physicalGifts = pgTable('physical_gifts', {
  id: uuid('id').primaryKey().defaultRandom(),
  awardId: uuid('award_id')
    .notNull()
    .references(() => awards.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  image: text('image'),
});

export const teamAwards = pgTable('team_awards', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  awardId: uuid('award_id')
    .notNull()
    .references(() => awards.id, { onDelete: 'cascade' }),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
});

export const teamStage = pgTable('team_stage', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  stageId: uuid('stage_id')
    .notNull()
    .references(() => stages.id, { onDelete: 'cascade' }),
  enteredAt: timestamp('entered_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Teams ─────────────────────────────────────────────────────

export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  logo: text('logo'),
  trackId: uuid('track_id').references(() => tracks.id, { onDelete: 'set null' }),
  hackathonId: uuid('hackathon_id')
    .notNull()
    .references(() => hackathons.id, { onDelete: 'cascade' }),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const teamApprovals = pgTable('team_approvals', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  status: approvalStatusEnum('status').default('PENDING').notNull(),
  approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),
  approvedAt: timestamp('approved_at'),
  comment: text('comment'),
});

export const teamMembers = pgTable('team_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: teamMemberRoleEnum('role').default('participant').notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

export const teamInvites = pgTable('team_invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  maxUses: integer('max_uses').default(10).notNull(),
  usesCount: integer('uses_count').default(0).notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Projects ──────────────────────────────────────────────────

export const projectResourceTypes = pgTable('project_resource_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
});

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  stageId: uuid('stage_id')
    .notNull()
    .references(() => stages.id, { onDelete: 'cascade' }),
  status: projectStatusEnum('status').default('DRAFT').notNull(),
  submittedAt: timestamp('submitted_at'),
  reviewedAt: timestamp('reviewed_at'),
  comment: text('comment'),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const projectResources = pgTable('project_resources', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  projectTypeId: uuid('project_type_id')
    .notNull()
    .references(() => projectResourceTypes.id),
  url: text('url').notNull(),
  description: text('description'),
});

// ── Mentorship ────────────────────────────────────────────────

export const mentorAvailabilities = pgTable('mentor_availabilities', {
  id: uuid('id').primaryKey().defaultRandom(),
  mentorId: uuid('mentor_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  hackathonId: uuid('hackathon_id').references(() => hackathons.id, { onDelete: 'set null' }),
  trackId: uuid('track_id').references(() => tracks.id, { onDelete: 'set null' }),
  startDatetime: timestamp('start_datetime').notNull(),
  endDatetime: timestamp('end_datetime').notNull(),
  status: mentorAvailabilityStatusEnum('status').default('available').notNull(),
});

export const mentorSlots = pgTable('mentor_slots', {
  id: uuid('id').primaryKey().defaultRandom(),
  mentorAvailabilityId: uuid('mentor_availability_id')
    .notNull()
    .references(() => mentorAvailabilities.id, { onDelete: 'cascade' }),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  startDatetime: timestamp('start_datetime').notNull(),
  durationMinute: integer('duration_minute').notNull(),
  status: mentorSlotStatusEnum('status').default('booked').notNull(),
  meetingLink: text('meeting_link'),
});

// ── Judging ───────────────────────────────────────────────────

export const criteria = pgTable('criteria', {
  id: uuid('id').primaryKey().defaultRandom(),
  trackId: uuid('track_id')
    .notNull()
    .references(() => tracks.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  weight: decimal('weight', { precision: 5, scale: 2 }).notNull(),
  maxScore: decimal('max_score', { precision: 5, scale: 2 }).notNull(),
});

export const scores = pgTable('scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  judgeId: uuid('judge_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  criteriaId: uuid('criteria_id')
    .notNull()
    .references(() => criteria.id, { onDelete: 'cascade' }),
  assessment: decimal('assessment', { precision: 5, scale: 2 }).notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const judgeConflicts = pgTable('judge_conflicts', {
  id: uuid('id').primaryKey().defaultRandom(),
  judgeId: uuid('judge_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  reason: text('reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Audit Log ─────────────────────────────────────────────────

export const userActionLogs = pgTable('user_action_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  action: varchar('action', { length: 100 }).notNull(),
  entity: varchar('entity', { length: 100 }).notNull(),
  entityId: uuid('entity_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Relations ────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  tokens: many(userTokens),
  socials: many(userSocials),
  roles: many(userRoles),
  teamMemberships: many(teamMembers),
  scores: many(scores),
  conflicts: many(judgeConflicts),
  mentorAvailabilities: many(mentorAvailabilities),
  actionLogs: many(userActionLogs),
}));

export const hackathonsRelations = relations(hackathons, ({ many }) => ({
  stages: many(stages),
  tracks: many(tracks),
  teams: many(teams),
  awards: many(awards),
  userRoles: many(userRoles),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  hackathon: one(hackathons, { fields: [teams.hackathonId], references: [hackathons.id] }),
  track: one(tracks, { fields: [teams.trackId], references: [tracks.id] }),
  members: many(teamMembers),
  invites: many(teamInvites),
  approvals: many(teamApprovals),
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  team: one(teams, { fields: [projects.teamId], references: [teams.id] }),
  stage: one(stages, { fields: [projects.stageId], references: [stages.id] }),
  resources: many(projectResources),
  scores: many(scores),
}));
