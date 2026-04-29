import type { FastifyInstance } from 'fastify';
import { JudgeTrackController } from './judge-track.controller';
import { JudgeTrackService } from './judge-track.service';
import { JudgeTrackRepository } from './judge-track.repository';
import { AuditLogRepository } from '../audit-log/audit-log.repository';
import { getDatabaseConnection } from '../../config/database';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';

export async function judgeTrackRoutes(app: FastifyInstance): Promise<void> {
  const db = getDatabaseConnection();
  const repo = new JudgeTrackRepository(db);
  const auditLog = new AuditLogRepository(db);
  const service = new JudgeTrackService(repo, auditLog);
  const ctrl = new JudgeTrackController(service);

  // ── Admin: hackathon-level judge assignments ────────────────────────────

  app.get('/hackathons/:hackathonId/judges', {
    onRequest: [authenticate, authorize('admin')],
    schema: {
      tags: ['JudgeTrack'],
      summary: 'List all judge→track assignments for a hackathon (admin)',
    },
  }, (req, reply) => ctrl.listByHackathon(req, reply));

  app.post('/hackathons/:hackathonId/judges', {
    onRequest: [authenticate, authorize('admin')],
    schema: {
      tags: ['JudgeTrack'],
      summary: 'Assign a judge to a track (admin)',
    },
  }, (req, reply) => ctrl.assign(req, reply));

  app.patch('/hackathons/:hackathonId/judges/:judgeTrackId', {
    onRequest: [authenticate, authorize('admin')],
    schema: {
      tags: ['JudgeTrack'],
      summary: 'Toggle isHeadJudge on an assignment (admin)',
    },
  }, (req, reply) => ctrl.update(req, reply));

  app.delete('/hackathons/:hackathonId/judges/:judgeTrackId', {
    onRequest: [authenticate, authorize('admin')],
    schema: {
      tags: ['JudgeTrack'],
      summary: 'Remove a judge→track assignment (admin)',
    },
  }, (req, reply) => ctrl.unassign(req, reply));

  // ── Authenticated: per-track judge list ─────────────────────────────────
  // Public to all authenticated users so participants can see who judges their track.

  app.get('/hackathons/:hackathonId/tracks/:trackId/judges', {
    onRequest: [authenticate],
    schema: {
      tags: ['JudgeTrack'],
      summary: 'List judges for a specific track (any authenticated user)',
    },
  }, (req, reply) => ctrl.listByTrack(req, reply));

  // ── Judge: my assigned tracks ───────────────────────────────────────────

  app.get('/judging/my-tracks', {
    onRequest: [authenticate, authorize('judge')],
    schema: {
      tags: ['JudgeTrack'],
      summary: 'Get tracks assigned to the current judge (?hackathonId=UUID)',
      querystring: {
        type: 'object',
        required: ['hackathonId'],
        properties: { hackathonId: { type: 'string', format: 'uuid' } },
      },
    },
  }, (req, reply) => ctrl.getMyTracks(req, reply));
}
