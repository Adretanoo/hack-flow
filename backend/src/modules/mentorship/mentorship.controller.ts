import type { FastifyRequest, FastifyReply } from 'fastify';
import type { MentorshipService } from './mentorship.service';
import {
  CreateAvailabilitySchema,
  BookSlotSchema,
  UpdateSlotStatusSchema,
  UuidParamSchema,
} from './mentorship.schema';
import type { JwtPayload } from '../../common/middleware/auth.middleware';

export class MentorshipController {
  constructor(private readonly service: MentorshipService) {}

  async listAvailabilities(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const { id } = UuidParamSchema.parse(request.params);
    return reply.send({ success: true, data: await this.service.listAvailabilities(id) });
  }

  async createAvailability(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const { sub } = request.user as JwtPayload;
    const body = CreateAvailabilitySchema.parse(request.body);
    return reply.status(201).send({ success: true, data: await this.service.createAvailability(sub, body) });
  }

  async deleteAvailability(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const { id } = UuidParamSchema.parse(request.params);
    await this.service.deleteAvailability(id);
    return reply.status(204).send();
  }

  async getSlots(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const { id } = UuidParamSchema.parse(request.params);
    return reply.send({ success: true, data: await this.service.getSlotsByAvailability(id) });
  }

  async bookSlot(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const body = BookSlotSchema.parse(request.body);
    return reply.status(201).send({ success: true, data: await this.service.bookSlot(body) });
  }

  async updateSlotStatus(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const { id } = UuidParamSchema.parse(request.params);
    const body = UpdateSlotStatusSchema.parse(request.body);
    return reply.send({ success: true, data: await this.service.updateSlotStatus(id, body) });
  }
}
