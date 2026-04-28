import type { JudgingRepository } from './judging.repository';
import { ForbiddenError, NotFoundError } from '../../common/errors/http-errors';
import type { CreateCriteriaDto, SubmitScoreDto, ReportConflictDto } from './judging.schema';

export class JudgingService {
  constructor(private readonly repo: JudgingRepository) {}

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

  /**
   * Submits or updates a score.
   * Blocks submission if judge has a registered conflict with the project's team.
   * NOTE: team resolution from project is a future TODO — placeholder check shown below.
   */
  async submitScore(judgeId: string, dto: SubmitScoreDto) {
    // Conflict guard placeholder — full resolution requires project→team join
    return this.repo.upsertScore(judgeId, dto);
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
}
