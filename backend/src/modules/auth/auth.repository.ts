import type { Database } from '../../config/database';
import { users, userTokens, userRoles, roles } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import type { RegisterDto } from './auth.schema';

export class AuthRepository {
  constructor(private readonly db: Database) {}

  async findUserByEmail(email: string) {
    const [user] = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return user ?? null;
  }

  async findUserByUsername(username: string) {
    const [user] = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return user ?? null;
  }

  async createUser(data: Omit<RegisterDto, 'password'> & { passwordHash: string }) {
    const [user] = await this.db
      .insert(users)
      .values({
        email: data.email,
        username: data.username,
        fullName: data.fullName,
        passwordHash: data.passwordHash,
      })
      .returning();
    return user;
  }

  async createToken(data: {
    userId: string;
    token: string;
    type: 'EMAIL_CONFIRM' | 'PASSWORD_RESET' | 'CHANGE_EMAIL' | 'TWO_FACTOR' | 'GITHUB';
    expiresAt: Date;
  }) {
    const [record] = await this.db.insert(userTokens).values(data).returning();
    return record;
  }

  async findToken(token: string, type: typeof userTokens.$inferSelect.type) {
    const [record] = await this.db
      .select()
      .from(userTokens)
      .where(and(eq(userTokens.token, token), eq(userTokens.type, type)))
      .limit(1);
    return record ?? null;
  }

  async markTokenUsed(id: string) {
    await this.db.update(userTokens).set({ used: true }).where(eq(userTokens.id, id));
  }

  async updateUserPassword(userId: string, passwordHash: string) {
    await this.db.update(users).set({ passwordHash }).where(eq(users.id, userId));
  }

  async findUserRoles(userId: string): Promise<string[]> {
    const rows = await this.db
      .select({ name: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));
    return rows.map((r) => r.name);
  }
}
