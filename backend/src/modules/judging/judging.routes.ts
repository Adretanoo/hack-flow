import type { FastifyInstance } from 'fastify';
import { JudgingController } from './judging.controller';
import { JudgingService } from './judging.service';
import { JudgingRepository } from './judging.repository';
import { AuditLogRepository } from '../audit-log/audit-log.repository';
import { getDatabaseConnection } from '../../config/database';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';

export async function judgingRoutes(app: FastifyInstance): Promise<void> {
  const db = getDatabaseConnection();
  const repository = new JudgingRepository(db);
  const auditLog = new AuditLogRepository(db);
  const service = new JudgingService(repository, auditLog);
  const ctrl = new JudgingController(service);

  // Leaderboard — public
  app.get('/leaderboard/:id', {
    schema: {
      tags: ['Judging'],
      summary: 'Get ranked leaderboard for a hackathon',
      description:
        'Returns all projects sorted by normalized weighted score. ' +
        'Scores are bias-corrected using per-judge average normalization (score * global_avg / judge_avg). ' +
        'Results are cached in Redis for 60 seconds.',
    },
  }, (req, reply) => ctrl.getLeaderboard(req, reply));

  // Criteria — readable by all, writable by admins only
  app.get('/criteria/track/:id', {
    schema: { tags: ['Judging'], summary: 'List criteria for a track' },
  }, (req, reply) => ctrl.listCriteria(req, reply));

  app.post('/criteria', {
    onRequest: [authenticate, authorize('admin')],
    schema: {
      tags: ['Judging'],
      summary: 'Create scoring criteria',
      security: [{ bearerAuth: [] }],
    },
  }, (req, reply) => ctrl.createCriteria(req, reply));

  app.delete('/criteria/:id', {
    onRequest: [authenticate, authorize('admin')],
    schema: {
      tags: ['Judging'],
      summary: 'Delete scoring criteria',
      security: [{ bearerAuth: [] }],
    },
  }, (req, reply) => ctrl.deleteCriteria(req, reply));

  // Scores
  app.get('/scores/project/:id', {
    onRequest: [authenticate, authorize('admin', 'judge')],
    schema: {
      tags: ['Judging'],
      summary: 'Get all scores for a project',
      security: [{ bearerAuth: [] }],
    },
  }, (req, reply) => ctrl.getProjectScores(req, reply));

  app.post('/scores', {
    onRequest: [authenticate, authorize('judge')],
    schema: {
      tags: ['Judging'],
      summary: 'Submit or update a score (upsert)',
      security: [{ bearerAuth: [] }],
    },
  }, (req, reply) => ctrl.submitScore(req, reply));

  // Conflicts — admin view (all hackathons, paginated)
  app.get('/conflicts/all', {
    onRequest: [authenticate, authorize('admin')],
    schema: {
      tags: ['Judging'],
      summary: 'List all judge conflicts across all hackathons (admin)',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          hackathonId: { type: 'string', format: 'uuid' },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        },
      },
    },
  }, (req, reply) => ctrl.listAllConflicts(req, reply));

  // Conflicts — judge's own view
  app.get('/conflicts', {
    onRequest: [authenticate, authorize('judge')],
    schema: {
      tags: ['Judging'],
      summary: 'List my reported conflicts',
      security: [{ bearerAuth: [] }],
    },
  }, (req, reply) => ctrl.listConflicts(req, reply));

  app.post('/conflicts', {
    onRequest: [authenticate, authorize('judge')],
    schema: {
      tags: ['Judging'],
      summary: 'Report a conflict of interest',
      description:
        'Judges must declare conflicts with teams they are affiliated with. ' +
        'Conflicted judges are excluded from scoring for that team.',
      security: [{ bearerAuth: [] }],
    },
  }, (req, reply) => ctrl.reportConflict(req, reply));
}

