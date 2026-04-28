import type { FastifyInstance } from 'fastify';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectsRepository } from './projects.repository';
import { getDatabaseConnection } from '../../config/database';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';

export async function projectsRoutes(app: FastifyInstance): Promise<void> {
  const db = getDatabaseConnection();
  const repository = new ProjectsRepository(db);
  const service = new ProjectsService(repository);
  const ctrl = new ProjectsController(service);

  app.get('/:id', { schema: { tags: ['Projects'], summary: 'Get project by ID' } },
    (req, reply) => ctrl.getById(req, reply),
  );

  app.get('/:id/resources', { schema: { tags: ['Projects'], summary: 'List project resources' } },
    (req, reply) => ctrl.getResources(req, reply),
  );

  app.post('/', {
    onRequest: [authenticate],
    schema: { tags: ['Projects'], summary: 'Create a project draft' },
  }, (req, reply) => ctrl.create(req, reply));

  app.post('/:id/submit', {
    onRequest: [authenticate],
    schema: { tags: ['Projects'], summary: 'Submit project for review' },
  }, (req, reply) => ctrl.submit(req, reply));

  app.patch('/:id/review', {
    onRequest: [authenticate, authorize('admin', 'judge')],
    schema: { tags: ['Projects'], summary: 'Review a submitted project' },
  }, (req, reply) => ctrl.review(req, reply));

  app.post('/:id/resources', {
    onRequest: [authenticate],
    schema: { tags: ['Projects'], summary: 'Add a resource to a project' },
  }, (req, reply) => ctrl.addResource(req, reply));

  app.delete('/:id/resources/:resourceId', {
    onRequest: [authenticate],
    schema: { tags: ['Projects'], summary: 'Remove a resource from a project' },
  }, (req, reply) => ctrl.removeResource(req, reply));
}
