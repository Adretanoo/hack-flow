import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { env } from '../config/env';

export default fp(async function swaggerPlugin(app: FastifyInstance): Promise<void> {
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'HackFlow API',
        description: 'Hackathon management platform API',
        version: '1.0.0',
        contact: {
          name: 'HackFlow Team',
          email: 'contact@hackflow.dev',
        },
      },
      servers: [
        {
          url: `http://localhost:${env.PORT}${env.API_PREFIX}`,
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ bearerAuth: [] }],
      tags: [
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'Users', description: 'User management' },
        { name: 'Hackathons', description: 'Hackathon management' },
        { name: 'Teams', description: 'Team management' },
        { name: 'Projects', description: 'Project submissions' },
        { name: 'Judging', description: 'Scoring and judging' },
        { name: 'Mentorship', description: 'Mentor booking' },
        { name: 'Health', description: 'Health checks' },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      persistAuthorization: true,
    },
    staticCSP: true,
  });
});
