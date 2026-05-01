import type { Database } from '../../config/database';
import { hackathons, stages, tracks, awards } from '../../drizzle/schema';
import { eq, desc, count, lt, gt, and, lte, gte, inArray, ne, ilike } from 'drizzle-orm';
import type { CreateHackathonDto, UpdateHackathonDto, CreateTrackDto, CreateStageDto } from './hackathons.schema';

export type HackathonStatus = 'upcoming' | 'active' | 'past';

export class HackathonsRepository {
  constructor(private readonly db: Database) {}

  async findAll(page: number, limit: number, status?: HackathonStatus, tagIds?: string[], publishStatus?: string, search?: string) {
    const offset = (page - 1) * limit;
    const now = new Date();

    const filters = [];

    if (status === 'upcoming') filters.push(gt(hackathons.startDate, now));
    else if (status === 'active') filters.push(and(lte(hackathons.startDate, now), gte(hackathons.endDate, now)));
    else if (status === 'past') filters.push(lt(hackathons.endDate, now));

    if (tagIds && tagIds.length > 0) filters.push(inArray(hackathons.id, tagIds));
    
    if (publishStatus) filters.push(eq(hackathons.status, publishStatus as any));
    
    if (search) filters.push(ilike(hackathons.title, `%${search}%`));

    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    const [rows, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(hackathons)
        .where(whereClause)
        .orderBy(desc(hackathons.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(hackathons).where(whereClause),
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

  // ── Status transitions ──────────────────────────────────────

  /**
   * Returns all non-ARCHIVED hackathons with their stages joined.
   * Used by the status-cron worker every minute.
   */
  async findHackathonsForStatusCheck() {
    const rows = await this.db
      .select({
        id: hackathons.id,
        title: hackathons.title,
        status: hackathons.status,
        stageId: stages.id,
        stageName: stages.name,
        stageStart: stages.startDate,
        stageEnd: stages.endDate,
        stageOrder: stages.orderIndex,
      })
      .from(hackathons)
      .leftJoin(stages, eq(stages.hackathonId, hackathons.id))
      .where(ne(hackathons.status, 'ARCHIVED'))
      .orderBy(hackathons.createdAt, stages.orderIndex);

    // Group rows into hackathon + stages[]
    const map = new Map<string, {
      id: string;
      title: string;
      status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
      stages: Array<{ id: string; name: string; startDate: Date; endDate: Date; orderIndex: number }>;
    }>();

    for (const row of rows) {
      if (!map.has(row.id)) {
        map.set(row.id, { id: row.id, title: row.title, status: row.status, stages: [] });
      }
      if (row.stageId) {
        map.get(row.id)!.stages.push({
          id: row.stageId,
          name: row.stageName!,
          startDate: row.stageStart!,
          endDate: row.stageEnd!,
          orderIndex: row.stageOrder!,
        });
      }
    }

    return [...map.values()];
  }

  /** Update hackathon status directly — used by cron and manual override. */
  async updateStatus(id: string, status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') {
    const [row] = await this.db
      .update(hackathons)
      .set({ status, updatedAt: new Date() })
      .where(eq(hackathons.id, id))
      .returning();
    return row ?? null;
  }

  /** Fetch a hackathon together with its stages — for active-stage enrichment. */
  async findWithStages(id: string) {
    const h = await this.findById(id);
    if (!h) return null;
    const hackathonStages = await this.db
      .select()
      .from(stages)
      .where(eq(stages.hackathonId, id))
      .orderBy(stages.orderIndex);
    return { ...h, stages: hackathonStages };
  }

  /** Count stages for a hackathon — used by manual override validation. */
  async countStages(hackathonId: string) {
    const [{ total }] = await this.db
      .select({ total: count() })
      .from(stages)
      .where(eq(stages.hackathonId, hackathonId));
    return Number(total);
  }

  async updateTrack(id: string, data: any) {
    const [row] = await this.db.update(tracks).set(data).where(eq(tracks.id, id)).returning();
    return row ?? null;
  }

  async updateStage(id: string, data: any) {
    const [row] = await this.db.update(stages).set(data).where(eq(stages.id, id)).returning();
    return row ?? null;
  }

  async updateAward(id: string, data: any) {
    const [row] = await this.db.update(awards).set(data).where(eq(awards.id, id)).returning();
    return row ?? null;
  }
}
