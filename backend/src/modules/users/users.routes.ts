import type { FastifyInstance } from 'fastify';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { getDatabaseConnection } from '../../config/database';
import { authenticate } from '../../common/middleware/auth.middleware';

export async function usersRoutes(app: FastifyInstance): Promise<void> {
  const db = getDatabaseConnection();
  const repository = new UsersRepository(db);
  const service = new UsersService(repository);
  const controller = new UsersController(service);

  // ── Public routes (no auth) ──────────────────────────────────────
  // Stay in the PARENT scope — parent hooks do NOT exist yet so they
  // are truly unauthenticated.
  app.get('/', {
    schema: {
      tags: ['Users'],
      summary: 'List all users (paginated)',
      description: 'Returns paginated list of users. Excludes soft-deleted accounts.',
    },
  }, (req, reply) => controller.list(req, reply));

  app.get('/looking-for-team', {
    schema: {
      tags: ['Users'],
      summary: 'Matchmaking — find users looking for a team',
      description:
        'Returns users with isLookingForTeam=true. ' +
        'Filter by ?hackathon_id=UUID and/or ?skills=js,python (comma-separated).',
    },
  }, (req, reply) => controller.lookingForTeam(req, reply));

  // ── Protected routes ─────────────────────────────────────────────
  // Registered inside a CHILD plugin that owns the authenticate hook.
  // In Fastify, hooks are scoped to the plugin that registers them and
  // their descendants — parent scope (public routes above) is NOT affected.
  app.register(async (auth) => {
    auth.addHook('onRequest', authenticate);

    auth.get('/me', {
      schema: { tags: ['Users'], summary: 'Get current user profile', security: [{ bearerAuth: [] }] },
    }, (req, reply) => controller.getMe(req, reply));

    auth.patch('/me', {
      schema: { tags: ['Users'], summary: 'Update current user profile', security: [{ bearerAuth: [] }] },
    }, (req, reply) => controller.updateMe(req, reply));

    auth.get('/:id', {
      schema: { tags: ['Users'], summary: 'Get user by ID', security: [{ bearerAuth: [] }] },
    }, (req, reply) => controller.getById(req, reply));

    auth.get('/me/socials', {
      schema: { tags: ['Users'], summary: 'List current user socials', security: [{ bearerAuth: [] }] },
    }, (req, reply) => controller.getSocials(req, reply));

    auth.post('/me/socials', {
      schema: { tags: ['Users'], summary: 'Add a social link', security: [{ bearerAuth: [] }] },
    }, (req, reply) => controller.addSocial(req, reply));

    auth.delete('/me/socials/:id', {
      schema: { tags: ['Users'], summary: 'Remove a social link', security: [{ bearerAuth: [] }] },
    }, (req, reply) => controller.deleteSocial(req, reply));
  });
}



