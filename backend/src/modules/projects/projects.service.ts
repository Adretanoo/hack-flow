import type { ProjectsRepository } from './projects.repository';
import { NotFoundError } from '../../common/errors/http-errors';
import type { CreateProjectDto, UpdateProjectDto, AddResourceDto } from './projects.schema';
import type { AuditLogRepository } from '../audit-log/audit-log.repository';

export class ProjectsService {
  constructor(
    private readonly repo: ProjectsRepository,
    private readonly auditLog?: AuditLogRepository,
  ) {}

  async getById(id: string) {
    const p = await this.repo.findById(id);
    if (!p) throw new NotFoundError('Project');
    return p;
  }

  async listByTeam(teamId: string) {
    return this.repo.findByTeam(teamId);
  }

  async create(dto: CreateProjectDto) {
    return this.repo.create(dto);
  }

  async submit(id: string, userId?: string) {
    await this.getById(id);
    const result = await this.repo.update(id, { status: 'SUBMITTED', submittedAt: new Date() });
    if (userId) {
      this.auditLog?.log(userId, 'submit_project', 'project', id).catch(() => undefined);
    }
    return result;
  }

  async review(id: string, dto: UpdateProjectDto) {
    await this.getById(id);
    return this.repo.update(id, { ...dto, reviewedAt: new Date() });
  }

  async addResource(projectId: string, dto: AddResourceDto) {
    await this.getById(projectId);
    return this.repo.addResource(projectId, dto);
  }

  async removeResource(projectId: string, resourceId: string) {
    await this.getById(projectId);
    await this.repo.removeResource(resourceId);
  }

  async getResources(projectId: string) {
    await this.getById(projectId);
    return this.repo.getResources(projectId);
  }
}

