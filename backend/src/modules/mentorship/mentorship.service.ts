import type { MentorshipRepository } from './mentorship.repository';
import { getRedisClient } from '../../config/redis';
import { ConflictError, NotFoundError } from '../../common/errors/http-errors';
import type { CreateAvailabilityDto, BookSlotDto, UpdateSlotStatusDto } from './mentorship.schema';
import type { AuditLogRepository } from '../audit-log/audit-log.repository';

const LOCK_TTL_MS = 10_000; // 10 second Redis lock TTL

export class MentorshipService {
  constructor(
    private readonly repo: MentorshipRepository,
    private readonly auditLog?: AuditLogRepository,
  ) {}

  async listAvailabilities(mentorId: string, hackathonId?: string) {
    return this.repo.findAvailabilitiesByMentor(mentorId, hackathonId);
  }

  async listAllAvailabilities(hackathonId?: string) {
    return this.repo.findAllAvailabilities(hackathonId);
  }

  async createAvailability(mentorId: string, dto: CreateAvailabilityDto) {
    return this.repo.createAvailability(mentorId, dto);
  }

  async deleteAvailability(id: string) {
    await this.repo.deleteAvailability(id);
  }

  async getSlotsByAvailability(availabilityId: string) {
    return this.repo.findSlotsByAvailability(availabilityId);
  }

  /**
   * Books a mentor slot with a Redis distributed lock to prevent
   * concurrent double-bookings of the same time window.
   * Emits a book_mentor_slot audit event on success.
   */
  async bookSlot(dto: BookSlotDto, userId?: string): Promise<ReturnType<MentorshipRepository['createSlot']>> {
    const start = new Date(dto.startDatetime);
    const end = new Date(start.getTime() + dto.durationMinute * 60_000);
    const lockKey = `mentorship:lock:${dto.mentorAvailabilityId}:${start.toISOString()}`;

    const redis = getRedisClient();
    const acquired = await redis.set(lockKey, '1', 'PX', LOCK_TTL_MS, 'NX');

    if (!acquired) {
      throw new ConflictError('This slot is currently being booked — please try again in a moment');
    }

    try {
      const overlapping = await this.repo.findOverlappingSlots(
        dto.mentorAvailabilityId,
        start,
        end,
      );

      if (overlapping.length > 0) {
        throw new ConflictError('This time slot overlaps with an existing booking');
      }

      const slot = await this.repo.createSlot(dto);
      if (userId) {
        this.auditLog?.log(userId, 'book_mentor_slot', 'mentor_slot', slot.id).catch(() => undefined);
      }
      return slot;
    } finally {
      await redis.del(lockKey);
    }
  }

  async updateSlotStatus(id: string, dto: UpdateSlotStatusDto) {
    const slot = await this.repo.findSlotById(id);
    if (!slot) throw new NotFoundError('Slot');
    const updated = await this.repo.updateSlotStatus(id, dto.status);
    if (!updated) throw new NotFoundError('Slot');
    return updated;
  }
}

