import type { Database } from '../../config/database';
import { criteria, scores, judgeConflicts } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
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
}
