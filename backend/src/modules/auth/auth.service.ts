import { AuthRepository } from './auth.repository';
import { hashPassword, verifyPassword } from '../../utils/password';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../common/errors/http-errors';
import type { RegisterDto, LoginDto } from './auth.schema';
import type { FastifyInstance } from 'fastify';
import { generateId } from '../../utils/uuid';
import type { JwtPayload } from '../../common/middleware/auth.middleware';
import { env } from '../../config/env';

export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly app: FastifyInstance,
  ) {}

  async register(dto: RegisterDto): Promise<{ accessToken: string; refreshToken: string }> {
    const existingEmail = await this.authRepository.findUserByEmail(dto.email);
    if (existingEmail) throw new ConflictError('Email is already in use');

    const existingUsername = await this.authRepository.findUserByUsername(dto.username);
    if (existingUsername) throw new ConflictError('Username is already taken');

    const passwordHash = await hashPassword(dto.password);

    const user = await this.authRepository.createUser({
      email: dto.email,
      username: dto.username,
      fullName: dto.fullName,
      passwordHash,
    });

    const userRoles = await this.authRepository.findUserRoles(user.id);
    return this.generateTokenPair({ sub: user.id, email: user.email, roles: userRoles });
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.authRepository.findUserByEmail(dto.email);
    if (!user) throw new UnauthorizedError('Invalid credentials');

    const valid = await verifyPassword(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedError('Invalid credentials');

    const userRoles = await this.authRepository.findUserRoles(user.id);
    return this.generateTokenPair({ sub: user.id, email: user.email, roles: userRoles });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.authRepository.findUserByEmail(email);
    if (!user) return; // Silent — don't leak user existence

    const token = generateId();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await this.authRepository.createToken({
      userId: user.id,
      token,
      type: 'PASSWORD_RESET',
      expiresAt,
    });

    // TODO: send email with reset link containing `token`
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const record = await this.authRepository.findToken(token, 'PASSWORD_RESET');
    if (!record || record.used || record.expiresAt < new Date()) {
      throw new NotFoundError('Reset token is invalid or expired');
    }

    const passwordHash = await hashPassword(newPassword);
    await this.authRepository.updateUserPassword(record.userId, passwordHash);
    await this.authRepository.markTokenUsed(record.id);
  }

  private generateTokenPair(payload: JwtPayload): { accessToken: string; refreshToken: string } {
    const accessToken = this.app.jwt.sign(payload, { expiresIn: env.JWT_ACCESS_EXPIRES_IN });
    const refreshToken = this.app.jwt.sign(payload, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });
    return { accessToken, refreshToken };
  }
}
