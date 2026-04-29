import type { FastifyInstance } from 'fastify';
import { JudgingController } from './judging.controller';
import { JudgingService } from './judging.service';
import { JudgingRepository } from './judging.repository';
import { AuditLogRepository } from '../audit-log/audit-log.repository';
import { getDatabaseConnection } from '../../config/database';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';

const Sec = [{ bearerAuth: [] }];

export async function judgingRoutes(app: FastifyInstance): Promise<void> {
  const db = getDatabaseConnection();
  const repository = new JudgingRepository(db);
  const auditLog = new AuditLogRepository(db);
  const service = new JudgingService(repository, auditLog);
  const ctrl = new JudgingController(service);

  app.get('/leaderboard/:id', {
    schema: {
      tags: ['Judging'],
      summary: 'Ranked leaderboard for a hackathon',
      description:
        'Projects sorted by normalized weighted score. Bias-corrected via per-judge average normalization. Cached in Redis for 60 s.',
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
    },
  }, (req, reply) => ctrl.getLeaderboard(req, reply));

  app.get('/criteria/track/:id', {
    schema: {
      tags: ['Judging'],
      summary: 'List scoring criteria for a track',
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
    },
  }, (req, reply) => ctrl.listCriteria(req, reply));

  app.post('/criteria', {
    onRequest: [authenticate, authorize('admin')],
    schema: {
      tags: ['Judging'],
      summary: 'Create scoring criteria — admin only',
      security: Sec,
      body: {
        type: 'object',
        required: ['trackId', 'name', 'maxScore', 'weight'],
        properties: {
          trackId: { type: 'string', format: 'uuid' },
          name: { type: 'string', minLength: 2, maxLength: 100 },
          description: { type: 'string' },
          maxScore: { type: 'number', minimum: 1 },
          weight: { type: 'number', minimum: 0 },
        },
      },
    },
  }, (req, reply) => ctrl.createCriteria(req, reply));

  app.delete('/criteria/:id', {
    onRequest: [authenticate, authorize('admin')],
    schema: {
      tags: ['Judging'],
      summary: 'Delete scoring criteria — admin only',
      security: Sec,
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
    },
  }, (req, reply) => ctrl.deleteCriteria(req, reply));

  app.get('/scores/project/:id', {
    onRequest: [authenticate, authorize('admin', 'judge')],
    schema: {
      tags: ['Judging'],
      summary: 'Get all scores for a project — admin/judge only',
      security: Sec,
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
    },
  }, (req, reply) => ctrl.getProjectScores(req, reply));

  app.post('/scores', {
    onRequest: [authenticate, authorize('judge')],
    schema: {
      tags: ['Judging'],
      summary: 'Submit or update a score (upsert) — judge only',
      description:
        'Audit-logged. If ENFORCE_JUDGE_TRACK=true, judge must be assigned to the project\'s track.',
      security: Sec,
      body: {
        type: 'object',
        required: ['projectId', 'criteriaId', 'assessment'],
        properties: {
          projectId: { type: 'string', format: 'uuid' },
          criteriaId: { type: 'string', format: 'uuid' },
          assessment: { type: 'number', minimum: 0 },
          comment: { type: 'string', maxLength: 500 },
        },
      },
    },
  }, (req, reply) => ctrl.submitScore(req, reply));

  app.get('/conflicts/all', {
    onRequest: [authenticate, authorize('admin')],
    schema: {
      tags: ['Judging'],
      summary: 'All judge conflicts across all hackathons — admin only',
      security: Sec,
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

  app.get('/conflicts', {
    onRequest: [authenticate, authorize('judge')],
    schema: {
      tags: ['Judging'],
      summary: 'List my declared conflicts — judge only',
      security: Sec,
    },
  }, (req, reply) => ctrl.listConflicts(req, reply));

  app.post('/conflicts', {
    onRequest: [authenticate, authorize('judge')],
    schema: {
      tags: ['Judging'],
      summary: 'Report a conflict of interest — judge only',
      description: 'Judges must declare affiliations with teams. Conflicted judges are excluded from scoring that team.',
      security: Sec,
      body: {
        type: 'object',
        required: ['teamId'],
        properties: {
          teamId: { type: 'string', format: 'uuid' },
          reason: { type: 'string', maxLength: 500 },
        },
      },
    },
  }, (req, reply) => ctrl.reportConflict(req, reply));
}
