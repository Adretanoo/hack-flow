import type { FastifyRequest, FastifyReply } from 'fastify';
import type { AuthService } from './auth.service';
import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from './auth.schema';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async register(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const body = RegisterSchema.parse(request.body);
    const tokens = await this.authService.register(body);
    return reply.status(201).send({ success: true, data: tokens });
  }

  async login(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const body = LoginSchema.parse(request.body);
    const tokens = await this.authService.login(body);
    return reply.send({ success: true, data: tokens });
  }

  async forgotPassword(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const { email } = ForgotPasswordSchema.parse(request.body);
    await this.authService.forgotPassword(email);
    return reply.send({ success: true, message: 'If that email exists, a reset link was sent' });
  }

  async resetPassword(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const { token, password } = ResetPasswordSchema.parse(request.body);
    await this.authService.resetPassword(token, password);
    return reply.send({ success: true, message: 'Password updated successfully' });
  }
}
