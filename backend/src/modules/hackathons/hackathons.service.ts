import type { HackathonsRepository, HackathonStatus } from './hackathons.repository';
import { NotFoundError } from '../../common/errors/http-errors';
import type {
  CreateHackathonDto,
  UpdateHackathonDto,
  CreateTrackDto,
  CreateStageDto,
} from './hackathons.schema';

export class HackathonsService {
  constructor(private readonly repo: HackathonsRepository) {}

  async list(page: number, limit: number, status?: HackathonStatus) {
    const { rows, total } = await this.repo.findAll(page, limit, status);
    return {
      data: rows,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id: string) {
    const h = await this.repo.findById(id);
    if (!h) throw new NotFoundError('Hackathon');
    return h;
  }

  async create(dto: CreateHackathonDto) {
    return this.repo.create(dto);
  }

  async update(id: string, dto: UpdateHackathonDto) {
    await this.getById(id);
    const updated = await this.repo.update(id, dto);
    if (!updated) throw new NotFoundError('Hackathon');
    return updated;
  }

  async remove(id: string) {
    await this.getById(id);
    await this.repo.remove(id);
  }

  async listTracks(hackathonId: string) {
    await this.getById(hackathonId);
    return this.repo.findTracks(hackathonId);
  }

  async createTrack(hackathonId: string, dto: CreateTrackDto) {
    await this.getById(hackathonId);
    return this.repo.createTrack(hackathonId, dto);
  }

  async deleteTrack(id: string) {
    await this.repo.deleteTrack(id);
  }

  async listStages(hackathonId: string) {
    await this.getById(hackathonId);
    return this.repo.findStages(hackathonId);
  }

  async createStage(hackathonId: string, dto: CreateStageDto) {
    await this.getById(hackathonId);
    return this.repo.createStage(hackathonId, dto);
  }

  async deleteStage(id: string) {
    await this.repo.deleteStage(id);
  }
}
