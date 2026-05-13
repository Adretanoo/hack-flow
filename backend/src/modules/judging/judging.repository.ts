// Soft-delete filter: verified 2026-04-29
// findProjectsByHackathon excludes soft-deleted projects via isNull(projects.deletedAt).
import type { Database } from '../../config/database';
import { criteria, scores, judgeConflicts, projects, stages, tracks, users, teams, hackathons } from '../../drizzle/schema';
import { eq, and, inArray, sql, isNull } from 'drizzle-orm';
import type { CreateCriteriaDto, SubmitScoreDto, ReportConflictDto } from './judging.schema';

export class JudgingRepository {
  constructor(private readonly db: Database) {}

  // ── Criteria ─────────────────────────────────────────────
  async findCriteriaByTrack(trackId: string) {
    return this.db.select().from(criteria).where(eq(criteria.trackId, trackId));
  }

  async createCriteria(data: CreateCriteriaDto) {
    const [row] = await this.db
      .insert(criteria)
      .values({
        ...data,
        weight: String(data.weight),
        maxScore: String(data.maxScore),
      })
      .returning();
    return row;
  }

  async deleteCriteria(id: string) {
    await this.db.delete(criteria).where(eq(criteria.id, id));
  }

  async updateCriteria(id: string, data: Partial<CreateCriteriaDto>) {
    const values: any = { ...data };
    if (data.weight !== undefined) values.weight = String(data.weight);
    if (data.maxScore !== undefined) values.maxScore = String(data.maxScore);

    const [row] = await this.db
      .update(criteria)
      .set(values)
      .where(eq(criteria.id, id))
      .returning();
    return row;
  }

  // ── Scores ───────────────────────────────────────────────
  async findScoresByProject(projectId: string) {
    return this.db
      .select({
        id: scores.id,
        judgeId: scores.judgeId,
        projectId: scores.projectId,
        criteriaId: scores.criteriaId,
        assessment: scores.assessment,
        comment: scores.comment,
        updatedAt: scores.updatedAt,
        judge: {
          id: users.id,
          fullName: users.fullName,
          username: users.username,
        },
        criteria: {
          id: criteria.id,
          name: criteria.name,
        },
      })
      .from(scores)
      .innerJoin(users, eq(scores.judgeId, users.id))
      .innerJoin(criteria, eq(scores.criteriaId, criteria.id))
      .where(eq(scores.projectId, projectId));
  }

  async findScoresByJudge(judgeId: string) {
    return this.db.select().from(scores).where(eq(scores.judgeId, judgeId));
  }

  async findExistingScore(judgeId: string, projectId: string, criteriaId: string) {
    const [row] = await this.db
      .select()
      .from(scores)
      .where(
        and(
          eq(scores.judgeId, judgeId),
          eq(scores.projectId, projectId),
          eq(scores.criteriaId, criteriaId),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async upsertScore(judgeId: string, dto: SubmitScoreDto) {
    const existing = await this.findExistingScore(judgeId, dto.projectId, dto.criteriaId);
    if (existing) {
      const [row] = await this.db
        .update(scores)
        .set({ assessment: String(dto.assessment), comment: dto.comment, updatedAt: new Date() })
        .where(eq(scores.id, existing.id))
        .returning();
      return row;
    }
    const [row] = await this.db
      .insert(scores)
      .values({
        judgeId,
        projectId: dto.projectId,
        criteriaId: dto.criteriaId,
        assessment: String(dto.assessment),
        comment: dto.comment,
      })
      .returning();
    return row;
  }

  // ── Leaderboard — hackathon-scoped queries ────────────────

  /** All projects in a hackathon that are ready for judging (status = SUBMITTED or APPROVED/REJECTED after review) */
  async findProjectsByHackathon(hackathonId: string) {
    const hackathonStages = await this.db
      .select({ id: stages.id })
      .from(stages)
      .where(eq(stages.hackathonId, hackathonId));

    if (hackathonStages.length === 0) return [];
    const stageIds = hackathonStages.map((s) => s.id);

    // Only show projects that have been officially submitted — never drafts.
    // A team may have at most one non-deleted project per hackathon, but the
    // status guard ensures judges cannot score works-in-progress.
    return this.db
      .select({
        id: projects.id,
        teamId: projects.teamId,
        teamName: teams.name,
      })
      .from(projects)
      .innerJoin(teams, eq(projects.teamId, teams.id))
      .where(
        and(
          inArray(projects.stageId, stageIds),
          isNull(projects.deletedAt),
          inArray(projects.status, ['SUBMITTED', 'APPROVED', 'REJECTED']),
        ),
      );
  }

  /** Single project by ID — used by the ENFORCE_JUDGE_TRACK guard. */
  async findProjectById(projectId: string) {
    const [row] = await this.db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
      .limit(1);
    return row ?? null;
  }

  /** Resolve the track assigned to a team — used by the ENFORCE_JUDGE_TRACK guard. */
  async findTeamTrack(teamId: string) {
    const [row] = await this.db
      .select({ trackId: teams.trackId })
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);
    return row ?? null;
  }

  /** All scores for all projects in a hackathon */
  async findAllScoresForHackathon(projectIds: string[]) {
    if (projectIds.length === 0) return [];
    return this.db
      .select()
      .from(scores)
      .where(inArray(scores.projectId, projectIds));
  }

  /** All criteria for all tracks in a hackathon */
  async findCriteriaForHackathon(hackathonId: string) {
    const hackathonTracks = await this.db
      .select({ id: tracks.id })
      .from(tracks)
      .where(eq(tracks.hackathonId, hackathonId));

    if (hackathonTracks.length === 0) return [];
    const trackIds = hackathonTracks.map((t) => t.id);

    return this.db
      .select()
      .from(criteria)
      .where(inArray(criteria.trackId, trackIds));
  }

  // ── Conflicts ────────────────────────────────────────────
  async findConflictsByJudge(judgeId: string) {
    return this.db.select().from(judgeConflicts).where(eq(judgeConflicts.judgeId, judgeId));
  }

  async reportConflict(judgeId: string, dto: ReportConflictDto) {
    const [row] = await this.db
      .insert(judgeConflicts)
      .values({ judgeId, teamId: dto.teamId, reason: dto.reason })
      .returning();
    return row;
  }

  async hasConflict(judgeId: string, teamId: string) {
    const [row] = await this.db
      .select()
      .from(judgeConflicts)
      .where(and(eq(judgeConflicts.judgeId, judgeId), eq(judgeConflicts.teamId, teamId)))
      .limit(1);
    return !!row;
  }

  /**
   * Admin view: all conflicts across all hackathons, with judge + team info.
   * Supports optional hackathonId filter and pagination.
   */
  async findAllConflicts(opts: { hackathonId?: string; page: number; limit: number }) {
    const offset = (opts.page - 1) * opts.limit;

    // Build base query joining judge user info and team info
    const baseQuery = this.db
      .select({
        id: judgeConflicts.id,
        reason: judgeConflicts.reason,
        createdAt: judgeConflicts.createdAt,
        judge: {
          id: users.id,
          fullName: users.fullName,
          email: users.email,
        },
        team: {
          id: teams.id,
          name: teams.name,
          hackathonId: teams.hackathonId,
        },
      })
      .from(judgeConflicts)
      .innerJoin(users, eq(judgeConflicts.judgeId, users.id))
      .innerJoin(teams, eq(judgeConflicts.teamId, teams.id));

    const rows = opts.hackathonId
      ? await baseQuery
          .where(eq(teams.hackathonId, opts.hackathonId))
          .limit(opts.limit)
          .offset(offset)
      : await baseQuery
          .limit(opts.limit)
          .offset(offset);

    // Count total for pagination metadata
    const countQuery = this.db
      .select({ total: sql<number>`count(*)::int` })
      .from(judgeConflicts)
      .innerJoin(teams, eq(judgeConflicts.teamId, teams.id));

    const [{ total }] = opts.hackathonId
      ? await countQuery.where(eq(teams.hackathonId, opts.hackathonId))
      : await countQuery;

    return { data: rows, total, page: opts.page, limit: opts.limit };
  }
}

