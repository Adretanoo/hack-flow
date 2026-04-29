import type { FastifyInstance } from 'fastify';
import { HackathonsController } from './hackathons.controller';
import { HackathonsService } from './hackathons.service';
import { HackathonsRepository } from './hackathons.repository';
import { HackathonTagsRepository } from '../hackathon-tags/hackathon-tags.repository';
import { AuditLogRepository } from '../audit-log/audit-log.repository';
import { getDatabaseConnection } from '../../config/database';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';

export async function hackathonsRoutes(app: FastifyInstance): Promise<void> {
  const db = getDatabaseConnection();
  const repository = new HackathonsRepository(db);
  const tagsRepository = new HackathonTagsRepository(db);
  const auditLog = new AuditLogRepository(db);
  const service = new HackathonsService(repository, tagsRepository, auditLog);
  const ctrl = new HackathonsController(service);

  // Public read routes
  app.get('/', { schema: { tags: ['Hackathons'], summary: 'List all hackathons' } },
    (req, reply) => ctrl.list(req, reply),
  );

  app.get('/:id', { schema: { tags: ['Hackathons'], summary: 'Get hackathon by ID' } },
    (req, reply) => ctrl.getById(req, reply),
  );

  app.get('/:id/tracks', { schema: { tags: ['Hackathons'], summary: 'List tracks for a hackathon' } },
    (req, reply) => ctrl.listTracks(req, reply),
  );

  app.get('/:id/stages', { schema: { tags: ['Hackathons'], summary: 'List stages for a hackathon' } },
    (req, reply) => ctrl.listStages(req, reply),
  );

  // Admin-only write routes
  app.post('/', {
    onRequest: [authenticate, authorize('admin')],
    schema: { tags: ['Hackathons'], summary: 'Create a new hackathon' },
  }, (req, reply) => ctrl.create(req, reply));

  app.patch('/:id', {
    onRequest: [authenticate, authorize('admin')],
    schema: { tags: ['Hackathons'], summary: 'Update a hackathon' },
  }, (req, reply) => ctrl.update(req, reply));

  app.delete('/:id', {
    onRequest: [authenticate, authorize('admin')],
    schema: { tags: ['Hackathons'], summary: 'Delete a hackathon' },
  }, (req, reply) => ctrl.remove(req, reply));

  app.post('/:id/tracks', {
    onRequest: [authenticate, authorize('admin')],
    schema: { tags: ['Hackathons'], summary: 'Add a track to a hackathon' },
  }, (req, reply) => ctrl.createTrack(req, reply));

  app.delete('/tracks/:id', {
    onRequest: [authenticate, authorize('admin')],
    schema: { tags: ['Hackathons'], summary: 'Delete a track' },
  }, (req, reply) => ctrl.deleteTrack(req, reply));

  app.post('/:id/stages', {
    onRequest: [authenticate, authorize('admin')],
    schema: { tags: ['Hackathons'], summary: 'Add a stage to a hackathon' },
  }, (req, reply) => ctrl.createStage(req, reply));

  app.delete('/stages/:id', {
    onRequest: [authenticate, authorize('admin')],
    schema: { tags: ['Hackathons'], summary: 'Delete a stage' },
  }, (req, reply) => ctrl.deleteStage(req, reply));

  // ── Manual status override ────────────────────────────────────────────────
  app.post('/:hackathonId/status', {
    onRequest: [authenticate, authorize('admin')],
    schema: { tags: ['Hackathons'], summary: 'Manually override hackathon status (admin)' },
  }, (req, reply) => ctrl.setStatus(req, reply));
}
