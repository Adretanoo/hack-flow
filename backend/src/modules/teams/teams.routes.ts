import type { FastifyInstance } from 'fastify';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { TeamsRepository } from './teams.repository';
import { getDatabaseConnection } from '../../config/database';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';

export async function teamsRoutes(app: FastifyInstance): Promise<void> {
  const db = getDatabaseConnection();
  const repository = new TeamsRepository(db);
  const service = new TeamsService(repository);
  const ctrl = new TeamsController(service);

  app.get('/:id', { schema: { tags: ['Teams'], summary: 'Get team by ID' } },
    (req, reply) => ctrl.getById(req, reply),
  );

  app.get('/:id/members', { schema: { tags: ['Teams'], summary: 'List team members' } },
    (req, reply) => ctrl.getMembers(req, reply),
  );

  app.post('/', {
    onRequest: [authenticate],
    schema: { tags: ['Teams'], summary: 'Create a new team' },
  }, (req, reply) => ctrl.create(req, reply));

  app.patch('/:id', {
    onRequest: [authenticate],
    schema: { tags: ['Teams'], summary: 'Update team (captain only)' },
  }, (req, reply) => ctrl.update(req, reply));

  app.delete('/:id', {
    onRequest: [authenticate],
    schema: { tags: ['Teams'], summary: 'Delete team (captain only)' },
  }, (req, reply) => ctrl.remove(req, reply));

  app.delete('/:id/members/:userId', {
    onRequest: [authenticate],
    schema: { tags: ['Teams'], summary: 'Remove a member (captain only)' },
  }, (req, reply) => ctrl.removeMember(req, reply));

  app.post('/:id/invites', {
    onRequest: [authenticate],
    schema: { tags: ['Teams'], summary: 'Generate an invite link (captain only)' },
  }, (req, reply) => ctrl.createInvite(req, reply));

  app.post('/join', {
    onRequest: [authenticate],
    schema: { tags: ['Teams'], summary: 'Join a team via invite token' },
  }, (req, reply) => ctrl.joinViaToken(req, reply));

  app.patch('/:id/approval', {
    onRequest: [authenticate, authorize('admin')],
    schema: { tags: ['Teams'], summary: 'Update team approval status (admin only)' },
  }, (req, reply) => ctrl.updateApproval(req, reply));
}
