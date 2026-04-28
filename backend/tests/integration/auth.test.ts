/**
 * AUTH FLOW integration tests
 * Covers: register, login, JWT access, protected routes, duplicate detection
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getTestApp, closeTestApp, inject } from '../helpers/app';
import { cleanupUsers, testDb } from '../helpers/db';
import { eq } from 'drizzle-orm';
import * as schema from '../../src/drizzle/schema';
import type { FastifyInstance } from 'fastify';

const TEST_EMAIL = `auth-test-${Date.now()}@hackflow.test`;
const TEST_USERNAME = `authuser${Date.now()}`;
const TEST_PASSWORD = 'Test1234!';

let app: FastifyInstance;
let accessToken: string;
let userId: string;

describe('AUTH FLOW', () => {
  beforeAll(async () => {
    app = await getTestApp();
  });

  afterAll(async () => {
    if (userId) await cleanupUsers([userId]);
    await closeTestApp();
  });

  it('POST /auth/register → 201 with tokens', async () => {
    const { status, body } = await inject(app, 'POST', '/api/v1/auth/register', {
      body: {
        email: TEST_EMAIL,
        username: TEST_USERNAME,
        fullName: 'Auth Test User',
        password: TEST_PASSWORD,
      },
    });

    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect((body.data as Record<string, unknown>).accessToken).toBeTruthy();
    expect((body.data as Record<string, unknown>).refreshToken).toBeTruthy();

    accessToken = (body.data as Record<string, unknown>).accessToken as string;

    // Resolve userId for cleanup
    const [user] = await testDb
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, TEST_EMAIL))
      .limit(1);
    userId = user.id;
  });

  it('POST /auth/register → 409 on duplicate email', async () => {
    const { status, body } = await inject(app, 'POST', '/api/v1/auth/register', {
      body: {
        email: TEST_EMAIL,
        username: `alt${TEST_USERNAME}`.slice(0, 30),
        fullName: 'Duplicate',
        password: TEST_PASSWORD,
      },
    });
    expect(status).toBe(409);
    expect(body.code).toBe('CONFLICT');
  });

  it('POST /auth/register → 409 on duplicate username', async () => {
    const { status, body } = await inject(app, 'POST', '/api/v1/auth/register', {
      body: {
        email: `alt${TEST_EMAIL}`,
        username: TEST_USERNAME,
        fullName: 'Duplicate',
        password: TEST_PASSWORD,
      },
    });
    expect(status).toBe(409);
    expect(body.code).toBe('CONFLICT');
  });

  it('POST /auth/login → 200 with tokens', async () => {
    const { status, body } = await inject(app, 'POST', '/api/v1/auth/login', {
      body: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });

    expect(status).toBe(200);
    expect((body.data as Record<string, unknown>).accessToken).toBeTruthy();

    accessToken = (body.data as Record<string, unknown>).accessToken as string;
  });

  it('POST /auth/login → 401 on wrong password', async () => {
    const { status, body } = await inject(app, 'POST', '/api/v1/auth/login', {
      body: { email: TEST_EMAIL, password: 'WrongPassword!' },
    });
    expect(status).toBe(401);
    expect(body.code).toBe('UNAUTHORIZED');
  });

  it('POST /auth/login → 401 on unknown email', async () => {
    const { status } = await inject(app, 'POST', '/api/v1/auth/login', {
      body: { email: 'nobody@hackflow.test', password: TEST_PASSWORD },
    });
    expect(status).toBe(401);
  });

  it('GET /users/me → 200 with valid JWT', async () => {
    const { status, body } = await inject(app, 'GET', '/api/v1/users/me', {
      token: accessToken,
    });
    expect(status).toBe(200);
    expect((body.data as Record<string, unknown>).email).toBe(TEST_EMAIL);
  });

  it('GET /users/me → 401 without token', async () => {
    const { status } = await inject(app, 'GET', '/api/v1/users/me');
    expect(status).toBe(401);
  });

  it('GET /users/me → 401 with malformed token', async () => {
    const { status } = await inject(app, 'GET', '/api/v1/users/me', {
      token: 'not.a.valid.jwt',
    });
    expect(status).toBe(401);
  });

  it('POST /auth/forgot-password → 200 (silent regardless of email existence)', async () => {
    const { status } = await inject(app, 'POST', '/api/v1/auth/forgot-password', {
      body: { email: 'nonexistent@hackflow.test' },
    });
    expect(status).toBe(200);
  });
});
