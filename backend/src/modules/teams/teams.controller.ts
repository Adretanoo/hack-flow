import type { FastifyRequest, FastifyReply } from 'fastify';
import type { TeamsService } from './teams.service';
import {
  CreateTeamSchema,
  UpdateTeamSchema,
  JoinTeamSchema,
  CreateInviteSchema,
  UuidParamSchema,
} from './teams.schema';
import type { JwtPayload } from '../../common/middleware/auth.middleware';

export class TeamsController {
  constructor(private readonly service: TeamsService) {}

  async getById(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const { id } = UuidParamSchema.parse(request.params);
    return reply.send({ success: true, data: await this.service.getById(id) });
  }

  async create(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const { sub } = request.user as JwtPayload;
    const body = CreateTeamSchema.parse(request.body);
    return reply.status(201).send({ success: true, data: await this.service.create(body, sub) });
  }

  async update(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const { sub } = request.user as JwtPayload;
    const { id } = UuidParamSchema.parse(request.params);
    const body = UpdateTeamSchema.parse(request.body);
    return reply.send({ success: true, data: await this.service.update(id, body, sub) });
  }

  async remove(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const { sub } = request.user as JwtPayload;
    const { id } = UuidParamSchema.parse(request.params);
    await this.service.remove(id, sub);
    return reply.status(204).send();
  }

  async getMembers(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const { id } = UuidParamSchema.parse(request.params);
    return reply.send({ success: true, data: await this.service.getMembers(id) });
  }

  async removeMember(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const { sub } = request.user as JwtPayload;
    const params = request.params as { id: string; userId: string };
    await this.service.removeMember(params.id, params.userId, sub);
    return reply.status(204).send();
  }

  async createInvite(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const { sub } = request.user as JwtPayload;
    const { id } = UuidParamSchema.parse(request.params);
    const body = CreateInviteSchema.parse(request.body);
    return reply.status(201).send({ success: true, data: await this.service.createInvite(id, body, sub) });
  }

  async joinViaToken(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const { sub } = request.user as JwtPayload;
    const { token } = JoinTeamSchema.parse(request.body);
    return reply.send({ success: true, data: await this.service.joinViaToken(token, sub) });
  }

  async updateApproval(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const { sub } = request.user as JwtPayload;
    const { id } = UuidParamSchema.parse(request.params);
    const body = request.body as { status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISQUALIFIED'; comment?: string };
    return reply.send({ success: true, data: await this.service.updateApproval(id, body.status, sub, body.comment) });
  }
}
