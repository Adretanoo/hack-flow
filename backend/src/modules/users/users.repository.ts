import type { Database } from '../../config/database';
import { users, userSocials } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import type { UpdateProfileDto, AddSocialDto } from './users.schema';

export class UsersRepository {
  constructor(private readonly db: Database) {}

  async findById(id: string) {
    const [user] = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return user ?? null;
  }

  async findByUsername(username: string) {
    const [user] = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return user ?? null;
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
