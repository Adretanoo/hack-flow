// Soft-delete filter: verified 2026-04-29
// projects.deletedAt IS NULL added to all list/lookup queries.
import type { Database } from '../../config/database';
import { projects, projectResources } from '../../drizzle/schema';
import { eq, isNull, and } from 'drizzle-orm';
import type { CreateProjectDto, UpdateProjectDto, AddResourceDto } from './projects.schema';

export class ProjectsRepository {
  constructor(private readonly db: Database) {}

  async findById(id: string) {
    const [row] = await this.db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), isNull(projects.deletedAt)))
      .limit(1);
    return row ?? null;
  }

  async findByTeam(teamId: string) {
    return this.db
      .select()
      .from(projects)
      .where(and(eq(projects.teamId, teamId), isNull(projects.deletedAt)));
  }

  async create(data: CreateProjectDto) {
    const [row] = await this.db.insert(projects).values(data).returning();
    return row;
  }

  async update(id: string, data: UpdateProjectDto & { submittedAt?: Date; reviewedAt?: Date }) {
    const [row] = await this.db
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return row ?? null;
  }

  async addResource(projectId: string, data: AddResourceDto) {
    const [row] = await this.db
      .insert(projectResources)
      .values({ projectId, ...data })
      .returning();
    return row;
  }

  async removeResource(id: string) {
    await this.db.delete(projectResources).where(eq(projectResources.id, id));
  }

  async getResources(projectId: string) {
    return this.db.select().from(projectResources).where(eq(projectResources.projectId, projectId));
  }
}
