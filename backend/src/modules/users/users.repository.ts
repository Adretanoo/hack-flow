// Soft-delete filter: verified 2026-04-29
// findAll, findById, findByUsername, findLookingForTeam all filter isNull(users.deletedAt).
import type { Database } from '../../config/database';
import { users, userSocials } from '../../drizzle/schema';
import { eq, isNull, count, desc, and, sql } from 'drizzle-orm';
import type { UpdateProfileDto, AddSocialDto } from './users.schema';

export class UsersRepository {
  constructor(private readonly db: Database) {}

  async findById(id: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);
    return user ?? null;
  }

  async findByUsername(username: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.username, username), isNull(users.deletedAt)))
      .limit(1);
    return user ?? null;
  }

  async findAll(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const where = isNull(users.deletedAt);
    const [rows, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(users)
        .where(where)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(users).where(where),
    ]);
    return { rows, total: Number(total) };
  }

  async findLookingForTeam(hackathonId?: string, skills?: string[]) {
    // Base: looking for team and not deleted
    const conditions = [
      eq(users.isLookingForTeam, true),
      isNull(users.deletedAt),
    ];

    // Skills overlap using Postgres JSONB @> or && operator
    if (skills && skills.length > 0) {
      // skills column is jsonb array — use @? or jsonb_exists_any
      // Cast to text[] for overlap check
      conditions.push(
        sql`${users.skills}::jsonb ?| array[${sql.join(
          skills.map((s) => sql`${s}`),
          sql`, `,
        )}]`,
      );
    }

    return this.db
      .select()
      .from(users)
      .where(and(...conditions))
      .limit(100);
  }

  async softDelete(id: string) {
    await this.db
      .update(users)
      .set({ deletedAt: new Date() })
      .where(eq(users.id, id));
  }

  async updateProfile(id: string, data: UpdateProfileDto) {
    const [updated] = await this.db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async getSocials(userId: string) {
    return this.db.select().from(userSocials).where(eq(userSocials.userId, userId));
  }

  async addSocial(userId: string, data: AddSocialDto) {
    const [social] = await this.db
      .insert(userSocials)
      .values({ userId, ...data })
      .returning();
    return social;
  }

  async deleteSocial(id: string) {
    await this.db.delete(userSocials).where(eq(userSocials.id, id));
  }
}
