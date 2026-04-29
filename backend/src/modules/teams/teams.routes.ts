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
});

export async function teamsRoutes(app: FastifyInstance): Promise<void> {
  const db = getDatabaseConnection();
  const repository = new TeamsRepository(db);
  const auditLog = new AuditLogRepository(db);
  const service = new TeamsService(repository, auditLog);
  const ctrl = new TeamsController(service);

  // Paginated list — public
  app.get('/', {
    schema: {
      tags: ['Teams'],
      summary: 'List teams (paginated, filterable)',
      description: 'Filter by ?hackathon_id=UUID and/or ?track_id=UUID',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          hackathon_id: { type: 'string', format: 'uuid' },
          track_id: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, async (req, reply) => {
    const q = TeamListQuerySchema.parse(req.query);
    const result = await service.list(q.page, q.limit, q.hackathon_id, q.track_id);
    return reply.send({ success: true, ...result });
  });

  app.get('/:id', { schema: { tags: ['Teams'], summary: 'Get team by ID' } },
    (req, reply) => ctrl.getById(req, reply),
  );

  app.get('/:id/members', { schema: { tags: ['Teams'], summary: 'List team members' } },
    (req, reply) => ctrl.getMembers(req, reply),
  );

  app.post('/', {
    onRequest: [authenticate],
    schema: { tags: ['Teams'], summary: 'Create a new team', security: [{ bearerAuth: [] }] },
  }, (req, reply) => ctrl.create(req, reply));

  app.patch('/:id', {
    onRequest: [authenticate],
    schema: { tags: ['Teams'], summary: 'Update team (captain only)', security: [{ bearerAuth: [] }] },
  }, (req, reply) => ctrl.update(req, reply));

  app.delete('/:id', {
    onRequest: [authenticate],
    schema: { tags: ['Teams'], summary: 'Delete team (captain only)', security: [{ bearerAuth: [] }] },
  }, (req, reply) => ctrl.remove(req, reply));

  app.delete('/:id/members/:userId', {
    onRequest: [authenticate],
    schema: { tags: ['Teams'], summary: 'Remove a member (captain only)', security: [{ bearerAuth: [] }] },
  }, (req, reply) => ctrl.removeMember(req, reply));

  app.post('/:id/invites', {
    onRequest: [authenticate],
    schema: { tags: ['Teams'], summary: 'Generate an invite link (captain only)', security: [{ bearerAuth: [] }] },
  }, (req, reply) => ctrl.createInvite(req, reply));

  app.post('/join', {
    onRequest: [authenticate],
    schema: {
      tags: ['Teams'],
      summary: 'Join a team via invite token',
      security: [{ bearerAuth: [] }],
      description: 'Audit logged — creates join_team event in user_action_logs.',
    },
  }, (req, reply) => ctrl.joinViaToken(req, reply));

  app.patch('/:id/approval', {
    onRequest: [authenticate, authorize('admin')],
    schema: { tags: ['Teams'], summary: 'Update team approval status (admin only)', security: [{ bearerAuth: [] }] },
  }, (req, reply) => ctrl.updateApproval(req, reply));
}

