import type { Database } from '../../config/database';
import { hackathons, stages, tracks } from '../../drizzle/schema';
import { eq, desc, count, lt, gt, and, lte, gte, isNull } from 'drizzle-orm';
import type { CreateHackathonDto, UpdateHackathonDto, CreateTrackDto, CreateStageDto } from './hackathons.schema';

export type HackathonStatus = 'upcoming' | 'active' | 'past';

export class HackathonsRepository {
  constructor(private readonly db: Database) {}

  async findAll(page: number, limit: number, status?: HackathonStatus) {
    const offset = (page - 1) * limit;
    const now = new Date();

    const statusFilter =
      status === 'upcoming'
        ? gt(hackathons.startDate, now)
        : status === 'active'
          ? and(lte(hackathons.startDate, now), gte(hackathons.endDate, now))
          : status === 'past'
            ? lt(hackathons.endDate, now)
            : undefined;

    const [rows, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(hackathons)
        .where(statusFilter)
        .orderBy(desc(hackathons.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(hackathons).where(statusFilter),
    ]);
    return { rows, total: Number(total) };
  }

  async findById(id: string) {
    const [row] = await this.db.select().from(hackathons).where(eq(hackathons.id, id)).limit(1);
    return row ?? null;
  }

  async create(data: CreateHackathonDto) {
    const [row] = await this.db
      .insert(hackathons)
      .values({
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      })
      .returning();
    return row;
  }

  async update(id: string, data: UpdateHackathonDto) {
    const values: Record<string, unknown> = { ...data, updatedAt: new Date() };
    if (data.startDate) values.startDate = new Date(data.startDate);
    if (data.endDate) values.endDate = new Date(data.endDate);
    const [row] = await this.db.update(hackathons).set(values).where(eq(hackathons.id, id)).returning();
    return row ?? null;
  }

  async remove(id: string) {
    await this.db.delete(hackathons).where(eq(hackathons.id, id));
  }

  // ── Tracks ──────────────────────────────────────────────
  async findTracks(hackathonId: string) {
    return this.db.select().from(tracks).where(eq(tracks.hackathonId, hackathonId));
  }

  async createTrack(hackathonId: string, data: CreateTrackDto) {
    const [row] = await this.db.insert(tracks).values({ hackathonId, ...data }).returning();
    return row;
  }

  async deleteTrack(id: string) {
    await this.db.delete(tracks).where(eq(tracks.id, id));
  }

  // ── Stages ──────────────────────────────────────────────
  async findStages(hackathonId: string) {
    return this.db.select().from(stages).where(eq(stages.hackathonId, hackathonId));
  }

  async createStage(hackathonId: string, data: CreateStageDto) {
    const [row] = await this.db
      .insert(stages)
      .values({
        hackathonId,
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      })
      .returning();
    return row;
  }

  async deleteStage(id: string) {
    await this.db.delete(stages).where(eq(stages.id, id));
  }
}
