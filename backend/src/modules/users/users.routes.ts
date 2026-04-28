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

  // All users routes require authentication
  app.addHook('onRequest', authenticate);

  app.get('/me', { schema: { tags: ['Users'], summary: 'Get current user profile' } },
    (req, reply) => controller.getMe(req, reply),
  );

  app.patch('/me', { schema: { tags: ['Users'], summary: 'Update current user profile' } },
    (req, reply) => controller.updateMe(req, reply),
  );

  app.get('/:id', { schema: { tags: ['Users'], summary: 'Get user by ID' } },
    (req, reply) => controller.getById(req, reply),
  );

  app.get('/me/socials', { schema: { tags: ['Users'], summary: 'List current user socials' } },
    (req, reply) => controller.getSocials(req, reply),
  );

  app.post('/me/socials', { schema: { tags: ['Users'], summary: 'Add a social link' } },
    (req, reply) => controller.addSocial(req, reply),
  );

  app.delete('/me/socials/:id', { schema: { tags: ['Users'], summary: 'Remove a social link' } },
    (req, reply) => controller.deleteSocial(req, reply),
  );
}
