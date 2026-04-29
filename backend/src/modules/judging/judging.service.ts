import type { JudgingRepository } from './judging.repository';
import { ForbiddenError, NotFoundError } from '../../common/errors/http-errors';
import type { CreateCriteriaDto, SubmitScoreDto, ReportConflictDto } from './judging.schema';
import type { Redis } from 'ioredis';
import type { AuditLogRepository } from '../audit-log/audit-log.repository';

const LEADERBOARD_TTL_SECONDS = 60;

export interface LeaderboardEntry {
  rank: number;
  projectId: string;
  teamId: string;
  totalScore: number;
  normalizedScore: number;
}

export class JudgingService {
  constructor(
    private readonly repo: JudgingRepository,
    private readonly auditLog?: AuditLogRepository,
  ) {}

  // ── Criteria ─────────────────────────────────────────────
  async listCriteria(trackId: string) {
    return this.repo.findCriteriaByTrack(trackId);
  }

  async createCriteria(dto: CreateCriteriaDto) {
    return this.repo.createCriteria(dto);
  }

  async deleteCriteria(id: string) {
    await this.repo.deleteCriteria(id);
  }

  // ── Scores ───────────────────────────────────────────────
  async getScoresForProject(projectId: string) {
    return this.repo.findScoresByProject(projectId);
  }

  async submitScore(judgeId: string, dto: SubmitScoreDto) {
    const result = await this.repo.upsertScore(judgeId, dto);
    // Fire-and-forget audit log
    this.auditLog?.log(judgeId, 'submit_score', 'score', result.id).catch(() => undefined);
    return result;
  }

  // ── Conflicts ────────────────────────────────────────────
  async listConflicts(judgeId: string) {
    return this.repo.findConflictsByJudge(judgeId);
  }

  async reportConflict(judgeId: string, dto: ReportConflictDto) {
    const existing = await this.repo.hasConflict(judgeId, dto.teamId);
    if (existing) throw new ForbiddenError('Conflict already reported for this team');
    return this.repo.reportConflict(judgeId, dto);
  }

  // ── Normalization ─────────────────────────────────────────
  /**
   * Reduces judge bias using global-average normalization:
   *   adjusted = score * (global_avg / judge_avg)
   *
   * Judges who score consistently higher/lower are corrected
   * toward the global mean. Returns the original score if a
   * judge has only one submission (no meaningful avg to use).
   */
  normalizeScores(
    rawScores: Array<{ judgeId: string; assessment: string; projectId: string; criteriaId: string }>,
  ): Array<{ judgeId: string; projectId: string; criteriaId: string; normalized: number }> {
    if (rawScores.length === 0) return [];

    // Step 1: judge averages
    const judgeTotals = new Map<string, { sum: number; count: number }>();
    for (const s of rawScores) {
      const val = Number(s.assessment);
      const prev = judgeTotals.get(s.judgeId) ?? { sum: 0, count: 0 };
      judgeTotals.set(s.judgeId, { sum: prev.sum + val, count: prev.count + 1 });
    }

    const judgeAvgs = new Map<string, number>();
    for (const [judgeId, { sum, count }] of judgeTotals) {
      judgeAvgs.set(judgeId, sum / count);
    }

    // Step 2: global average
    const allVals = rawScores.map((s) => Number(s.assessment));
    const globalAvg = allVals.reduce((a, b) => a + b, 0) / allVals.length;

    // Step 3: apply adjustment
    return rawScores.map((s) => {
      const judgeAvg = judgeAvgs.get(s.judgeId) ?? globalAvg;
      const multiplier = judgeAvg === 0 ? 1 : globalAvg / judgeAvg;
      return {
        judgeId: s.judgeId,
        projectId: s.projectId,
        criteriaId: s.criteriaId,
        normalized: Number(s.assessment) * multiplier,
      };
    });
  }

  // ── Leaderboard ───────────────────────────────────────────
  /**
   * Returns ranked projects for a hackathon.
   * Applies:
   *   1. Per-judge bias normalization
   *   2. Criteria weight multiplication (weight / maxScore)
   *   3. Aggregation per project
   *   4. Redis caching (TTL = 60s)
   */
  async getLeaderboard(hackathonId: string, redis: Redis): Promise<LeaderboardEntry[]> {
    const cacheKey = `leaderboard:${hackathonId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as LeaderboardEntry[];

    const [hackProjects, criteriaList] = await Promise.all([
      this.repo.findProjectsByHackathon(hackathonId),
      this.repo.findCriteriaForHackathon(hackathonId),
    ]);

    if (hackProjects.length === 0) return [];

    const projectIds = hackProjects.map((p) => p.id);
    const rawScores = await this.repo.findAllScoresForHackathon(projectIds);

    // Build criteria lookup: id → { weight, maxScore }
    const criteriaMap = new Map(
      criteriaList.map((c) => [c.id, { weight: Number(c.weight), maxScore: Number(c.maxScore) }]),
    );

    // Normalize scores
    const normalized = this.normalizeScores(rawScores);

    // Aggregate weighted score per project
    const projectScores = new Map<string, number>();
    for (const p of hackProjects) {
      projectScores.set(p.id, 0);
    }

    for (const ns of normalized) {
      const crit = criteriaMap.get(ns.criteriaId);
      if (!crit) continue;
      const weightedScore = crit.maxScore > 0
        ? ns.normalized * (crit.weight / crit.maxScore)
        : ns.normalized;
      const prev = projectScores.get(ns.projectId) ?? 0;
      projectScores.set(ns.projectId, prev + weightedScore);
    }

    // Build leaderboard entries
    const projectMap = new Map(hackProjects.map((p) => [p.id, p]));
    const entries: LeaderboardEntry[] = Array.from(projectScores.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([projectId, totalScore], idx) => ({
        rank: idx + 1,
        projectId,
        teamId: projectMap.get(projectId)?.teamId ?? '',
        totalScore: Math.round(totalScore * 100) / 100,
        normalizedScore: Math.round(totalScore * 100) / 100,
      }));

    await redis.setex(cacheKey, LEADERBOARD_TTL_SECONDS, JSON.stringify(entries));
    return entries;
  }

  /** Admin: paginated view of all conflicts across all hackathons. */
  async listAllConflicts(opts: { hackathonId?: string; page: number; limit: number }) {
    return this.repo.findAllConflicts(opts);
  }
}

