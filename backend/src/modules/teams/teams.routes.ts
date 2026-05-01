import type { FastifyInstance } from 'fastify';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { TeamsRepository } from './teams.repository';
import { AuditLogRepository } from '../audit-log/audit-log.repository';
import { getDatabaseConnection } from '../../config/database';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';
import { z } from 'zod';

const TeamListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  hackathon_id: z.string().uuid().optional(),
  track_id: z.string().uuid().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
});

const Sec = [{ bearerAuth: [] }];

export async function teamsRoutes(app: FastifyInstance): Promise<void> {
  const db = getDatabaseConnection();
  const repository = new TeamsRepository(db);
  const auditLog = new AuditLogRepository(db);
  const service = new TeamsService(repository, auditLog);
  const ctrl = new TeamsController(service);

  app.get('/', {
    schema: {
      tags: ['Teams'],
      summary: 'List teams (paginated, filterable)',
      description: 'Filter by ?hackathon_id=UUID and/or ?track_id=UUID.',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          hackathon_id: { type: 'string', format: 'uuid' },
          track_id: { type: 'string', format: 'uuid' },
          status: { type: 'string' },
          search: { type: 'string' },
        },
      },
    },
  }, async (req, reply) => {
    const q = TeamListQuerySchema.parse(req.query);
    const result = await service.list(q.page, q.limit, q.hackathon_id, q.track_id, q.status, q.search);
    return reply.send({ success: true, ...result });
  });

  app.get('/:id', {
    schema: {
      tags: ['Teams'],
      summary: 'Get team by ID',
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
    },
  }, (req, reply) => ctrl.getById(req, reply));

  app.get('/:id/members', {
    schema: {
      tags: ['Teams'],
      summary: 'List team members',
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
    },
  }, (req, reply) => ctrl.getMembers(req, reply));

  app.post('/', {
    onRequest: [authenticate],
    schema: {
      tags: ['Teams'],
      summary: 'Create a new team',
      description: 'The requester automatically becomes the team captain.',
      security: Sec,
      body: {
        type: 'object',
        required: ['name', 'hackathonId'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
          logo: { type: 'string' },
          hackathonId: { type: 'string', format: 'uuid' },
          trackId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, (req, reply) => ctrl.create(req, reply));

  app.patch('/:id', {
    onRequest: [authenticate],
    schema: {
      tags: ['Teams'],
      summary: 'Update team (captain only)',
      security: Sec,
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 100 },
          description: { type: 'string' },
          logo: { type: 'string' },
          trackId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, (req, reply) => ctrl.update(req, reply));

  app.delete('/:id', {
    onRequest: [authenticate],
    schema: {
      tags: ['Teams'],
      summary: 'Delete team (captain only)',
      security: Sec,
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
    },
  }, (req, reply) => ctrl.remove(req, reply));

  app.delete('/:id/members/:userId', {
    onRequest: [authenticate],
    schema: {
      tags: ['Teams'],
      summary: 'Remove a member from the team (captain only)',
      security: Sec,
      params: {
        type: 'object',
        required: ['id', 'userId'],
        properties: { id: { type: 'string', format: 'uuid' }, userId: { type: 'string', format: 'uuid' } },
      },
    },
  }, (req, reply) => ctrl.removeMember(req, reply));

  app.post('/:id/invites', {
    onRequest: [authenticate],
    schema: {
      tags: ['Teams'],
      summary: 'Generate an invite link (captain only)',
      security: Sec,
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      body: {
        type: 'object',
        properties: {
          maxUses: { type: 'integer', minimum: 1, default: 10 },
          expiresInHours: { type: 'integer', minimum: 1, default: 24 },
        },
      },
    },
  }, (req, reply) => ctrl.createInvite(req, reply));

  app.post('/join', {
    onRequest: [authenticate],
    schema: {
      tags: ['Teams'],
      summary: 'Join a team via invite token',
      description: 'Audit-logged — creates a `join_team` event in user_action_logs.',
      security: Sec,
      body: {
        type: 'object',
        required: ['token'],
        properties: { token: { type: 'string', description: 'Invite token from POST /:id/invites' } },
      },
    },
  }, (req, reply) => ctrl.joinViaToken(req, reply));

  app.patch('/:id/approval', {
    onRequest: [authenticate, authorize('admin')],
    schema: {
      tags: ['Teams'],
      summary: 'Update team approval status — admin only',
      security: Sec,
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED', 'DISQUALIFIED'] },
          comment: { type: 'string' },
        },
      },
    },
  }, (req, reply) => ctrl.updateApproval(req, reply));
}
