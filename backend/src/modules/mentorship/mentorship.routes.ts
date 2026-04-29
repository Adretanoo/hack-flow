import type { FastifyInstance } from 'fastify';
import { MentorshipController } from './mentorship.controller';
import { MentorshipService } from './mentorship.service';
import { MentorshipRepository } from './mentorship.repository';
import { AuditLogRepository } from '../audit-log/audit-log.repository';
import { getDatabaseConnection } from '../../config/database';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';

const Sec = [{ bearerAuth: [] }];

export async function mentorshipRoutes(app: FastifyInstance): Promise<void> {
  const db = getDatabaseConnection();
  const repository = new MentorshipRepository(db);
  const auditLog = new AuditLogRepository(db);
  const service = new MentorshipService(repository, auditLog);
  const ctrl = new MentorshipController(service);

  app.get('/availabilities', {
    schema: {
      tags: ['Mentorship'],
      summary: 'List all mentor availabilities',
      description: 'Optionally filter by ?hackathonId=UUID.',
      querystring: { type: 'object', properties: { hackathonId: { type: 'string', format: 'uuid' } } },
    },
  }, (req, reply) => ctrl.listAllAvailabilities(req, reply));

  app.get('/availabilities/mentor/:id', {
    schema: {
      tags: ['Mentorship'],
      summary: "List a specific mentor's availabilities",
      querystring: { type: 'object', properties: { hackathonId: { type: 'string', format: 'uuid' } } },
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
    },
  }, (req, reply) => ctrl.listAvailabilities(req, reply));

  app.get('/availabilities/:id/slots', {
    onRequest: [authenticate],
    schema: {
      tags: ['Mentorship'],
      summary: 'Get booked slots for an availability window',
      security: Sec,
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
    },
  }, (req, reply) => ctrl.getSlots(req, reply));

  app.post('/availabilities', {
    onRequest: [authenticate, authorize('mentor')],
    schema: {
      tags: ['Mentorship'],
      summary: 'Create a mentor availability window — mentor only',
      security: Sec,
      body: {
        type: 'object',
        required: ['startDatetime', 'endDatetime'],
        properties: {
          hackathonId: { type: 'string', format: 'uuid' },
          trackId: { type: 'string', format: 'uuid' },
          startDatetime: { type: 'string', format: 'date-time' },
          endDatetime: { type: 'string', format: 'date-time' },
          maxConcurrentSessions: { type: 'integer', minimum: 1, default: 1 },
          meetingLink: { type: 'string' },
          topics: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  }, (req, reply) => ctrl.createAvailability(req, reply));

  app.delete('/availabilities/:id', {
    onRequest: [authenticate, authorize('mentor')],
    schema: {
      tags: ['Mentorship'],
      summary: 'Delete a mentor availability window — mentor only',
      security: Sec,
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
    },
  }, (req, reply) => ctrl.deleteAvailability(req, reply));

  app.post('/slots', {
    onRequest: [authenticate],
    schema: {
      tags: ['Mentorship'],
      summary: 'Book a mentor slot (Redis-distributed-lock)',
      description:
        'Uses a 10-second Redis lock per availability to prevent double-booking. ' +
        'Also schedules a 15-minute email reminder via Redis ZSET.',
      security: Sec,
      body: {
        type: 'object',
        required: ['mentorAvailabilityId', 'teamId', 'startDatetime', 'durationMinute'],
        properties: {
          mentorAvailabilityId: { type: 'string', format: 'uuid' },
          teamId: { type: 'string', format: 'uuid' },
          startDatetime: { type: 'string', format: 'date-time' },
          durationMinute: { type: 'integer', minimum: 15, maximum: 120 },
          meetingLink: { type: 'string' },
        },
      },
    },
  }, (req, reply) => ctrl.bookSlot(req, reply));

  app.patch('/slots/:id/status', {
    onRequest: [authenticate],
    schema: {
      tags: ['Mentorship'],
      summary: 'Update slot status (complete or cancel)',
      description: 'Cancellation removes any pending email reminder from the Redis ZSET.',
      security: Sec,
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      body: {
        type: 'object',
        required: ['status'],
        properties: { status: { type: 'string', enum: ['completed', 'cancelled'] } },
      },
    },
  }, (req, reply) => ctrl.updateSlotStatus(req, reply));
}
