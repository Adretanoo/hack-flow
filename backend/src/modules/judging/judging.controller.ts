import type { FastifyRequest, FastifyReply } from 'fastify';
import type { JudgingService } from './judging.service';
import {
  CreateCriteriaSchema,
  SubmitScoreSchema,
  ReportConflictSchema,
  UuidParamSchema,
} from './judging.schema';
import type { JwtPayload } from '../../common/middleware/auth.middleware';

export class JudgingController {
  constructor(private readonly service: JudgingService) {}

  async listCriteria(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const { id } = UuidParamSchema.parse(request.params);
    return reply.send({ success: true, data: await this.service.listCriteria(id) });
  }

  async createCriteria(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const body = CreateCriteriaSchema.parse(request.body);
    return reply.status(201).send({ success: true, data: await this.service.createCriteria(body) });
  }

  async deleteCriteria(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const { id } = UuidParamSchema.parse(request.params);
    await this.service.deleteCriteria(id);
    return reply.status(204).send();
  }

  async getProjectScores(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const { id } = UuidParamSchema.parse(request.params);
    return reply.send({ success: true, data: await this.service.getScoresForProject(id) });
  }

  async submitScore(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const { sub } = request.user as JwtPayload;
    const body = SubmitScoreSchema.parse(request.body);
    return reply.send({ success: true, data: await this.service.submitScore(sub, body) });
  }

  async listConflicts(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const { sub } = request.user as JwtPayload;
    return reply.send({ success: true, data: await this.service.listConflicts(sub) });
  }

  async reportConflict(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const { sub } = request.user as JwtPayload;
    const body = ReportConflictSchema.parse(request.body);
    return reply.status(201).send({ success: true, data: await this.service.reportConflict(sub, body) });
  }
}
