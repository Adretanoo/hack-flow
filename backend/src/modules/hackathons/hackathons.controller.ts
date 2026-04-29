import type { FastifyRequest, FastifyReply } from 'fastify';
import type { HackathonsService } from './hackathons.service';
import {
  CreateHackathonSchema,
  UpdateHackathonSchema,
  CreateTrackSchema,
  CreateStageSchema,
  UuidParamSchema,
  PaginationSchema,
} from './hackathons.schema';

export class HackathonsController {
  constructor(private readonly service: HackathonsService) {}

  async list(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const query = PaginationSchema.parse(request.query);
    const result = await this.service.list(query.page, query.limit, query.status);
    return reply.send({ success: true, ...result });
  }

  async getById(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const { id } = UuidParamSchema.parse(request.params);
    return reply.send({ success: true, data: await this.service.getById(id) });
  }

  async create(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const body = CreateHackathonSchema.parse(request.body);
    return reply.status(201).send({ success: true, data: await this.service.create(body) });
  }

  async update(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const { id } = UuidParamSchema.parse(request.params);
    const body = UpdateHackathonSchema.parse(request.body);
    return reply.send({ success: true, data: await this.service.update(id, body) });
  }

  async remove(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const { id } = UuidParamSchema.parse(request.params);
    await this.service.remove(id);
    return reply.status(204).send();
  }

  async listTracks(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const { id } = UuidParamSchema.parse(request.params);
    return reply.send({ success: true, data: await this.service.listTracks(id) });
  }

  async createTrack(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const { id } = UuidParamSchema.parse(request.params);
    const body = CreateTrackSchema.parse(request.body);
    return reply.status(201).send({ success: true, data: await this.service.createTrack(id, body) });
  }

  async deleteTrack(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const { id } = UuidParamSchema.parse(request.params);
    await this.service.deleteTrack(id);
    return reply.status(204).send();
  }

  async listStages(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const { id } = UuidParamSchema.parse(request.params);
    return reply.send({ success: true, data: await this.service.listStages(id) });
  }

  async createStage(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const { id } = UuidParamSchema.parse(request.params);
    const body = CreateStageSchema.parse(request.body);
    return reply.status(201).send({ success: true, data: await this.service.createStage(id, body) });
  }

  async deleteStage(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const { id } = UuidParamSchema.parse(request.params);
    await this.service.deleteStage(id);
    return reply.status(204).send();
  }
}
