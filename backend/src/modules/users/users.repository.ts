// Soft-delete filter: verified 2026-04-29
// findAll, findById, findByUsername, findLookingForTeam all filter isNull(users.deletedAt).
import type { Database } from '../../config/database';
import { users, userSocials, roles, userRoles } from '../../drizzle/schema';
import { eq, isNull, count, desc, and, sql, ilike } from 'drizzle-orm';
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

  async findAll(page: number, limit: number, search?: string, role?: string, lookingForTeam?: boolean) {
    const offset = (page - 1) * limit;
    
    const filters = [isNull(users.deletedAt)];
    if (search) {
      filters.push(sql`(${users.fullName} ILIKE ${'%' + search + '%'} OR ${users.username} ILIKE ${'%' + search + '%'})`);
    }
    if (lookingForTeam) filters.push(eq(users.isLookingForTeam, true));
    if (role) filters.push(eq(roles.name, role as any));

    const whereClause = and(...filters);

    const baseQuery = this.db
      .select({
        user: users,
        role: roles.name,
      })
      .from(users)
      .leftJoin(userRoles, eq(users.id, userRoles.userId))
      .leftJoin(roles, eq(roles.id, userRoles.roleId))
      .where(whereClause);

    const [rows, [{ total }]] = await Promise.all([
      baseQuery.orderBy(desc(users.createdAt)).limit(limit).offset(offset),
      this.db
        .select({ total: count(users.id) })
        .from(users)
        .leftJoin(userRoles, eq(users.id, userRoles.userId))
        .leftJoin(roles, eq(roles.id, userRoles.roleId))
        .where(whereClause),
    ]);

    // Format output to match existing UserProfile structure but with role included
    const enrichedRows = rows.map((r) => ({
      ...r.user,
      role: r.role ?? 'participant',
    }));

    return { rows: enrichedRows, total: Number(total) };
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
