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

  // ── Scores ───────────────────────────────────────────────
  async findScoresByProject(projectId: string) {
    return this.db.select().from(scores).where(eq(scores.projectId, projectId));
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

  /** All projects in a hackathon (via stage → hackathon join) */
  async findProjectsByHackathon(hackathonId: string) {
    const hackathonStages = await this.db
      .select({ id: stages.id })
      .from(stages)
      .where(eq(stages.hackathonId, hackathonId));

    if (hackathonStages.length === 0) return [];
    const stageIds = hackathonStages.map((s) => s.id);

    return this.db
      .select()
      .from(projects)
      .where(and(inArray(projects.stageId, stageIds), isNull(projects.deletedAt)));
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

