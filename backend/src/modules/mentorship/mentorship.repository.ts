import type { Database } from '../../config/database';
import { mentorAvailabilities, mentorSlots } from '../../drizzle/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import type { CreateAvailabilityDto, BookSlotDto } from './mentorship.schema';

export class MentorshipRepository {
  constructor(private readonly db: Database) {}

  /** Find all availabilities for a specific mentor, with optional hackathonId filter. */
  async findAvailabilitiesByMentor(mentorId: string, hackathonId?: string) {
    if (hackathonId) {
      return this.db
        .select()
        .from(mentorAvailabilities)
        .where(
          and(
            eq(mentorAvailabilities.mentorId, mentorId),
            eq(mentorAvailabilities.hackathonId, hackathonId),
          ),
        );
    }
    return this.db
      .select()
      .from(mentorAvailabilities)
      .where(eq(mentorAvailabilities.mentorId, mentorId));
  }

  /** Find all availabilities across all mentors, with optional hackathonId filter. */
  async findAllAvailabilities(hackathonId?: string) {
    if (hackathonId) {
      return this.db
        .select()
        .from(mentorAvailabilities)
        .where(eq(mentorAvailabilities.hackathonId, hackathonId));
    }
    return this.db.select().from(mentorAvailabilities);
  }

  async findAvailabilityById(id: string) {
    const [row] = await this.db
      .select()
      .from(mentorAvailabilities)
      .where(eq(mentorAvailabilities.id, id))
      .limit(1);
    return row ?? null;
  }

  async createAvailability(mentorId: string, data: CreateAvailabilityDto) {
    const [row] = await this.db
      .insert(mentorAvailabilities)
      .values({
        mentorId,
        hackathonId: data.hackathonId ?? null,
        trackId: data.trackId,
        startDatetime: new Date(data.startDatetime),
        endDatetime: new Date(data.endDatetime),
      })
      .returning();
    return row;
  }

  async deleteAvailability(id: string) {
    await this.db.delete(mentorAvailabilities).where(eq(mentorAvailabilities.id, id));
  }

  // ── Slots ────────────────────────────────────────────────
  async findSlotsByAvailability(mentorAvailabilityId: string) {
    return this.db
      .select()
      .from(mentorSlots)
      .where(eq(mentorSlots.mentorAvailabilityId, mentorAvailabilityId));
  }

  async findSlotById(id: string) {
    const [row] = await this.db
      .select()
      .from(mentorSlots)
      .where(eq(mentorSlots.id, id))
      .limit(1);
    return row ?? null;
  }

  async findOverlappingSlots(mentorAvailabilityId: string, start: Date, end: Date) {
    return this.db
      .select()
      .from(mentorSlots)
      .where(
        and(
          eq(mentorSlots.mentorAvailabilityId, mentorAvailabilityId),
          lte(mentorSlots.startDatetime, end),
          gte(mentorSlots.startDatetime, start),
        ),
      );
  }

  async createSlot(data: BookSlotDto) {
    const [row] = await this.db
      .insert(mentorSlots)
      .values({
        mentorAvailabilityId: data.mentorAvailabilityId,
        teamId: data.teamId,
        startDatetime: new Date(data.startDatetime),
        durationMinute: data.durationMinute,
        meetingLink: data.meetingLink,
      })
      .returning();
    return row;
  }

  async updateSlotStatus(id: string, status: 'booked' | 'completed' | 'cancelled') {
    const [row] = await this.db
      .update(mentorSlots)
      .set({ status })
      .where(eq(mentorSlots.id, id))
      .returning();
    return row ?? null;
  }
}
