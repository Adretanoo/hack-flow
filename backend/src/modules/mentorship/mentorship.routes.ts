import type { FastifyInstance } from 'fastify';
import { MentorshipController } from './mentorship.controller';
import { MentorshipService } from './mentorship.service';
import { MentorshipRepository } from './mentorship.repository';
import { getDatabaseConnection } from '../../config/database';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';

export async function mentorshipRoutes(app: FastifyInstance): Promise<void> {
  const db = getDatabaseConnection();
  const repository = new MentorshipRepository(db);
  const service = new MentorshipService(repository);
  const ctrl = new MentorshipController(service);

  app.get('/availabilities/mentor/:id', {
    schema: { tags: ['Mentorship'], summary: 'List a mentor\'s availabilities' },
  }, (req, reply) => ctrl.listAvailabilities(req, reply));

  app.get('/availabilities/:id/slots', {
    onRequest: [authenticate],
    schema: { tags: ['Mentorship'], summary: 'Get slots for an availability window' },
  }, (req, reply) => ctrl.getSlots(req, reply));

  app.post('/availabilities', {
    onRequest: [authenticate, authorize('mentor')],
    schema: { tags: ['Mentorship'], summary: 'Create a mentor availability window' },
  }, (req, reply) => ctrl.createAvailability(req, reply));

  app.delete('/availabilities/:id', {
    onRequest: [authenticate, authorize('mentor')],
    schema: { tags: ['Mentorship'], summary: 'Delete an availability window' },
  }, (req, reply) => ctrl.deleteAvailability(req, reply));

  app.post('/slots', {
    onRequest: [authenticate],
    schema: { tags: ['Mentorship'], summary: 'Book a mentor slot (Redis-locked)' },
  }, (req, reply) => ctrl.bookSlot(req, reply));

  app.patch('/slots/:id/status', {
    onRequest: [authenticate],
    schema: { tags: ['Mentorship'], summary: 'Update slot status (complete / cancel)' },
  }, (req, reply) => ctrl.updateSlotStatus(req, reply));
}
