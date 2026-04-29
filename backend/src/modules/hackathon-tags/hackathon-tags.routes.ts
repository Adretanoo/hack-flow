import type { FastifyInstance } from 'fastify';
import { HackathonTagsController } from './hackathon-tags.controller';
import { HackathonTagsService } from './hackathon-tags.service';
import { HackathonTagsRepository } from './hackathon-tags.repository';
import { getDatabaseConnection } from '../../config/database';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';

export async function hackathonTagsRoutes(app: FastifyInstance): Promise<void> {
  const db = getDatabaseConnection();
  const repo = new HackathonTagsRepository(db);
  const service = new HackathonTagsService(repo);
  const ctrl = new HackathonTagsController(service);

  // ── Global tag management ──────────────────────────────────────────────

  app.get('/tags', {
    schema: { tags: ['Tags'], summary: 'List all tags (public, for autocomplete)' },
  }, (req, reply) => ctrl.listTags(req, reply));

  app.post('/tags', {
    onRequest: [authenticate, authorize('admin')],
    schema: { tags: ['Tags'], summary: 'Create a new tag (admin)' },
  }, (req, reply) => ctrl.createTag(req, reply));

  app.delete('/tags/:tagId', {
    onRequest: [authenticate, authorize('admin')],
    schema: { tags: ['Tags'], summary: 'Delete a tag if unused (admin)' },
  }, (req, reply) => ctrl.deleteTag(req, reply));

  // ── Per-hackathon tag assignment ────────────────────────────────────────

  app.get('/hackathons/:hackathonId/tags', {
    schema: { tags: ['Tags'], summary: 'List tags attached to a hackathon (public)' },
  }, (req, reply) => ctrl.listHackathonTags(req, reply));

  app.post('/hackathons/:hackathonId/tags', {
    onRequest: [authenticate, authorize('admin')],
    schema: { tags: ['Tags'], summary: 'Attach tags to a hackathon (admin)' },
  }, (req, reply) => ctrl.attachTags(req, reply));

  app.delete('/hackathons/:hackathonId/tags/:tagId', {
    onRequest: [authenticate, authorize('admin')],
    schema: { tags: ['Tags'], summary: 'Detach a tag from a hackathon (admin)' },
  }, (req, reply) => ctrl.detachTag(req, reply));
}
