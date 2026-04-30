import type { HackathonsRepository, HackathonStatus } from './hackathons.repository';
import { BadRequestError, NotFoundError } from '../../common/errors/http-errors';
import type {
  CreateHackathonDto,
  UpdateHackathonDto,
  CreateTrackDto,
  CreateStageDto,
} from './hackathons.schema';
import type { HackathonTagsRepository } from '../hackathon-tags/hackathon-tags.repository';
import { getRedisClient } from '../../config/redis';
import { activeStageKey, ACTIVE_STAGE_CACHE_TTL } from '../../services/status-transition.service';
import { findActiveStageForHackathon } from '../../services/stage-utils';
import type { AuditLogRepository } from '../audit-log/audit-log.repository';

export class HackathonsService {
  constructor(
    private readonly repo: HackathonsRepository,
    private readonly tagsRepo?: HackathonTagsRepository,
    private readonly auditLog?: AuditLogRepository,
  ) {}

  async list(page: number, limit: number, status?: HackathonStatus, tagNames?: string[], publishStatus?: string, search?: string) {
    // Resolve tag names → hackathon IDs for AND-logic filtering
    let tagIds: string[] | undefined;
    if (tagNames && tagNames.length > 0 && this.tagsRepo) {
      tagIds = await this.tagsRepo.findHackathonsByTags(tagNames);
      // If tags are specified but no hackathon matched, return empty early
      if (tagIds.length === 0) {
        return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
      }
    }

    const { rows, total } = await this.repo.findAll(page, limit, status, tagIds, publishStatus, search);

    // Enrich with tags in a single batch query
    let enriched: Array<(typeof rows)[number] & { tags: Array<{ id: string; name: string }> }> = [];
    if (this.tagsRepo && rows.length > 0) {
      const tagsMap = await this.tagsRepo.findTagsForHackathons(rows.map((r) => r.id));
      enriched = rows.map((r) => ({ ...r, tags: tagsMap.get(r.id) ?? [] }));
    } else {
      enriched = rows.map((r) => ({ ...r, tags: [] }));
    }

    return {
      data: enriched,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id: string) {
    const h = await this.repo.findById(id);
    if (!h) throw new NotFoundError('Hackathon');

    // Enrich tags
    const tags = this.tagsRepo
      ? (await this.tagsRepo.findTagsForHackathons([id])).get(id) ?? []
      : [];

    // Enrich active stage from Redis cache, fallback to DB stages
    let activeStage: object | null = null;
    try {
      const redis = getRedisClient();
      const cached = await redis.get(activeStageKey(id));
      if (cached) {
        activeStage = JSON.parse(cached) as object;
      } else {
        const withStages = await this.repo.findWithStages(id);
        if (withStages?.stages?.length) {
          const stageSnapshots = withStages.stages.map((s) => ({
            id: s.id,
            name: s.name,
            startDate: s.startDate,
            endDate: s.endDate,
            orderIndex: s.orderIndex,
          }));
          activeStage = findActiveStageForHackathon(stageSnapshots, new Date());
          // Populate cache
          if (activeStage) {
            void redis
              .set(activeStageKey(id), JSON.stringify(activeStage), 'EX', ACTIVE_STAGE_CACHE_TTL)
              .catch(() => undefined);
          }
        }
      }
    } catch {
      // Redis unavailable — activeStage stays null
    }

    return { ...h, tags, activeStage };
  }

  async create(dto: CreateHackathonDto) {
    return this.repo.create(dto);
  }

  async update(id: string, dto: UpdateHackathonDto) {
    await this.getById(id);
    const updated = await this.repo.update(id, dto);
    if (!updated) throw new NotFoundError('Hackathon');
    return updated;
  }

  async remove(id: string) {
    await this.getById(id);
    await this.repo.remove(id);
  }

  async listTracks(hackathonId: string) {
    await this.getById(hackathonId);
    return this.repo.findTracks(hackathonId);
  }

  async createTrack(hackathonId: string, dto: CreateTrackDto) {
    await this.getById(hackathonId);
    return this.repo.createTrack(hackathonId, dto);
  }

  async deleteTrack(id: string) {
    await this.repo.deleteTrack(id);
  }

  async listStages(hackathonId: string) {
    await this.getById(hackathonId);
    return this.repo.findStages(hackathonId);
  }

  async createStage(hackathonId: string, dto: CreateStageDto) {
    await this.getById(hackathonId);
    return this.repo.createStage(hackathonId, dto);
  }

  async deleteStage(id: string) {
    await this.repo.deleteStage(id);
  }

  /**
   * Manual status override (admin only).
   * Validates:
   *  - PUBLISHED requires at least one stage defined
   *  - ARCHIVED is always allowed (can't go back from it via this endpoint)
   */
  async overrideStatus(
    hackathonId: string,
    newStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
    adminId: string,
  ) {
    const h = await this.repo.findById(hackathonId);
    if (!h) throw new NotFoundError('Hackathon');

    if (newStatus === 'PUBLISHED') {
      const stageCount = await this.repo.countStages(hackathonId);
      if (stageCount === 0) {
        throw new BadRequestError('Cannot publish hackathon with no stages defined');
      }
    }

    const updated = await this.repo.updateStatus(hackathonId, newStatus);

    // Invalidate active-stage Redis cache
    try {
      const redis = getRedisClient();
      await redis.del(activeStageKey(hackathonId));
    } catch { /* Redis unavailable — not critical */ }

    // Audit log
    this.auditLog
      ?.log(adminId, 'hackathon_status_override', 'hackathon', hackathonId)
      .catch(() => undefined);

    console.info(`[status-override] Admin ${adminId}: hackathon ${hackathonId} → ${newStatus}`);
    return updated;
  }
}
