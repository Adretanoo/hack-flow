import type { FastifyInstance } from 'fastify';
import { JudgingController } from './judging.controller';
import { JudgingService } from './judging.service';
import { JudgingRepository } from './judging.repository';
import { getDatabaseConnection } from '../../config/database';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';

export async function judgingRoutes(app: FastifyInstance): Promise<void> {
  const db = getDatabaseConnection();
  const repository = new JudgingRepository(db);
  const service = new JudgingService(repository);
  const ctrl = new JudgingController(service);

  // Criteria — readable by all, writable by admins only
  app.get('/criteria/track/:id', {
    schema: { tags: ['Judging'], summary: 'List criteria for a track' },
  }, (req, reply) => ctrl.listCriteria(req, reply));

  app.post('/criteria', {
    onRequest: [authenticate, authorize('admin')],
    schema: { tags: ['Judging'], summary: 'Create scoring criteria' },
  }, (req, reply) => ctrl.createCriteria(req, reply));

  app.delete('/criteria/:id', {
    onRequest: [authenticate, authorize('admin')],
    schema: { tags: ['Judging'], summary: 'Delete scoring criteria' },
  }, (req, reply) => ctrl.deleteCriteria(req, reply));

  // Scores
  app.get('/scores/project/:id', {
    onRequest: [authenticate, authorize('admin', 'judge')],
    schema: { tags: ['Judging'], summary: 'Get all scores for a project' },
  }, (req, reply) => ctrl.getProjectScores(req, reply));

  app.post('/scores', {
    onRequest: [authenticate, authorize('judge')],
    schema: { tags: ['Judging'], summary: 'Submit or update a score (upsert)' },
  }, (req, reply) => ctrl.submitScore(req, reply));

  // Conflicts
  app.get('/conflicts', {
    onRequest: [authenticate, authorize('judge')],
    schema: { tags: ['Judging'], summary: 'List my reported conflicts' },
  }, (req, reply) => ctrl.listConflicts(req, reply));

  app.post('/conflicts', {
    onRequest: [authenticate, authorize('judge')],
    schema: { tags: ['Judging'], summary: 'Report a conflict of interest' },
  }, (req, reply) => ctrl.reportConflict(req, reply));
}
